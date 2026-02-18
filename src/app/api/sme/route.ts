import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { inviteSmes } from "@/db/schema";
import { log } from "@/lib/logger"; // same logger you used in admin SME invite

export async function POST(req: NextRequest) {
  const requestId = Date.now(); // unique ID to trace request across logs
  log("info", "Incoming SME submission request", undefined, true, { requestId });

  try {
    const body = await req.json();
    const { email, role, background, areas } = body;

    // Validation
    if (!email || !role || !background || !areas?.length) {
      log(
        "warn",
        "SME form submission missing required fields",
        undefined,
        true,
        { email, role, background, areas, requestId }
      );

      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Insert into DB
    log("info", "Saving SME form submission to database", undefined, true, {
      email,
      role,
      background,
      areasCount: areas.length,
      requestId,
    });

    await db.insert(inviteSmes).values({
      email,
      role,
      background,
      areas: JSON.stringify(areas),
    });

    log("info", "SME submission saved successfully", undefined, true, {
      email,
      requestId,
    });

    return NextResponse.json({
      success: true,
      message: "Submission saved successfully",
    });
  } catch (error) {
    log("error", "Error saving SME form submission", undefined, false, {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
