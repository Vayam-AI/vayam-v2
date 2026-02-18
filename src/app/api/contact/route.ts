import { EmailNotifications } from "@/utils/email-templates";
import { log } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    log('info', 'Incoming contact form submission');

    const { email, description } = await req.json();

    if (!email || !description) {
      log('warn', 'Invalid contact form submission — missing fields', undefined, false, { email, description });
      return Response.json({ error: "All fields are required" }, { status: 400 });
    }

    log('info', 'Sending contact form email', undefined, false, { senderEmail: email });

    const result = await EmailNotifications.sendContactFormEmail(
      "keerthi@vayam.ai", // recipient (your inbox)
      { email, description }
    );

    if (result.success) {
      log('info', 'Contact form email sent successfully', undefined, false, { senderEmail: email });
    } else {
      log('error', 'Contact form email failed to send', undefined, false, { senderEmail: email, error: result.error });
    }

    return Response.json(result);
  } catch (error) {
    log('error', 'Unexpected error in contact form API', undefined, false, {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
