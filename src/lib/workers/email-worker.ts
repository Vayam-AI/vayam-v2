import { Worker, Job } from "bullmq";
import { redisConnection, InviteEmailJobData, updateBatchCompleted, updateBatchFailed } from "@/lib/queue";
import { sendEmail } from "@/utils/email";
import { EmailTemplateProcessor } from "@/utils/email-templates";

const DEFAULT_SUBJECT = "You're invited to join a conversation on Vayam";

async function processInviteEmail(job: Job<InviteEmailJobData>) {
  const { to, recipientName, questionTitle, questionId, inviteLink, customSubject, customBody, batchId } = job.data;

  try {
    let subject = customSubject || DEFAULT_SUBJECT;
    let html: string;

    // Replace placeholders in subject
    subject = subject
      .replace(/\{\{name\}\}/g, recipientName || "there")
      .replace(/\{\{questionTitle\}\}/g, questionTitle);

    if (customBody) {
      // Use admin-customised body with variable replacement
      html = customBody
        .replace(/\{\{name\}\}/g, recipientName || "there")
        .replace(/\{\{questionTitle\}\}/g, questionTitle)
        .replace(/\{\{questionId\}\}/g, String(questionId))
        .replace(/\{\{inviteLink\}\}/g, inviteLink)
        .replace(/\{\{platformUrl\}\}/g, process.env.NEXTAUTH_URL || "http://localhost:3000");
    } else {
      // Use default HTML template
      html = await EmailTemplateProcessor.renderTemplate("question-invite", {
        name: recipientName || "there",
        questionTitle,
        questionId: String(questionId),
        inviteLink,
        platformUrl: process.env.NEXTAUTH_URL || "http://localhost:3000",
      });
    }

    const result = await sendEmail(to, subject, html, true);

    if (!result.success) {
      throw new Error(result.error || "Email send failed");
    }

    // Track batch completion
    if (batchId) {
      await updateBatchCompleted(batchId);
    }

    return { success: true, email: to };
  } catch (error) {
    // Track batch failure (only on final attempt)
    if (batchId && job.attemptsMade >= (job.opts?.attempts ?? 3) - 1) {
      await updateBatchFailed(batchId, to);
    }
    console.error(`[email-worker] Failed to send invite to ${to}:`, error);
    throw error; // BullMQ will retry
  }
}

let workerStarted = false;

export function startEmailWorker() {
  if (workerStarted) return;
  workerStarted = true;

  const worker = new Worker<InviteEmailJobData>(
    "email",
    async (job) => {
      switch (job.name) {
        case "send-invite":
          return processInviteEmail(job);
        default:
          console.warn(`[email-worker] Unknown job name: ${job.name}`);
      }
    },
    {
      connection: redisConnection,
      concurrency: 5,
      limiter: { max: 10, duration: 1000 }, // rate-limit 10 emails/sec
    }
  );

  worker.on("completed", (job) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[email-worker] Job ${job.id} completed for ${job.data.to}`);
    }
  });

  worker.on("failed", (job, err) => {
    console.error(`[email-worker] Job ${job?.id} failed:`, err.message);
  });

  console.log("[email-worker] Worker started");
}
