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

    const { reportId, scanId, typeOfRisk } = job.data;

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
          ? { scanId }
          : {
              scanId,
              risk: typeOfRisk,
            };

      const vulnerabilities = await VulnerabilityModel.find(filter)
        .limit(10)
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
          timeout: 1000 * 60 * 5,
        }
      );

      const aiReports = aiResponse.data.data;





      // use Fake Data 

      // const aiResponse = await fakeGenerateReportAI();
      // const aiReports = aiResponse.vulnerabilities;

      if (!Array.isArray(aiReports)) {
        console.log("INVALID AI RESPONSE:", aiResponse.data);
        throw new Error("Invalid AI response format.");
      }

      const html = buildReportHtml({
        aiReports,
        scanId,
        typeOfRisk,
        totalVulnerabilities: vulnerabilities.length,
      });

      browser = await puppeteer.launch({
        headless: true,
        protocolTimeout: 1000 * 60 * 5,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();

      await page.setContent(html, {
        waitUntil: "domcontentloaded",
        timeout: 1000 * 60 * 5,
      });

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        timeout: 1000 * 60 * 5,
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

      await ReportModel.findByIdAndUpdate(reportId, {
        status: ReportStatusEnum.COMPLETED,
        fileUrl: uploadResult.secure_url,
        cloudinaryPublicId: uploadResult.public_id,
        generationTimeMs: Date.now() - startTime,
        failureReason: null,
      });
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