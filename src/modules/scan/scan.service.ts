import { Request, Response } from "express";
import { IScanIdParamsInputDto, ITargetBodyInputDto } from "./scan.dto";
import { ScanModel, ScanStatusEnum } from "../../DataBase/models/Scan.Model";
import { BadRequestException, NotFoundException, UnauthorizedException } from "../../utils/response/error.response";
import { prepareQueue } from "../../queues/prepare.queue";
import { Types } from "mongoose";
import { VulnerabilityModel } from "../../DataBase/models/Vulnerability.Model";
import axios from "axios";
import { ZAP_APIS } from "../../utils/security.api";
import puppeteer from "puppeteer";


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
): Promise<void> => {
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
        res.end();
        return;
      }

      sendEvent("progress", scanDoc);

      if (
        scanDoc.status === ScanStatusEnum.COMPLETED ||
        scanDoc.status === ScanStatusEnum.FAILED ||
        scanDoc.status === ScanStatusEnum.STOPPED
      ) {
        sendEvent("done", scanDoc);
        clearInterval(interval);
        res.end();
        return;
      }
    } catch (err: any) {
      sendEvent("error", { message: err.message });
      clearInterval(interval);
      res.end();
      return;
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
  }).select("target status scanType startedAt finishedAt durationText result failureReason");

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

  const { page = "1", limit = "5", status } = req.query as {
    page?: string;
    limit?: string;
    status?: string;
  };

  const parsedPage = Number(page);
  const parsedLimit = Number(limit);

  const pageNumber =
    Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const limitNumber =
    Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 5;

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
    .select("-jobId -monitorJobId -zapScanId");

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

// export const generateReportAI = async (req: Request, res: Response) => {
//   const { generateType } = req.body;
//   const { scanId } = req.params;

//   const vulnerabilitiesType = await VulnerabilityModel.find({
//     scanId, 
//     risk: generateType,
//   })
//   .limit(10)
//   .select("url alert param attack risk")
//   .lean();

//   if (!vulnerabilitiesType.length) {
//     throw new NotFoundException("No vulnerabilities found for this type.");
//   }

//   const aiResponse = await axios.post(
//     "https://facing-action-earthly.ngrok-free.dev/generate-report",
//     {
//       vulnerabilityToAI:vulnerabilitiesType,
//     },
//     {
//       headers: {
//         "Content-Type": "application/json",
//         Accept:"application/pdf"
//       },
//       responseType: "arraybuffer",
//     }
//   );

//   const fileName = `Black-Cat-${generateType}-vulnerabilities-report.pdf`;

//   res.setHeader("Content-Type", "application/pdf");
//   res.setHeader(
//     "Content-Disposition",
//     `attachment; filename="${fileName}"`
//   );
//   console.log(aiResponse.data);
//   return res.status(200).send(aiResponse.data);
// };
const fakeGenerateReportAI = async () => {
  return {
    vulnerabilities: [
      {
        title: "SQL Injection in Login Endpoint",
        summary:
          "The login endpoint is vulnerable to SQL Injection via the username parameter.",
        steps_to_reproduce: [
          "Go to the login page",
          "Enter SQL payload",
          "Submit request",
          "Observe authentication bypass",
        ],
        impact: "Full database compromise and authentication bypass.",
      },
            {
        title: "SQL Injection in Login Endpoint",
        summary:
          "The login endpoint is vulnerable to SQL Injection via the username parameter.",
        steps_to_reproduce: [
          "Go to the login page",
          "Enter SQL payload",
          "Submit request",
          "Observe authentication bypass",
        ],
        impact: "Full database compromise and authentication bypass.",
      },
            {
        title: "SQL Injection in Login Endpoint",
        summary:
          "The login endpoint is vulnerable to SQL Injection via the username parameter.",
        steps_to_reproduce: [
          "Go to the login page",
          "Enter SQL payload",
          "Submit request",
          "Observe authentication bypass",
        ],
        impact: "Full database compromise and authentication bypass.",
      },
            {
        title: "SQL Injection in Login Endpoint",
        summary:
          "The login endpoint is vulnerable to SQL Injection via the username parameter.",
        steps_to_reproduce: [
          "Go to the login page",
          "Enter SQL payload",
          "Submit request",
          "Observe authentication bypass",
        ],
        impact: "Full database compromise and authentication bypass.",
      },
            {
        title: "SQL Injection in Login Endpoint",
        summary:
          "The login endpoint is vulnerable to SQL Injection via the username parameter.",
        steps_to_reproduce: [
          "Go to the login page",
          "Enter SQL payload",
          "Submit request",
          "Observe authentication bypass",
        ],
        impact: "Full database compromise and authentication bypass.",
      },
      {
        title: "Reflected Cross-Site Scripting (XSS) in Search",
        summary:
          "The search feature reflects user input directly into the HTML response.",
        steps_to_reproduce: [
          "Navigate to search page",
          "Inject script payload",
          "Submit request",
          "Observe script execution",
        ],
        impact: "Session hijacking and credential theft.",
      },
      {
        title: "Insecure Direct Object Reference (IDOR)",
        summary:
          "The API endpoint does not validate ownership of requested resources.",
        steps_to_reproduce: [
          "Login with valid account",
          "Modify user ID",
          "Send request",
          "Observe unauthorized access",
        ],
        impact: "Unauthorized access to sensitive user information.",
      },
    ],
  };
};

export const generateReportAI = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { scanId } = req.params;
  const { typeOfRisk } = req.query;

  if (!typeOfRisk || typeof typeOfRisk !== "string") {
    throw new BadRequestException("risk query is required.");
  }

  const allowRisksType = [
    "All",
    "High",
    "Medium",
    "Low",

  ];

  if (!allowRisksType.includes(typeOfRisk)) {
    throw new BadRequestException(
      "Invalid risk type. Allowed: All, High, Medium, Low, Informational"
    );
  }

  const filter =
    typeOfRisk === "All"
      ? { scanId }
      : {
          scanId,
          risk: typeOfRisk,
        };

  const vulnerabilities = await VulnerabilityModel.find(filter)
    .select("url alert param attack risk")
    .lean();

  if (!vulnerabilities.length) {
    throw new NotFoundException(
      `No ${typeOfRisk} vulnerabilities found.`
    );
  }

  const aiResponse = await fakeGenerateReportAI();

  const vulnerabilitiesHtml = aiResponse.vulnerabilities
    .map(
      (vulnerability, index) => `
        <div class="page">

          <h2>${index + 1}. ${vulnerability.title}</h2>

          <h3>Summary</h3>
          <p>${vulnerability.summary}</p>

          <h3>Steps To Reproduce</h3>

          <ul>
            ${vulnerability.steps_to_reproduce
              .map((step) => `<li>${step}</li>`)
              .join("")}
          </ul>

          <h3>Impact</h3>
          <p>${vulnerability.impact}</p>

        </div>
      `
    )
    .join("");

  const html = `
    <html>
      <head>
        <style>
          * {
            box-sizing: border-box;
          }

          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            color: #111827;
            background: white;
          }

          .report-header {
            padding: 30px 40px 10px;
          }

          h1 {
            color: #0f172a;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }

          h2 {
            color: #dc2626;
            margin-top: 0;
            margin-bottom: 20px;
          }

          h3 {
            color: #1f2937;
            margin-bottom: 8px;
            margin-top: 20px;
          }

          p,
          li {
            font-size: 14px;
            line-height: 1.8;
          }

          ul {
            padding-left: 20px;
          }

          .meta {
            font-size: 13px;
            color: #6b7280;
            margin: 4px 0;
          }

          .page {
            margin: 30px 40px;

            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 24px;

            background: #f9fafb;

            break-after: page;
            page-break-after: always;
          }

          .page:last-child {
            break-after: auto;
            page-break-after: auto;
          }
        </style>
      </head>

      <body>

        <div class="report-header">
          <h1>Black Cat AI Security Report</h1>

          <p class="meta">Scan ID: ${scanId}</p>
          <p class="meta">Risk Type: ${typeOfRisk}</p>
          <p class="meta">
            Total Vulnerabilities: ${vulnerabilities.length}
          </p>
        </div>

        ${vulnerabilitiesHtml}

      </body>
    </html>
  `;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  await page.setContent(html, {
    waitUntil: "networkidle0",
  });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "20px",
      right: "20px",
      bottom: "20px",
      left: "20px",
    },
  });

  await browser.close();

  res.setHeader("Content-Type", "application/pdf");

  res.setHeader(
    "Content-Disposition",
    `inline; filename="black-cat-${typeOfRisk}-report.pdf"`
  );

  res.send(pdfBuffer);
};