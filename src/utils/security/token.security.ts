import {v4 as uuid} from'uuid'
import { JwtPayload, Secret, sign, SignOptions, verify } from "jsonwebtoken";
import { HUserDocument, UserModel } from "../../DataBase/models/User.model";
import { BadRequestException, UnauthorizedException } from "../response/error.response";
import { UserRepository } from "../../DataBase/repository/user.repository";
import { HTokenDocument, TokenModel } from '../../DataBase/models/Token.model';
import { TokenRepository } from '../../DataBase/repository/token.repository';

export enum TokenEnum {
  access = 'access',
  refresh = 'refresh'
}
export enum LogoutEnum {
  only = "only",
  all = "all",
}
export const generateToken = async(
  {
    payload,
    secret = process.env.ACCESS_USER_TOKEN_SIGNATURE as string,
    options = {expiresIn:Number(process.env.ACCESS_TOKEN_EXPIRES_IN)}
  }:{
    payload: string |object,
    secret?: Secret,
    options?: SignOptions
  }
):Promise<string> =>{
  return sign(payload,secret,options);
}

export const verifyToken = async(
  {
    token,
    secret = process.env.ACCESS_USER_TOKEN_SIGNATURE as string,
  }:{
    token:string,
    secret?:Secret
  }
):Promise<JwtPayload>=>{
  return verify(token,secret) as JwtPayload;
}

// if we have a lot of roles we will implement getSginatureLevel that is return signatures
export const createLoginCredentials = async (user:HUserDocument) =>{
    const jwtid = uuid();
    const access_token = await generateToken({
      payload:{_id:user._id},
      secret:process.env.ACCESS_USER_TOKEN_SIGNATURE as string,
      options:{
        expiresIn:Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
        jwtid
      }
    }) 
    const refresh_token = await generateToken({
      payload:{_id:user._id},
      secret:process.env.REFRESH_USER_TOKEN_SIGNATURE as string,
      options:{
        expiresIn:Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
        jwtid
      }
    })
    return {access_token,refresh_token}
}

// authentication
export const decodeToken = async ({
  authorization,
  tokenType
}:{
  authorization : string,
  tokenType: TokenEnum
}) =>{
  const userModel = new UserRepository(UserModel);
  const tokenModel = new TokenRepository(TokenModel);
  const [bearer , token] = authorization.split(" ") || [];
  if(!bearer || !token){
    throw new UnauthorizedException('Missing Token Parts');
  }
  const decode = await verifyToken(
    {
      token,
      secret: tokenType === TokenEnum.access ? 
      process.env.ACCESS_USER_TOKEN_SIGNATURE as string:
      process.env.REFRESH_USER_TOKEN_SIGNATURE as string
    });
    
    if(!decode?._id || !decode?.iat){
      throw new BadRequestException('Invalid token payload')
    }
    const tokenIssuedAt = decode.iat * 1000;
    console.log(decode.jti);
    
    if(await tokenModel.findOne({filter:{jti:decode.jti}})){
      throw new UnauthorizedException("Invalid or old login credentials")
    }
    const user = await userModel.findOne({filter:{_id:decode._id}});
    if(!user){
      throw new BadRequestException('Not Register Account');
    }
    const lastLogout = user.changeCredentialsTime?.getTime() || 0;
    if (lastLogout > tokenIssuedAt) {
        throw new UnauthorizedException("Token expired by logout");
    }
    const absoluteSessionDuration = Number(process.env.ABSOLUTE_SESSION_EXPIRES_IN);
    const sessionStart = user.sessionCreatedAt?.getTime() || 0;
    const now = Date.now();
    if (now > sessionStart + absoluteSessionDuration * 1000) {
      throw new UnauthorizedException("Session expired. Please login again");
    }
    return {user , decode};
}
export const createRevokeToken = async (
  decoded: JwtPayload
): Promise<HTokenDocument> => {
  const tokenModel = new TokenRepository(TokenModel);

  const [result] =
    (await tokenModel.create({
      data: [
        {
          jti: decoded.jti as string,
          expiresIn:decoded?.iat as number + 
              Number( process.env.REFRESH_TOKEN_EXPIRES_IN),
          userId: decoded._id,
        },
      ],
    })) || [];

  if (!result) {
    throw new BadRequestException("Fail to revoke this token");
  }

  return result;
};