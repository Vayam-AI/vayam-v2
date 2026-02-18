import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create reusable Gmail transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export const sendEmail = async (
  recipientEmail: string,
  subject: string,
  content: string,
  isHtml: boolean = true
) => {
  try {
    if (!process.env.GMAIL_USER) {
      throw new Error("GMAIL_USER not set");
    }

    const info = await transporter.sendMail({
      from: process.env.SENDER_EMAIL || process.env.GMAIL_USER,
      to: recipientEmail,
      subject,
      ...(isHtml ? { html: content } : { text: content }),
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: unknown) {
    if (process.env.NODE_ENV === "development") {
      console.error("Email Error:", error);
    }

    let errorMessage = "Failed to send email";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};