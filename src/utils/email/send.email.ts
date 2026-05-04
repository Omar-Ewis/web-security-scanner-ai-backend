import { createTransport } from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import { BadRequestException } from "../response/error.response";

export const sendEmail = async (data: Mail.Options): Promise<void> => {
  console.log("sendEmail called");

  if (!data.html && !data.attachments?.length && !data.text) {
    throw new BadRequestException("Missing email content");
  }

  const transporter = createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL as string,
      pass: process.env.EMAIL_PASSWORD as string,
    },
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 20000,
  });

  try {
    const info = await transporter.sendMail({
      ...data,
      from: `"${process.env.APP_NAME || "VulnScanner"}" <${process.env.EMAIL}>`,
    });

    console.log("Message sent:", info.messageId);
  } catch (error) {
    console.log("Email error:", error);
    throw error;
  }
};