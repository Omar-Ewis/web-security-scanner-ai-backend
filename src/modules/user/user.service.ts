import { Request,Response } from "express"
import { checkSingleEmailLeakInputDto, DataLeakInputDto, LogoutInputDto } from "./user.dto";
import { UserRepository } from "../../DataBase/repository/user.repository";
import { HUserDocument, IUser, UserModel } from "../../DataBase/models/User.model";
import { UpdateQuery } from "mongoose";
import { createLoginCredentials, createRevokeToken, LogoutEnum } from "../../utils/security/token.security";
import { TokenModel } from "../../DataBase/models/Token.model";
import { TokenRepository } from "../../DataBase/repository/token.repository";
import { JwtPayload } from "jsonwebtoken";
import { EmailModel } from "../../DataBase/models/DataLeak.Model";

class UserService{
  private userModel = new UserRepository(UserModel);
  private tokenModel = new TokenRepository(TokenModel);
  constructor(){}

  profile = async (req:Request,res:Response):Promise<Response>=>{
    return res.status(200).json(
      {
        message:'Done',
        data:{user:req.user?._id , decode:req.decode?.iat}
      }
    )
  }
  logout = async (req:Request,res:Response):Promise<Response>=>{
    const {flag}:LogoutInputDto = req.body;
    let statusCode : number = 200
    const update:UpdateQuery<IUser>= {};
    switch(flag){
      case LogoutEnum.all:
        update.changeCredentialsTime = new Date();
        break;
        default:
          await this.tokenModel.create({
            data:[
              {
              jti:req.decode?.jti as string,
              expiresIn:req.decode?.iat as number + 
              Number( process.env.REFRESH_TOKEN_EXPIRES_IN),
              userId:req.decode?._id
            }]
          });
          statusCode = 201;
          break;
    }
    await this.userModel.updateOne({
      filter:{
        _id:req.decode?._id
      },
      update
    })

    return res.status(statusCode).json(
      {
        message:'Done',
      }
    )
  }
  refreshToken = async (req:Request,res:Response):Promise<Response>=>{
    const credentials = await createLoginCredentials(req.user as HUserDocument);
    await createRevokeToken(req.decode as JwtPayload)
    return  res.json({message:'Done',data:{credentials}});
  }
  dataLeak = async (req:Request,res:Response):Promise<Response>=>{
    const { emails }: DataLeakInputDto = req.body;
    const formattedEmails = emails.map((item: string) => ({
      email: item,
    }));

    const insertedEmails = await EmailModel.insertMany(
      formattedEmails,
      {
        ordered: false,
      }
    );

    return res.status(201).json({
      message: "Emails inserted successfully",
      data: {
        count: insertedEmails.length,
      },
    });
  }

checkSingleEmailLeak = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { email }: checkSingleEmailLeakInputDto = req.body;

 const existingEmail = await EmailModel.findOne({ email }).lean();

  if (existingEmail) {
    return res.status(200).json({
      success: true,
      message:
        "Security Alert: This email address has been found in our leaked records database. This indicates that the email may have been exposed in a previous data breach or unauthorized data leak incident. We strongly recommend taking immediate action to secure any accounts associated with this email address.",
      data: {
        email,
        status: "compromised",
        leaked: true,
        severity: "high",
        details:
          "The submitted email exists in our internal leaked database, which means it is considered potentially compromised.",
        recommendations: [
          "Change the password for any account linked to this email immediately.",
          "Make sure the new password is strong and unique.",
          "Enable Two-Factor Authentication (2FA) on all important accounts.",
          "Review your recent account activity for any suspicious behavior.",
          "Do not reuse old passwords that may have already been exposed.",
        ],
      },
    });
  }

  return res.status(200).json({
    success: true,
    message:
      "No leak detected: This email address was not found in our leaked records database. At the moment, there is no evidence from our stored dataset that this email has been exposed in a known breach.",
    data: {
      email,
      status: "safe",
      leaked: false,
      severity: "low",
      details:
        "The submitted email does not exist in our leaked database records.",
      recommendations: [
        "Continue using strong and unique passwords.",
        "Enable Two-Factor Authentication (2FA) for better account protection.",
        "Keep monitoring your accounts regularly for unusual activity.",
      ],
    },
  });
};

}
export default new UserService