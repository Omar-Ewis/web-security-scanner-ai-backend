import { Worker, Job } from "bullmq";
import axios from "axios";
import { redisConnection } from "../utils/redis";
import { ScanModel, ScanStatusEnum } from "../DataBase/models/Scan.Model";
import { VulnerabilityModel } from "../DataBase/models/Vulnerability.Model";
import { ZAP_APIS } from "../utils/security.api";


interface IMonitorJobData {
  scanId: string;
  zapScanId: number;
}

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

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
      let scanStatus = "running";

      while (scanStatus !== "completed" && progress < 100) {
        const stoppedBeforeStatus = await isScanStopped(scanId);
        if (stoppedBeforeStatus) {
          console.log(`🛑 Scan ${scanId} was stopped manually before status check`);
          return;
        }

        console.log("M2) before status request");

        const statusResponse = await axios.get(
          ZAP_APIS.STATUS(zapScanId)
        );

        console.log("M3) status response =", statusResponse.data);

        progress = Number(statusResponse.data?.progress_percent ?? 0);
        scanStatus = statusResponse.data?.status ?? "running";

        console.log("M4) progress =", progress);
        console.log("M5) scanStatus =", scanStatus);

        if (Number.isNaN(progress)) {
          throw new Error("Invalid progress_percent value");
        }

        const stoppedBeforeUpdate = await isScanStopped(scanId);
        if (stoppedBeforeUpdate) {
          console.log(`🛑 Scan ${scanId} was stopped manually before DB update`);
          return;
        }

        await ScanModel.findByIdAndUpdate(scanId, {
          progress,
          status: ScanStatusEnum.SCANNING,
        });

        console.log("M6) DB updated with progress");

        if (scanStatus === "completed" || progress >= 100) {
          break;
        }

        await sleep(3000);
      }

      const stoppedBeforeResults = await isScanStopped(scanId);
      if (stoppedBeforeResults) {
        console.log(`🛑 Scan ${scanId} was stopped manually before fetching results`);
        return;
      }

      console.log("M7) before results request");

      const resultsResponse = await axios.get(
        ZAP_APIS.RESULTS(zapScanId)
      );

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
        console.log(`🛑 Scan ${scanId} was stopped manually before saving results`);
        return;
      }

      await VulnerabilityModel.deleteMany({ scanId });

      if (vulnerabilitiesToInsert.length > 0) {
        await VulnerabilityModel.insertMany(vulnerabilitiesToInsert);
      }

      const stoppedBeforeComplete = await isScanStopped(scanId);
      if (stoppedBeforeComplete) {
        console.log(`🛑 Scan ${scanId} was stopped manually before marking completed`);
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

      console.log(`✅ Scan ${scanId} is now COMPLETED`);
    } catch (error: any) {
      console.error("❌ Caught error in monitor worker:", error?.message || error);

      const scanDoc = await ScanModel.findById(scanId).select("status");

      if (scanDoc?.status === ScanStatusEnum.STOPPED) {
        console.log(`🛑 Scan ${scanId} already stopped, skipping FAILED update`);
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
    connection: redisConnection,
  }
);