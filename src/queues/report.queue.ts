import { Queue } from "bullmq";
import { bullmqConnection } from "../utils/bullmq.redis";

export const reportQueue = new Queue("report-generation", {
  connection: bullmqConnection,
});