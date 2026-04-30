  import { Request , Response , NextFunction } from "express"

  export interface IError extends Error {
    statusCode:number;
  }

  export class ApplicationException extends Error{
    constructor(message:string,public statusCode:number = 400,cause?:unknown){
      super(message,{cause})
      this.name = this.constructor.name;
      Error.captureStackTrace(this,this.constructor);
    }
  }

  export class BadRequestException extends ApplicationException{
    constructor(message:string,cause?:unknown) {
      super(message,400,cause)
      this.name = this.constructor.name;
      Error.captureStackTrace(this,this.constructor);
    }
  }
  
  export class ConflictException extends ApplicationException{
    constructor(message:string,cause?:unknown) {
      super(message,409,cause)
      this.name = this.constructor.name;
      Error.captureStackTrace(this,this.constructor);
    }
  }
  export class NotFoundException extends ApplicationException{
    constructor(message:string,cause?:unknown) {
      super(message,404,cause)
      this.name = this.constructor.name;
      Error.captureStackTrace(this,this.constructor);
    }
  }
  export class RateLimitingException extends ApplicationException{
    constructor(message:string,cause?:unknown) {
      super(message,429,cause)
      this.name = this.constructor.name;
      Error.captureStackTrace(this,this.constructor);
    }
  }
  export class UnauthorizedException extends ApplicationException{
    constructor(message:string,cause?:unknown) {
      super(message,401,cause)
      this.name = this.constructor.name;
      Error.captureStackTrace(this,this.constructor);
    }
  }
  export class ForbiddenException extends ApplicationException{
    constructor(message:string,cause?:unknown) {
      super(message,403,cause)
      this.name = this.constructor.name;
      Error.captureStackTrace(this,this.constructor);
    }
  }

  export const globalErrorHandling =(
    error:IError,
    req:Request,
    res:Response,
    next:NextFunction
  )=>{
    return res.status(error.statusCode || 500).json(
      {
        err_message:error.message || "Something went Wrong",
        cause:error.cause,
        stack:process.env.MOOD === "development" ? error.stack:undefined,
        error,
      }
    )
  }