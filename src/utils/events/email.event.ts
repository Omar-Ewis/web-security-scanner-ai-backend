import { EventEmitter } from "node:events";
import Mail from "nodemailer/lib/mailer";
import { sendEmail } from "../email/send.email";
import { verifyEmail } from "../email/templet.email";

export const eventEmail = new EventEmitter();
interface IEmail extends Mail.Options{
  OTP:number;
}
eventEmail.on("confirmEmail",async(data:IEmail) => {
  try{
    data.subject = "Confirm-Email",
    data.html = verifyEmail(
      {
        otp:data.OTP,
        title:"Email Confirmation"
      }
    ),
    await sendEmail(data);
  }
  catch(err){
    console.log('Fail to send Email',err);
    
  }
})
eventEmail.on("resetPassword",async(data:IEmail) => {
  try{
    data.subject = "Reset-Account-Password",
    data.html = verifyEmail(
      {
        otp:data.OTP,
        title:"Reset Code"
      }
    ),
    await sendEmail(data);
  }
  catch(err){
    console.log('Fail to send Email',err);
    
  }
})
