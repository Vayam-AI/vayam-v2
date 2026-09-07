import { db } from "@/db/drizzle";
import { waitlist } from "@/db/schema";
import { sql } from "drizzle-orm";

let tableReady: Promise<void> | null = null;

function ensureWaitlistTable() {
  if (!tableReady) {
    tableReady = db
      .execute(
        sql`
          CREATE TABLE IF NOT EXISTS waitlist (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT NOW()
          )
        `,
      )
      .then(() => undefined);
  }
  return tableReady;
}

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

    await ensureWaitlistTable();

    // Insert; if the email is already on the list, treat it as success (idempotent).
    await db.insert(waitlist).values({ email: raw }).onConflictDoNothing({
      target: waitlist.email,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Waitlist signup failed:", error);
    return Response.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
