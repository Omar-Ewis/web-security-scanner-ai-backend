import { Worker, Job } from "bullmq";
import axios from "axios";
import { ScanModel, ScanStatusEnum } from "../DataBase/models/Scan.Model";
import { VulnerabilityModel } from "../DataBase/models/Vulnerability.Model";
import { ZAP_APIS } from "../utils/security.api";
import { bullmqConnection } from "../utils/bullmq.redis";
import { getUserTokens } from "../utils/FCM/FCM.service";
import { notificationService } from "../utils/FCM/FCM.notification";

interface IMonitorJobData {
  scanId: string;
  zapScanId: number;
}

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const POLLING_INTERVAL_MS = 7000;

const isScanStopped = async (scanId: string) => {
  const scanDoc = await ScanModel.findById(scanId).select("status");

  if (!scanDoc) {
    throw new Error("Scan not found during monitoring");
  }

  return scanDoc.status === ScanStatusEnum.STOPPED;
};

export const monitorWorker = new Worker(
  "monitor-scan",
  async (job: Job<IMonitorJobData>) => {
    const { scanId, zapScanId } = job.data;

    try {
      console.log("M1) Monitor Worker started:", job.data);

      let progress = 0;
      let lastProgress = -1;
      let scanStatus = "running";

      while (scanStatus !== "completed" && progress < 100) {
        const stopped = await isScanStopped(scanId);

        if (stopped) {
          console.log(`Scan ${scanId} was stopped manually`);
          return;
        }

        const statusResponse = await axios.get(ZAP_APIS.STATUS(zapScanId));

        progress = Number(statusResponse.data?.progress_percent ?? 0);
        scanStatus = statusResponse.data?.status ?? "running";

        if (Number.isNaN(progress)) {
          throw new Error("Invalid progress_percent value");
        }

        console.log(`Scan ${scanId} progress: ${progress}%`);

        // Update DB only when progress changes
        if (progress !== lastProgress) {
          await ScanModel.findByIdAndUpdate(scanId, {
            progress,
            status: ScanStatusEnum.SCANNING,
          });

          lastProgress = progress;
          console.log("DB updated with new progress");
        }

        if (scanStatus === "completed" || progress >= 100) {
          break;
        }

        await sleep(POLLING_INTERVAL_MS);
      }

      const stoppedBeforeResults = await isScanStopped(scanId);

      if (stoppedBeforeResults) {
        console.log(`Scan ${scanId} was stopped before fetching results`);
        return;
      }

      const resultsResponse = await axios.get(ZAP_APIS.RESULTS(zapScanId));

      const resultData = resultsResponse.data;
      const alerts = resultData.alerts ?? [];

      const vulnerabilitiesToInsert = alerts.map((item: any) => ({
        scanId,
        url: item.url ?? "",
        alert: item.alert ?? "",
        param: item.param ?? "",
        attack: item.attack ?? "",
        risk: item.risk,
      }));

      const stoppedBeforeSaving = await isScanStopped(scanId);

      if (stoppedBeforeSaving) {
        console.log(`Scan ${scanId} was stopped before saving results`);
        return;
      }

      await VulnerabilityModel.deleteMany({ scanId });

      if (vulnerabilitiesToInsert.length > 0) {
        await VulnerabilityModel.insertMany(vulnerabilitiesToInsert);
      }

      const stoppedBeforeComplete = await isScanStopped(scanId);

      if (stoppedBeforeComplete) {
        console.log(`Scan ${scanId} was stopped before marking completed`);
        return;
      }

      await ScanModel.findByIdAndUpdate(scanId, {
        progress: 100,
        status: ScanStatusEnum.COMPLETED,
        finishedAt: new Date(),
        failureReason: null,
        result: {
          baseUrl: resultData.baseUrl ?? "",
          alertsCount: resultData.alerts_count ?? 0,
          summaryTotal: resultData.summary_total ?? 0,
          summary: {
            high: resultData.summary?.High ?? 0,
            medium: resultData.summary?.Medium ?? 0,
            low: resultData.summary?.Low ?? 0,
            informational: resultData.summary?.Informational ?? 0,
          },
        },
      });

      console.log(`Scan ${scanId} is now COMPLETED`);
      const completedScan = await ScanModel.findById(scanId).select("userId");

      if (completedScan?.userId) {
        const tokens = await getUserTokens(completedScan.userId);

        if (tokens.length > 0) {
          await notificationService.sendNotifications({
            tokens,
            data: {
              title: "Scan Finished",
              body: "Your scan has been completed. Check the results.",
            },
          });
        }
      }

    } catch (error: any) {
      console.error(
        "Caught error in monitor worker:",
        error?.message || error
      );

      const scanDoc = await ScanModel.findById(scanId).select("status");

      if (scanDoc?.status === ScanStatusEnum.STOPPED) {
        console.log(`Scan ${scanId} already stopped, skipping FAILED update`);
        return;
      }

      await ScanModel.findByIdAndUpdate(scanId, {
        status: ScanStatusEnum.FAILED,
        failureReason: error?.message || "Monitor failed",
        finishedAt: new Date(),
      });

      throw error;
    }
  },
  {
    connection: bullmqConnection,
  }
);