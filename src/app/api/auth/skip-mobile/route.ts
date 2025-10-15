import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-options";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const uid = Number(session.user.id);

    // Update user's mobile status to "SKIPPED" to indicate they chose to skip mobile verification
    await db
      .update(users)
      .set({ 
        mobile: "SKIPPED",
        isMobileVerified: false // Keep this false since they didn't verify
      })
      .where(eq(users.uid, uid));

    return NextResponse.json({ success: true, message: "Mobile verification skipped" });
  } catch (error) {
    console.error("Skip mobile verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}