import type{ Request , Response} from "express"
import { IConfirmEmailBodyInputDto, IGmail, ILoginBodyInputDto, IResendConfirmEmailBodyInputDto, ISignupBodyInputDto } from "./auth.dto";
import { ProviderEnum, UserModel } from "../../DataBase/models/User.model";
import { UserRepository } from "../../DataBase/repository/user.repository";
import { BadRequestException, ConflictException, NotFoundException, RateLimitingException } from "../../utils/response/error.response";
import { compareHash, generateHash } from "../../utils/security/hash.security";
import { eventEmail } from "../../utils/events/email.event";
import { createLoginCredentials } from "../../utils/security/token.security";
import {OAuth2Client} from 'google-auth-library';
class Authentication {
  private userModel = new UserRepository(UserModel);
  constructor(){} 

  signup = async (req:Request,res:Response):Promise<Response> => {
    const {username , email , password}:ISignupBodyInputDto = req.body;   
    const check = await this.userModel.findOne(
      {
        filter:{email},
        projection:{password:-1},
        options:{
          lean:true
        }
      }
    )    
    if (check) {
      throw new ConflictException("Email Exists");
    }
    // generate OTP
    const OTP = Math.floor(100000 + Math.random() * 900000);
    let confirmEmailOTPAttempts = 0;
    const user = await this.userModel.createUser(
      {
        data:[
          {
            username ,
            email ,
            password: await generateHash(password),
            confirmEmailOTP: await generateHash(String(OTP)),
            confirmEmailOTPExpireAt:new Date(Date.now() + 2 * 60 * 1000),
            confirmEmailOTPAttempts,
            confirmEmailOTPBlockedUntil:null
          }
        ]
      }
    )
    eventEmail.emit("confirmEmail",{to:email , OTP})
    return res.status(201).json({message:'Done',data:{user}});
  }
  confirmEmail = async (req:Request,res:Response):Promise<Response> =>{
    const {email , OTP }:IConfirmEmailBodyInputDto = req.body;
    const user = await this.userModel.findOne({
      filter:{
        email,
        confirmEmailOTP:{ $exists: true },
        confirmedAt:{ $exists: false },
      }
    })
    if(!user){
      throw new NotFoundException('Invalid Account.')
    }
    // Check if user is blocked
    if (
      user.confirmEmailOTPBlockedUntil &&
      user.confirmEmailOTPBlockedUntil > new Date()
    ) {
      throw new RateLimitingException(
        `Too many attempts, try again after 5 minutes`
      );
    }

    // Check if OTP expired
    if (!user.confirmEmailOTPExpireAt || user.confirmEmailOTPExpireAt < new Date()) {
      throw new BadRequestException("OTP expired, please request a new one.");
    }

    // Check if OTP is correct
    const isValid = await compareHash(OTP, user.confirmEmailOTP as string);
    if (!isValid) {
      user.confirmEmailOTPAttempts! += 1;
      if (user.confirmEmailOTPAttempts! >= 5) {
        user.confirmEmailOTPBlockedUntil = new Date(Date.now() + 5 * 60 * 1000);
        await user.save();
        throw new RateLimitingException("Too many incorrect attempts. Try again later.");
      }
      await user.save();
      throw new BadRequestException("Invalid confirmation code.");
    }
    await this.userModel.updateOne({
      filter:{email},
      update:{
        confirmedAt:new Date(),
        $unset:{
          confirmEmailOTP:1,
          confirmEmailOTPAttempts:1,
          confirmEmailOTPExpireAt:1,
          confirmEmailOTPBlockedUntil:1
        }
      }
    })
    return res.status(201).json({message:'Done'})
  }
  resendConfirmEmail = async (req: Request, res: Response):Promise<Response> => {
    const { email } : IResendConfirmEmailBodyInputDto= req.body;
    const user = await this.userModel.findOne({
      filter: { email, confirmedAt: { $exists: false } }
    });
    if (!user) {
      throw new NotFoundException("Invalid account.");
    }
    if (
      user.confirmEmailOTPBlockedUntil &&
      user.confirmEmailOTPBlockedUntil > new Date()
    ) {
      throw new RateLimitingException(
        "You are blocked due to many failed attempts. Try later."
      );
    }
    const OTP = Math.floor(100000 + Math.random() * 900000);
    await this.userModel.updateOne({
      filter:{email},
      update:{
        confirmEmailOTP: await generateHash(String(OTP)),
        confirmEmailOTPExpireAt: new Date(Date.now() + 2 * 60 * 1000),
        confirmEmailOTPAttempts: 0,
        confirmEmailOTPBlockedUntil: null
      }
    });
    eventEmail.emit("confirmEmail", { to: email, OTP });
    return res.status(200).json({ message: "New OTP sent." });
  };
  login = async (req:Request,res:Response):Promise<Response> => {
    const {email , password}:ILoginBodyInputDto = req.body;
    const user = await this.userModel.findOne({
      filter: {
        email,
      },
      // options: {
      //   lean: true
      // }
    });
    if(!user){
      throw new NotFoundException('Invalid login data');
    }
    if(!user.confirmedAt){
      throw new BadRequestException('Verify your account first')
    }
    if(!(await compareHash(password,user.password as string))){
      throw new NotFoundException('Invalid login data');
    }
    const now = new Date();
    user.sessionCreatedAt = now;
    await user.save();

    console.log(user.sessionCreatedAt);
    
    const credentials = await createLoginCredentials(user)
    return res.status(201).json(
      {
        message:'Done',
        data: {credentials}
    });
  }
  private async verifyGmailAccount(idToken:string){
      const client = new OAuth2Client();
      const ticket = await client.verifyIdToken({
          idToken,
          audience: process.env.WEB_CLIENT_ID?.split(",") || [] ,  
      });
      const payload = ticket.getPayload();
      if(!payload?.email_verified){
        throw new BadRequestException('Fail to verify this Google Account. ');
      }
      
      return payload;
  }
  signupWithGmail = async (req:Request,res:Response) =>{  
    const {idToken}:IGmail= req.body;
    const {email,family_name,given_name,picture} = await this.verifyGmailAccount(idToken);
    const user = await this.userModel.findOne({
      filter:{email}
    })
  
    if(user){
      if(user.provider === ProviderEnum.Google){
        return this.loginWithGmail(req,res);
      }
      throw new NotFoundException('Email exists with another provider.')
    }
    const [newUser] = await this.userModel.create({
      data:[
        {
          email:email as string,
          firstName:given_name as string,
          lastName:family_name as string,
          picture:picture as string,
          confirmedAt:new Date(),
          sessionCreatedAt:new Date(),
          provider:ProviderEnum.Google
        }
      ]
    })
    if(!newUser){
      throw new BadRequestException('Fail to signup with Gmail. ');
    }
    const credentials = await createLoginCredentials(newUser);
    return res.status(200).json({message:'Done', data:{credentials}})

  }
  loginWithGmail = async (req:Request,res:Response) =>{  
    const {idToken}:IGmail= req.body;
    const {email} = await this.verifyGmailAccount(idToken);
    const user = await this.userModel.findOne({
      filter:{
        email,
        provider:ProviderEnum.Google
      }
    })
    if(!user){
      throw new NotFoundException('Not registered Account.')
    }
    if(!user.sessionCreatedAt){
      const now = new Date();
      await this.userModel.updateOne({
        filter:{email},
        update:{ $set:{ sessionCreatedAt: now }}
      });
      user.sessionCreatedAt = now;
    }
    const credentials = await createLoginCredentials(user);
    return res.status(200).json({message:'Done', data:{credentials}})

  }
  sendForgotOTPCode= async (req:Request,res:Response) =>{
    const {email} = req.body;
    const user = await this.userModel.findOne({
      filter:{
        email,
        confirmedAt:{ $exists:true },
        provider:ProviderEnum.System
      }
    })
    if(!user){
      throw new NotFoundException('Invalid Account');
    }
    const OTP = Math.floor(100000 + Math.random() * 900000);
    const result = await this.userModel.updateOne(
      {
        filter:{email},
        update:{
          
        }
      }
    )

  } 
}
export default new Authentication();