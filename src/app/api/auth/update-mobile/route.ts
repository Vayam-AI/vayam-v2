import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth-options";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    const uid = Number(session.user.id);
    const { mobile, verified = true } = await req.json();
    
    if (!mobile || typeof mobile !== "string") {
      return NextResponse.json(
        { error: "Mobile number required" },
        { status: 400 }
      );
    }

    // Validate mobile format
    const mobileRegex = /^\+91[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      return NextResponse.json(
        { error: "Invalid mobile number format" },
        { status: 400 }
      );
    }

    // Check if mobile is already taken by another user
    const existingMobile = await db
      .select()
      .from(users)
      .where(eq(users.mobile, mobile))
      .limit(1);
    
    if (existingMobile.length > 0 && existingMobile[0].uid !== uid) {
      return NextResponse.json(
        { error: "Mobile number is already registered by another user" },
        { status: 409 }
      );
    }

    await db
      .update(users)
      .set({ 
        isMobileVerified: verified,
        mobile 
      })
      .where(eq(users.uid, uid));
      
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update mobile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}