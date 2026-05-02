// Import ENV
import {resolve} from 'node:path';
import {config} from 'dotenv';
config({path:resolve("./config/.env.development")});
// config();

// Load Express and Express Type
import type {Express, Request, Response} from 'express' 
import express from 'express';

// Third Party middleware
import cors from 'cors'
import helmet from 'helmet';
import {rateLimit} from 'express-rate-limit';

// Import module routing
import authController from './modules/auth/auth.controller'
import userController from './modules/user/user.controller'
import scanController from './modules/scan/scan.controller'
import { globalErrorHandling } from './utils/response/error.response';
import connection from './DataBase/connections.db';
// import { connectRedis } from './DataBase/redis.connection.db';
const limiter = rateLimit({
    windowMs:60 * 60000,
    limit:2000,
    message:{error:"To Many Request Please Try Again Later"},
    statusCode:429
  });

const bootStrap = async() : Promise<void> =>{
  const app : Express= express();
  const port : number | string = process.env.PORT || 5000;
  app.use(cors(),express.json() , helmet() , limiter);
  // DataBase
  await connection();
  // await connectRedis();
  
  // app-routing
  app.get('/', (req:Request,res:Response,next)=>{
    res.json({message:`Welcome to ${process.env.APPLICATION_NAME} Back-End landing page 🔥`});
  })

  // sub-app-routing-modules
  app.use('/auth',authController);
  app.use('/user',userController);
  app.use('/scan',scanController);


  // global-error-handling
  app.use(globalErrorHandling)
  // Server
  app.listen(port,()=>{
    console.log(`Server is Running at port ::: ${process.env.PORT} `);
  })

}
//docker exec -it sleepy_bouman redis-cli FLUSHALL
export default bootStrap;