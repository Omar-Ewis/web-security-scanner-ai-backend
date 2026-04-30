import { NextFunction,Request,Response } from "express"
import { decodeToken, TokenEnum } from "../utils/security/token.security"
import { BadRequestException, ForbiddenException } from "../utils/response/error.response"
import { RoleEnum } from "../DataBase/models/User.model"

export const authentication = (tokenType = TokenEnum.access) =>{
  return async (req:Request,res:Response,next:NextFunction)=>{
    if(!req.headers.authorization){
      throw new BadRequestException('Validation Error',{
        key:'headers',
        issues: [
          {
            path:"authorization", 
            message:'"missing authorization'
          }
        ]
      }

      )
    }
    const {decode ,user } = await decodeToken(
      {
        authorization:req.headers.authorization,
        tokenType
      }
    )
    req.user = user;
    req.decode = decode;
    
    next();
  }
}
export const authorization = (
  accessRoles:RoleEnum = RoleEnum.user,
  tokenType = TokenEnum.access
) =>{
  return async (req:Request,res:Response,next:NextFunction)=>{
    if(!req.headers.authorization){
      throw new BadRequestException('Validation Error',{
        key:'headers',
        issues: [{path:"authorization", message:'"missing authorization'}]
      }

      )
    }
    const {decode ,user } = await decodeToken(
      {
        authorization:req.headers.authorization,
        tokenType
      }
    )
    if (user.role !== accessRoles) {
      throw new ForbiddenException("Not Authorized Account.");
    }
    req.user = user;
    req.decode = decode;
    
    next();
  }
}