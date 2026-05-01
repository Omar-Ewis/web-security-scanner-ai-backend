import { Queue } from "bullmq";
import { bullmqConnection } from "../utils/bullmq.redis";
export const prepareQueue = new Queue("prepare-scan", {
  connection: bullmqConnection,
});