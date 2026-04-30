import { Queue } from "bullmq";
import { redisConnection } from "../utils/redis";

export const monitorQueue = new Queue("monitor-scan", {
  connection: redisConnection,
});