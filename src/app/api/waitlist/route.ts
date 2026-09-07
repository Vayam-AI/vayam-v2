import { db } from "@/db/drizzle";
import { waitlist } from "@/db/schema";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const raw = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!/.+@.+\..+/.test(raw)) {
      return Response.json(
        { success: false, error: "Enter an email we can reach you at." },
        { status: 400 },
      );
    }

    // Insert; if the email is already on the list, treat it as success (idempotent).
    await db.insert(waitlist).values({ email: raw }).onConflictDoNothing();

    return Response.json({ success: true });
  } catch {
    return Response.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
