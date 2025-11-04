import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-options";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { log } from "@/lib/logger";

export async function POST() {
  try {
    const session = await auth();
    
    if (!session || !session.user?.id) {
      log('warn', 'Unauthorized skip mobile attempt', undefined, false);
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.id;
    const uid = Number(userId);

    // Update user's mobile status to "SKIPPED" to indicate they chose to skip mobile verification
    await db
      .update(users)
      .set({ 
        mobile: null,
        isMobileVerified: false, // Keep this false since they didn't verify
        hasSkippedMobileVerification: true // Mark that user has skipped mobile verification
      })
      .where(eq(users.uid, uid));

    log('info', 'Mobile verification skipped', userId, true);

    return NextResponse.json({ success: true, message: "Mobile verification skipped" });
  } catch (error) {
    log('error', 'Skip mobile error', undefined, false, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}