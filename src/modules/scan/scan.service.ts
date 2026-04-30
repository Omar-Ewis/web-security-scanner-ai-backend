import { Request, Response } from "express";
import { IScanIdParamsInputDto, ITargetBodyInputDto } from "./scan.dto";
import { ScanModel, ScanStatusEnum } from "../../DataBase/models/Scan.Model";
import { BadRequestException, NotFoundException, UnauthorizedException } from "../../utils/response/error.response";
import { prepareQueue } from "../../queues/prepare.queue";
import { Types } from "mongoose";
import { VulnerabilityModel } from "../../DataBase/models/Vulnerability.Model";
import axios from "axios";
import { ZAP_APIS } from "../../utils/security.api";


export const normalScan = async (req: Request, res: Response) => {
  const {target} :ITargetBodyInputDto = req.body;
  if(!req.user){
    throw new UnauthorizedException('Unauthorized')
  }
  const scanDoc = await ScanModel.create({
      target,
      userId: req.user.id,
    });
  const job = await prepareQueue.add("prepare-normal-scan", {
      scanId: scanDoc._id,
      target: scanDoc.target,
      userId: scanDoc.userId,
      scanType: scanDoc.scanType,
    });
  scanDoc.jobId = String(job.id);
  await scanDoc.save();
  return res.status(201).json({
      message: "Normal scan created successfully",
      data: scanDoc,
    });
};

export const streamScanProgress = async (
  req: Request<IScanIdParamsInputDto>,
  res: Response
) => {
  const { scanId } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  res.flushHeaders?.();

  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  sendEvent("connected", { scanId });

  const interval = setInterval(async () => {
    try {
      const scanDoc = await ScanModel.findById(scanId).select(
        "_id status progress zapScanId finishedAt failureReason"
      );

      if (!scanDoc) {
        sendEvent("error", { message: "Scan not found" });
        clearInterval(interval);
        return res.end();
      }

      sendEvent("progress", scanDoc);

      if (
        scanDoc.status === ScanStatusEnum.COMPLETED ||
        scanDoc.status === ScanStatusEnum.FAILED ||
        scanDoc.status === ScanStatusEnum.STOPPED
      ) {
        sendEvent("done", scanDoc);
        clearInterval(interval);
        return res.end();
      }
    } catch (err: any) {
      sendEvent("error", { message: err.message });
      clearInterval(interval);
      return res.end();
    }
  }, 3000);

  req.on("close", () => {
    clearInterval(interval);
    res.end();
  });
};

export const getScanResult = async (
  req: Request<IScanIdParamsInputDto>,
  res: Response
) => {
  const { scanId } = req.params;

  if (!req.user) {
    throw new UnauthorizedException("Unauthorized");
  }

  const scanDoc = await ScanModel.findOne({
    _id: scanId,
    userId: req.user.id,
  }).select("target status startedAt finishedAt result failureReason");

  if (!scanDoc) {
    throw new NotFoundException("Scan not found");
  }

  return res.status(200).json({
    message: "Scan result fetched successfully",
    data: scanDoc,
  });
};

export const getScanVulnerabilities = async (
  req: Request<IScanIdParamsInputDto>,
  res: Response
) => {
  const { scanId } = req.params;
  const { page = "1", limit = "10" } = req.query as {
    page?: string;
    limit?: string;
  };

  if (!req.user) {
    throw new UnauthorizedException("Unauthorized");
  }

  const scanDoc = await ScanModel.findOne({
    _id: scanId,
    userId: req.user.id,
  }).select("_id");

  if (!scanDoc) {
    throw new NotFoundException("Scan not found");
  }

  const parsedPage = Number(page);
  const parsedLimit = Number(limit);

  const pageNumber =
    Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const limitNumber =
    Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;

  const objectScanId = new Types.ObjectId(scanId);

  const vulnerabilities = await VulnerabilityModel.aggregate([
    {
      $match: {
        scanId: objectScanId,
      },
    },
    {
      $addFields: {
        riskOrder: {
          $switch: {
            branches: [
              { case: { $eq: ["$risk", "High"] }, then: 1 },
              { case: { $eq: ["$risk", "Medium"] }, then: 2 },
              { case: { $eq: ["$risk", "Low"] }, then: 3 },
              { case: { $eq: ["$risk", "Informational"] }, then: 4 },
            ],
            default: 5,
          },
        },
      },
    },
    { $sort: { riskOrder: 1, createdAt: -1 } },
    { $skip: (pageNumber - 1) * limitNumber },
    { $limit: limitNumber },
    {
      $project: {
        riskOrder: 0,
      },
    },
  ]);

  const total = await VulnerabilityModel.countDocuments({
    scanId: objectScanId,
  });

  return res.status(200).json({
    message: "Vulnerabilities fetched successfully",
    data: vulnerabilities,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      pages: Math.ceil(total / limitNumber),
    },
  });
};

export const getAllScans = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new UnauthorizedException("Unauthorized");
  }

  const { page = "1", limit = "10", status } = req.query as {
    page?: string;
    limit?: string;
    status?: string;
  };

  const parsedPage = Number(page);
  const parsedLimit = Number(limit);

  const pageNumber =
    Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const limitNumber =
    Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;

  const filter: Record<string, unknown> = {
    userId: req.user.id,
  };

  if (typeof status === "string" && status.trim()) {
    filter.status = status.trim();
  }

  const scans = await ScanModel.find(filter)
    .sort({ createdAt: -1 })
    .skip((pageNumber - 1) * limitNumber)
    .limit(limitNumber)
    .select(
      "target scanType status progress startedAt finishedAt failureReason createdAt"
    );

  const total = await ScanModel.countDocuments(filter);

  return res.status(200).json({
    message: "Scans fetched successfully",
    data: scans,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      pages: Math.ceil(total / limitNumber),
    },
  });
};

export const getFullScanDetails = async (
  req: Request<IScanIdParamsInputDto>,
  res: Response
) => {
  if (!req.user) {
    throw new UnauthorizedException("Unauthorized");
  }

  const { scanId } = req.params;

  const scanDoc = await ScanModel.findOne({
    _id: scanId,
    userId: req.user.id,
  }).select(
    "target scanType status progress startedAt finishedAt failureReason result createdAt"
  );

  if (!scanDoc) {
    throw new NotFoundException("Scan not found");
  }

  const objectScanId = new Types.ObjectId(scanId);

  const vulnerabilities = await VulnerabilityModel.find({
    scanId: objectScanId,
  })
    .sort({ createdAt: -1 })
    .select("url alert param attack risk createdAt");

  return res.status(200).json({
    message: "Full scan details fetched successfully",
    data: {
      scan: scanDoc,
      vulnerabilities,
    },
  });
};

export const stopScan = async (
  req: Request<IScanIdParamsInputDto>,
  res: Response
) => {
  if (!req.user) {
    throw new UnauthorizedException("Unauthorized");
  }

  const { scanId } = req.params;

  const scanDoc = await ScanModel.findOne({
    _id: scanId,
    userId: req.user.id,
  });

  if (!scanDoc) {
    throw new NotFoundException("Scan not found");
  }

  if (
    scanDoc.status !== ScanStatusEnum.PREPARING &&
    scanDoc.status !== ScanStatusEnum.SCANNING
  ) {
    throw new BadRequestException(
      `Cannot stop scan with status: ${scanDoc.status}`
    );
  }

  if (!scanDoc.zapScanId) {
    throw new BadRequestException("zapScanId is missing for this scan");
  }

  const zapResponse = await axios.post(
    ZAP_APIS.STOP(scanDoc.zapScanId),
    {},
    {
      headers: { "Content-Type": "application/json", },
    }
  );

  scanDoc.status = ScanStatusEnum.STOPPED;
  scanDoc.finishedAt = new Date();
  scanDoc.failureReason = null;

  await scanDoc.save();

  return res.status(200).json({
    message: "Scan stopped successfully",
    data: {
      scanId: scanDoc._id,
      status: scanDoc.status,
      finishedAt: scanDoc.finishedAt,
      zapResponse: zapResponse.data,
    },
  });
};