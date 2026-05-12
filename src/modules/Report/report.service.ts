import { Request, Response } from "express";
import { Types } from "mongoose";

import {
  ReportModel,
  ReportStatusEnum,
  ReportTypeEnum,
} from "../../DataBase/models/aiReport.Model";

import { ScanModel } from "../../DataBase/models/Scan.Model";
import { VulnerabilityModel } from "../../DataBase/models/Vulnerability.Model";

import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from "../../utils/response/error.response";
import { reportQueue } from "../../queues/report.queue";
import cloudinary from "../../utils/cloudinary/cloudinary";

type GenerateReportParams = {
  scanId: string;
};
type GenerateReportQuery = {
  typeOfRisk?: string;
};
type GetReportStatusParams = {
  reportId: string;
};
type GetReportsByScanParams = {
  scanId: string;
};
type DeleteReportParams = {
  reportId: string;
};


export const generateReport = async (
  req: Request<GenerateReportParams, {}, {}, GenerateReportQuery>,
  res: Response
): Promise<Response> => {
  if (!req.user) {
    throw new UnauthorizedException("Unauthorized");
  }

  const { scanId } = req.params;
  const { typeOfRisk } = req.query;

  if (!scanId || !Types.ObjectId.isValid(scanId)) {
    throw new BadRequestException("Invalid scan id.");
  }

  if (!typeOfRisk || typeof typeOfRisk !== "string") {
    throw new BadRequestException("typeOfRisk query is required.");
  }

  const allowedTypes = Object.values(ReportTypeEnum);

  if (!allowedTypes.includes(typeOfRisk as ReportTypeEnum)) {
    throw new BadRequestException(
      `Invalid typeOfRisk. Allowed: ${allowedTypes.join(", ")}`
    );
  }

  const reportType = typeOfRisk as ReportTypeEnum;

  const scan = await ScanModel.findOne({
    _id: scanId,
    userId: req.user._id,
  }).select("_id userId status target");

  if (!scan) {
    throw new NotFoundException("Scan not found.");
  }

  const filter =
    reportType === ReportTypeEnum.ALL
      ? { scanId }
      : { scanId, risk: reportType };

  const totalVulnerabilities = await VulnerabilityModel.countDocuments(filter);

  if (totalVulnerabilities === 0) {
    throw new NotFoundException("No vulnerabilities found for this report type.");
  }
    const existingReport = await ReportModel.findOne({
    scanId,
    userId: req.user._id,
    typeOfRisk: reportType,
  });

  if (existingReport) {
    throw new ConflictException(
      "Report already generated for this scan and risk type."
    ); 
  }
  const reportName =
    reportType === ReportTypeEnum.ALL
      ? "Full Security Report"
      : `${reportType} Risk Security Report`;

  const report = await ReportModel.create({
    scanId,
    userId: req.user._id,
    typeOfRisk: reportType,
    reportName,
    status: ReportStatusEnum.PROCESSING,
    fileUrl: null,
    generationTimeMs: null,
    failureReason: null,
  });
  await reportQueue.add("generate-report", {
    reportId: report._id.toString(),
    scanId: scan._id.toString(),
    userId: req.user._id.toString(),
    typeOfRisk: reportType,
  });
  return res.status(202).json({
    message: "Report generation started successfully.",
    data: report,
  });
};

export const getReportStatus = async (
  req: Request<GetReportStatusParams>,
  res: Response
): Promise<Response> => {
  if (!req.user) {
    throw new UnauthorizedException("Unauthorized");
  }

  const { reportId } = req.params;

  if (!reportId || !Types.ObjectId.isValid(reportId)) {
    throw new BadRequestException("Invalid report id.");
  }

  const report = await ReportModel.findOne({
    _id: reportId,
    userId: req.user._id,
  });

  if (!report) {
    throw new NotFoundException("Report not found.");
  }

  return res.status(200).json({
    message: "Report status fetched successfully.",
    data: report,
  });
};

export const getReportsByScan = async (
  req: Request<GetReportsByScanParams>,
  res: Response
): Promise<Response> => {
  if (!req.user) {
    throw new UnauthorizedException("Unauthorized");
  }

  const { scanId } = req.params;

  if (!scanId || !Types.ObjectId.isValid(scanId)) {
    throw new BadRequestException("Invalid scan id.");
  }

  const scan = await ScanModel.findOne({
    _id: scanId,
    userId: req.user._id,
  });

  if (!scan) {
    throw new NotFoundException("Scan not found.");
  }

  const reports = await ReportModel.find({
    scanId,
    userId: req.user._id,
  }).sort({
    createdAt: -1,
  });

  return res.status(200).json({
    message: "Reports fetched successfully.",
    data: reports,
  });
};

export const deleteReport = async (
  req: Request<DeleteReportParams>,
  res: Response
): Promise<Response> => {
  if (!req.user) {
    throw new UnauthorizedException("Unauthorized");
  }

  const { reportId } = req.params;

  if (!reportId || !Types.ObjectId.isValid(reportId)) {
    throw new BadRequestException("Invalid report id.");
  }

  const report = await ReportModel.findOne({
    _id: reportId,
    userId: req.user._id,
  });

  if (!report) {
    throw new NotFoundException("Report not found.");
  }

  if (report.cloudinaryPublicId) {
    await cloudinary.uploader.destroy(report.cloudinaryPublicId, {
      resource_type: "raw",
    });
  }

  await ReportModel.findByIdAndDelete(reportId);

  return res.status(200).json({
    message: "Report deleted successfully.",
  });
};

