import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { log } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const { mobile } = await req.json();
    
    if (!mobile) {
      log('warn', 'Mobile check without mobile number', undefined, false);
      return NextResponse.json({ error: "Mobile number is required" }, { status: 400 });
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.mobile, mobile))
      .limit(1);

    log('info', 'Mobile number existence check', undefined, false, { mobile, exists: user.length > 0 });

    return NextResponse.json({ exists: user.length > 0 });
  } catch(error) {
    log('error', 'Mobile check error', undefined, false, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}