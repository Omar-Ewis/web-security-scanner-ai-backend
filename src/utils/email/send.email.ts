import { createTransport } from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { BadRequestException } from "../response/error.response";

// 🔍 Load ENV
const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";
const EMAIL_PORT = Number(process.env.EMAIL_PORT || 587);
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM;
const APP_NAME = process.env.APP_NAME || "Black Cat";

// 🔍 Debug ENV
console.log("📧 EMAIL CONFIG DEBUG:");
console.log("EMAIL_HOST:", EMAIL_HOST);
console.log("EMAIL_PORT:", EMAIL_PORT);
console.log("EMAIL_USER exists:", !!EMAIL_USER);
console.log("EMAIL_PASS length:", EMAIL_PASS ? EMAIL_PASS.length : "undefined");
console.log("EMAIL_FROM:", EMAIL_FROM);

// ❌ Stop لو مفيش بيانات
if (!EMAIL_USER || !EMAIL_PASS) {
  console.error("❌ Missing EMAIL_USER or EMAIL_PASS");
}

// ⚙️ Transport options
const transportOptions: SMTPTransport.Options = {
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },

  // 🔥 مهم للـ debugging
  logger: true,   // يطبع logs من nodemailer
  debug: true,    // تفاصيل SMTP

  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 20000,
};

// 🚀 Create transporter
const transporter = createTransport(transportOptions);

// 📤 Send Email
export const sendEmail = async (data: Mail.Options): Promise<void> => {
  try {
    console.log("📨 Preparing to send email...");
    console.log("To:", data.to);
    console.log("Subject:", data.subject);

    if (!data.html && !data.text && !data.attachments?.length) {
      throw new BadRequestException("Missing email content");
    }

    const info = await transporter.sendMail({
      ...data,
      from:
        EMAIL_FROM ||
        `"${APP_NAME} 🍀" <${EMAIL_USER}>`,
    });

    console.log("✅ Message sent successfully!");
    console.log("Message ID:", info.messageId);
  } catch (error: any) {
    console.error("❌ Send email error:");
    console.error("Code:", error.code);
    console.error("Message:", error.message);
    console.error("Full Error:", error);

    throw error;
  }
};