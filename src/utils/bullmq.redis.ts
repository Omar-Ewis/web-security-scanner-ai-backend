import IORedis from "ioredis";
export const bullmqConnection = new IORedis(
  process.env.REDIS_URI as string, 
  {
    maxRetriesPerRequest: null,
  }
);