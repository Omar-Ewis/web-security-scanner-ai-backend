import {z} from "zod"
import type { Request,Response,NextFunction } from "express";
import { ZodType } from "zod";
import { BadRequestException } from "../utils/response/error.response";
//============================================================================================================================================
type KeyReqType = "body" | "params" | "query" | "headers" | "files";
type SchemaType = Partial<Record<KeyReqType,ZodType<unknown>>>;
type ValidationErrorsType = Array<{
        key: KeyReqType;
        issues: Array<{
            message: string;
            path: string | number | symbol | undefined;
        }>;
    }>;
//============================================================================================================================================
export const validation = (schema:SchemaType)=>{
    return (req:Request,res:Response,next:NextFunction)=>{
        const validationError: ValidationErrorsType=[];
        for(const key of Object.keys(schema) as KeyReqType[] ){
            if(!schema[key]) continue;
            const validationResult = schema[key].safeParse((req as any)[key]);
            if(!validationResult.success){
                validationError.push(
                    {
                        key,
                        issues:validationResult.error.issues.
                        map(
                            (issue)=>{
                                return {message:issue.message,path:issue.path[0]}
                            }
                )})
            }
        }
        if(validationError.length){
            throw new BadRequestException("Validation Error",{validationError});
        }
        return next();
    }
}

export const generalFeild = {
      username:z.string().min(3).max(40),
      email:z.email(),
      password:z.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/),
      confirmPassword:z.string()    ,
      OTP:z.string().regex(/^\d{6}$/)
}