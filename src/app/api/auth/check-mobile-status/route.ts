import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth-options";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const uid = Number(session.user.id);
    const user = await db
      .select({
        mobile: users.mobile,
        isMobileVerified: users.isMobileVerified,
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
    const needsMobileVerification = !userData.mobile || (!userData.isMobileVerified && userData.mobile !== "SKIPPED");

    return NextResponse.json({
      needsMobileVerification,
      hasMobile: !!userData.mobile && userData.mobile !== "SKIPPED",
      existingMobile: userData.mobile && userData.mobile !== "SKIPPED" ? userData.mobile : null,
      isMobileVerified: userData.isMobileVerified || false,
      isSkipped: userData.mobile === "SKIPPED",
    });
  } catch (error) {
    console.error("Check mobile status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}