import {createTransport} from 'nodemailer'
import Mail from 'nodemailer/lib/mailer';
import { BadRequestException } from '../response/error.response';

export const sendEmail = async (data:Mail.Options):Promise<void> =>{

  if(!data.html && !data.attachments?.length && !data.text){
    throw new BadRequestException('Missing email content');
  }

  const transporter = createTransport({
    service:"gmail",
    auth: {
      user: process.env.EMAIL as string,
      pass: process.env.EMAIL_PASSWORD as string,
    },
  });

  const info = await transporter.sendMail({
    ...data,
    from: `"${process.env.APP_NAME as string} 🍀" <${process.env.EMAIL as string}>`,
  });
  console.log("Message sent:", info.messageId);


}
