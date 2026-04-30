import {z} from 'zod';
import { generalFeild } from '../../middleware/validation.middleware';
export const login = {
  body:z.strictObject({
      email:generalFeild.email,
      password:generalFeild.password,
    })
}
export const signup = {
  body:login.body.extend(
    {
      username:generalFeild.username,
      confirmPassword:generalFeild.confirmPassword
    })
    .superRefine((data,ctx)=>{
      console.log({data,ctx});
      if(data.confirmPassword !== data.password){
        ctx.addIssue(
          {
            code:"custom",
            path:['confirm'],
            message:"password mismatch confirmPassword"
          }
        )
      }
      if(data.username?.split(" ")?.length!=2){
        ctx.addIssue(
          {
            code:"custom",
            path:['username'],
            message:"username must consist of 2 parts like ex:Omar Ewis"
          }
        )
      }
    
    })
}
export const confirmEmail = {
  body:z.strictObject({
    email:generalFeild.email,
    OTP:generalFeild.OTP
  })
}
export const resendConfirmEmail = {
  body:z.strictObject({
    email:generalFeild.email,
  })
}
export const signupWithGmail = {
  body:z.strictObject({
    idToken:z.string()
  })
}