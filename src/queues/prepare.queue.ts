import { Queue } from "bullmq";
import { redisConnection } from "../utils/redis";

export const prepareQueue = new Queue("prepare-scan", {
  connection: redisConnection,
});