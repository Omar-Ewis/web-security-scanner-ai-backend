import { createTransport } from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { BadRequestException } from "../response/error.response";

export const sendEmail = async (data: Mail.Options): Promise<void> => {
  try {
    if (!data.html && !data.attachments?.length && !data.text) {
      throw new BadRequestException("Missing email content");
    }

    const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";
    const EMAIL_PORT = Number(process.env.EMAIL_PORT || 587);
    const EMAIL_USER = process.env.EMAIL_USER as string;
    const EMAIL_PASS = (process.env.EMAIL_PASS as string).replace(/\s/g, "");

    const transportOptions: SMTPTransport.Options = {
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: EMAIL_PORT === 465,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000,
    };

    const transporter = createTransport(transportOptions);

    await transporter.verify();
    console.log("SMTP server is ready");

    const info = await transporter.sendMail({
      ...data,
      from:
        process.env.EMAIL_FROM ||
        `"${process.env.APP_NAME || "Black Cat"} 🍀" <${EMAIL_USER}>`,
    });

    console.log("Message sent:", info.messageId);
  } catch (error) {
    console.error("Send email error:", error);
    throw error;
  }
};