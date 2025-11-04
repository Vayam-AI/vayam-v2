import sgMail from '@sendgrid/mail';
import dotenv from "dotenv"

dotenv.config()

// Initialize SendGrid
if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY environment variable is required');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendEmail = async (
  recipientEmail: string,
  subject: string,
  content: string,
  isHtml: boolean = true
) => {
  try {
    // Validate environment variables
    if (!process.env.SENDER_EMAIL) {
      throw new Error("SENDER_EMAIL not set");
    }

    const msg = {
      to: recipientEmail,
      from: process.env.SENDER_EMAIL, // Must be verified in SendGrid
      subject: subject,
      ...(isHtml ? { html: content } : { text: content }),
    };

    const [response] = await sgMail.send(msg);
   
    return { 
      success: true, 
      messageId: response.headers['x-message-id'],
      statusCode: response.statusCode
    };
  } catch (error: unknown) {
    // Enhanced error handling for SendGrid
    const err = error as { response?: { body?: { errors?: unknown[] } } };
    
    if (process.env.NODE_ENV === 'development') {
      console.error("SendGrid Error:", error);
      
      if (err.response) {
        console.error("SendGrid Response Body:", err.response.body);
      }
    }

    // User-friendly error messages
    let errorMessage = "Failed to send email";
    if (err.response?.body?.errors) {
      const errors = err.response.body.errors as Array<{ message?: string }>;
      errorMessage = errors[0]?.message || errorMessage;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return { 
      success: false, 
      error: errorMessage
    };
  }
}