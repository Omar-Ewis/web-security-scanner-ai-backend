import { Queue } from "bullmq";
import { bullmqConnection } from "../utils/bullmq.redis";
export const monitorQueue = new Queue("monitor-scan", {
  connection: bullmqConnection,
});