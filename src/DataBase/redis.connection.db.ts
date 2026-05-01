import {createClient} from "redis"

export const redisClient = createClient({
  url:process.env.REDIS_URI as string
})
export const connectRedis = async()=>{
  try{
    await redisClient.connect();
    console.log(`REDIS_DB Connected Successfully.`);
  }
  catch(error){
    console.log(`Fail to connect on REDIS_DB ${error}`);
  }
}