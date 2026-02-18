export async function register() {
  // Only start the email worker in the Node.js runtime (not Edge)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startEmailWorker } = await import("./lib/workers/email-worker");
    startEmailWorker();
  }
}
