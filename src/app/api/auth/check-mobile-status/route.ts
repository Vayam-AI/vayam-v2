import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth-options";
import { eq } from "drizzle-orm";
import { log } from "@/lib/logger";

export async function GET() {
  try {
    const session = await auth();
    
    if (!session || !session.user?.id) {
      log('warn', 'Unauthorized mobile status check', undefined, false);
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.id;
    const uid = Number(userId);
    const user = await db
      .select({
        mobile: users.mobile,
        isMobileVerified: users.isMobileVerified,
        hasSkippedMobileVerification: users.hasSkippedMobileVerification
      })
      .from(users)
      .where(eq(users.uid, uid))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = user[0];
    
    // User needs mobile verification if they don't have a mobile number or it's not verified
    // BUT if mobile is "SKIPPED", they chose to skip so don't require verification
    const needsMobileVerification = !userData.isMobileVerified && !userData.hasSkippedMobileVerification;

    log('info', 'Mobile status checked', userId, true, { needsMobileVerification });

    return NextResponse.json({
      needsMobileVerification,
      hasMobile: !!userData.mobile && userData.mobile !== "SKIPPED",
      existingMobile: userData.mobile && userData.mobile !== "SKIPPED" ? userData.mobile : null,
      isMobileVerified: userData.isMobileVerified || false,
      isSkipped: userData.mobile === "SKIPPED",
    });
  } catch (error) {
    log('error', 'Check mobile status error', undefined, false, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}