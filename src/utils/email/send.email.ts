import { createTransport } from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import { BadRequestException } from "../response/error.response";

export const sendEmail = async (data: Mail.Options): Promise<void> => {
  try {
    if (!data.html && !data.attachments?.length && !data.text) {
      throw new BadRequestException("Missing email content");
    }

    console.log({
      EMAIL: process.env.EMAIL,
      EMAIL_PASSWORD_EXISTS: Boolean(process.env.EMAIL_PASSWORD),
      EMAIL_PASSWORD_LENGTH: process.env.EMAIL_PASSWORD?.length,
      APP_NAME: process.env.APP_NAME,
    });

    const transporter = createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL as string,
        pass: process.env.EMAIL_PASSWORD as string,
      },
    });

    await transporter.verify();
    console.log("SMTP server is ready");

    const info = await transporter.sendMail({
      ...data,
      from: `"${process.env.APP_NAME || "Black Cat"} 🍀" <${process.env.EMAIL}>`,
    });

    console.log("Message sent:", info.messageId);
  } catch (error) {
    console.error("Send email error:", error);
    throw error;
  }
};