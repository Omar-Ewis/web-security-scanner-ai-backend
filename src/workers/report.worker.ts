import { Worker, Job } from "bullmq";
import axios from "axios";
import puppeteer, { Browser } from "puppeteer";

import { bullmqConnection } from "../utils/bullmq.redis";

import {
  ReportModel,
  ReportStatusEnum,
  ReportTypeEnum,
} from "../DataBase/models/aiReport.Model";

import { VulnerabilityModel } from "../DataBase/models/Vulnerability.Model";

import { buildReportHtml } from "../utils/report/buildReportHtml";
import { uploadPdfToCloudinary } from "../utils/cloudinary/uploadPdf";

import { getUserTokens } from "../utils/FCM/FCM.service";
import { notificationService } from "../utils/FCM/FCM.notification";

// import { fakeGenerateReportAI } from "../utils/report/fakeGenerateReportAI";

type GenerateReportJobData = {
  reportId: string;
  scanId: string;
  userId: string;
  typeOfRisk: ReportTypeEnum;
};

export const reportWorker = new Worker<GenerateReportJobData>(
  "report-generation",

  async (job: Job<GenerateReportJobData>) => {
    const startTime = Date.now();

    const { reportId, scanId, userId, typeOfRisk } = job.data;

    let browser: Browser | null = null;

    try {
      const report = await ReportModel.findById(reportId);

      if (!report) {
        throw new Error("Report not found.");
      }

      await ReportModel.findByIdAndUpdate(reportId, {
        status: ReportStatusEnum.PROCESSING,
        failureReason: null,
      });

      const filter =
        typeOfRisk === ReportTypeEnum.ALL
          ? {
              scanId,
              risk: { $ne: ReportTypeEnum.INFORMATIONAL },
            }
          : {
              scanId,
              risk: typeOfRisk,
            };

      const vulnerabilities = await VulnerabilityModel.find(filter)
        .select("url alert param attack risk")
        .lean();

      if (!vulnerabilities.length) {
        throw new Error(`No ${typeOfRisk} vulnerabilities found.`);
      }

      const aiResponse = await axios.post(
        process.env.AI_REPORT_API_URL as string,
        {
          vulnerabilityToAI: vulnerabilities,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 1000 * 60 * 10,
        }
      );

      const aiReports =
        aiResponse.data?.data || aiResponse.data?.vulnerabilities;

      if (!Array.isArray(aiReports)) {
        console.log("INVALID AI RESPONSE:", aiResponse.data);
        throw new Error("Invalid AI response format.");
      }

      // Fake Data
      // const aiResponse = await fakeGenerateReportAI();
      // const aiReports = aiResponse.vulnerabilities;

      const html = buildReportHtml({
        aiReports,
        scanId,
        typeOfRisk,
        totalVulnerabilities: vulnerabilities.length,
      });

      browser = await puppeteer.launch({
        headless: true,
        protocolTimeout: 1000 * 60 * 10,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();

      await page.setContent(html, {
        waitUntil: "domcontentloaded",
        timeout: 1000 * 60 * 10,
      });

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        timeout: 1000 * 60 * 10,
        margin: {
          top: "20px",
          right: "20px",
          bottom: "20px",
          left: "20px",
        },
      });

      const uploadResult = await uploadPdfToCloudinary({
        pdfBuffer,
        reportId,
        typeOfRisk,
      });

      const updatedReport = await ReportModel.findByIdAndUpdate(
        reportId,
        {
          status: ReportStatusEnum.COMPLETED,
          fileUrl: uploadResult.secure_url,
          cloudinaryPublicId: uploadResult.public_id,
          generationTimeMs: Date.now() - startTime,
          failureReason: null,
        },
        {
          new: true,
        }
      );

      if (updatedReport?.userId) {
        const tokens = await getUserTokens(updatedReport.userId);

        if (tokens.length > 0) {
          await notificationService.sendNotifications({
            tokens,
            data: {
              title: "Report Ready",
              body: `${typeOfRisk} security report has been generated successfully.`,
              reportId: reportId.toString(),
              scanId: scanId.toString(),
              typeOfRisk,
            },
          });

          console.log(`Notification sent for report ${reportId}`);
        } else {
          console.log(
            `No active FCM tokens found for user ${updatedReport.userId}`
          );
        }
      } else {
        const tokens = await getUserTokens(userId);

        if (tokens.length > 0) {
          await notificationService.sendNotifications({
            tokens,
            data: {
              title: "Report Ready",
              body: `${typeOfRisk} security report has been generated successfully.`,
              reportId: reportId.toString(),
              scanId: scanId.toString(),
              typeOfRisk,
            },
          });

          console.log(`Notification sent for report ${reportId}`);
        }
      }

      console.log(`Report generated successfully: ${reportId}`);
    } catch (error: any) {
      console.error("Report worker failed:", error);

      await ReportModel.findByIdAndUpdate(reportId, {
        status: ReportStatusEnum.FAILED,
        failureReason: error.message || "Report generation failed.",
        generationTimeMs: Date.now() - startTime,
      });

      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  },

  {
    connection: bullmqConnection,
  }
);

reportWorker.on("completed", (job) => {
  console.log(`Report job completed: ${job.id}`);
});

reportWorker.on("failed", (job, error) => {
  console.error(`Report job failed: ${job?.id}`, error.message);
});