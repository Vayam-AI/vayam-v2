import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const sendEmail = async (
  recipientEmail: string,
  subject: string,
  content: string,
  isHtml: boolean = true
) => {
  try {
    // Validate environment variables
    if (!process.env.SENDER_EMAIL || !process.env.SENDER_PASS) {
      throw new Error("Email configuration missing: SENDER_EMAIL or SENDER_PASS not set");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.SENDER_PASS,
      },
    });

    // Verify transporter configuration
    await transporter.verify();

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: recipientEmail,
      subject: subject,
      ...(isHtml ? { html: content } : { text: content }),
    };

    const info = await transporter.sendMail(mailOptions);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    // Email error logged in development only
    if (process.env.NODE_ENV === 'development') {
      console.error("Error sending email:", error);
    }
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown email error"
    };
  }
};