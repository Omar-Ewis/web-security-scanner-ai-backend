import { Worker, Job } from "bullmq";
import { bullmqConnection } from "../utils/bullmq.redis";
import {
  ScanModel,
  ScanStatusEnum,
  ScanTypeEnum,
} from "../DataBase/models/Scan.Model";
import axios from "axios";
import { monitorQueue } from '../queues/monitor.queue'
import {ZAP_APIS} from '../utils/security.api'

const zapSpiderAPI = ZAP_APIS.SPIDER;
const zapAjaxAPI = ZAP_APIS.AJAX;
const zapActiveAPI = ZAP_APIS.ACTIVE;

export const startActive = async (target: string) => {
  const response = await axios.post(zapActiveAPI, { target });
  return response.data;
};

interface IPrepareJobData {
  scanId: string;
  target: string;
  scanType: ScanTypeEnum;
}

export const prepareWorker = new Worker(
  "prepare-scan",
  async (job: Job<IPrepareJobData>) => {
    const { scanId, target, scanType } = job.data;

    try {
      console.log("1) Prepare Worker started:", job.data);

      console.log("2) before DB update to PREPARING");
      await ScanModel.findByIdAndUpdate(scanId, {
        status: ScanStatusEnum.PREPARING,
        startedAt: new Date(),
        failureReason: null,
      });
      console.log("3) after DB update to PREPARING");

      console.log("4) before spider request");
      await axios.post(zapSpiderAPI, { target });

      if (scanType === ScanTypeEnum.DEEP) {
        console.log("6) before ajax request");
        const ajaxResponse = await axios.post(zapAjaxAPI, { target });
        console.log("7) after ajax request", ajaxResponse.data);
      }

      console.log("8) before active request");
      const activeResponse = await startActive(target);
      console.log("9) after active request", activeResponse);

      const zapScanId = Number(activeResponse.scan_id);

      console.log("10) zapScanId =", zapScanId);

      if (Number.isNaN(zapScanId)) {
        throw new Error("Invalid zapScanId");
      }

      console.log("11) before DB update to SCANNING");
      await ScanModel.findByIdAndUpdate(scanId, {
        zapScanId,
        status: ScanStatusEnum.SCANNING,
        progress: 0,
      });
      console.log("12) after DB update to SCANNING");

      console.log("13) before adding monitor job");
      const monitorJob = await monitorQueue.add("monitor-progress", {
        scanId,
        zapScanId,
      });
      console.log("14) after adding monitor job", monitorJob.id);
      await ScanModel.findByIdAndUpdate(scanId, {
        monitorJobId: String(monitorJob.id),
      });
      console.log("15) monitorJobId saved in DB");

      console.log(`✅ Scan ${scanId} is now SCANNING`);
    } catch (error: any) {
      console.error("❌ Caught error in prepare worker:", error?.message || error);

      await ScanModel.findByIdAndUpdate(scanId, {
        status: ScanStatusEnum.FAILED,
        failureReason: error?.message || "Prepare failed",
      });

      throw error;
    }
  },
  {
    connection: bullmqConnection,
  }
);