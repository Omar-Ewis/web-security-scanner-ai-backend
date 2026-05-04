import { createTransport } from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { BadRequestException } from "../response/error.response";

// ✅ Validate ENV variables مرة واحدة
const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";
const EMAIL_PORT = Number(process.env.EMAIL_PORT || 587);
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM;
const APP_NAME = process.env.APP_NAME || "Black Cat";

if (!EMAIL_USER || !EMAIL_PASS) {
  throw new Error("Missing EMAIL_USER or EMAIL_PASS in environment variables");
}

// ✅ Create transporter مرة واحدة (أفضل للـ performance)
const transportOptions: SMTPTransport.Options = {
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465, // SSL لو 465
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
};

const transporter = createTransport(transportOptions);

// 🚀 Send Email Function
export const sendEmail = async (data: Mail.Options): Promise<void> => {
  try {
    // ✅ Validation بسيط
    if (!data.html && !data.text && !data.attachments?.length) {
      throw new BadRequestException("Missing email content");
    }

    const info = await transporter.sendMail({
      ...data,
      from:
        EMAIL_FROM ||
        `"${APP_NAME} 🍀" <${EMAIL_USER}>`,
    });

    console.log("✅ Message sent:", info.messageId);
  } catch (error) {
    console.error("❌ Send email error:", error);
    throw error;
  }
};