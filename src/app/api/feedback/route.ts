import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { feedback } from "@/db/schema";
import { log } from "@/lib/logger";
import { auth } from "@/lib/auth-options"; 

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      log("warn", "Unauthenticated feedback attempt", "anonymous", false);
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { comment } = body;

    log("info", "Feedback submission attempt", userId, true, { userId });

    // Validation
    if (!comment || typeof comment !== "string" || comment.trim().length === 0) {
      log("warn", "Invalid feedback data - empty comment", userId, true);
      return NextResponse.json(
        { error: "Comment is required" },
        { status: 400 }
      );
    }

    if (comment.length > 2000) {
      log("warn", "Invalid feedback data - comment too long", userId, true);
      return NextResponse.json(
        { error: "Comment is too long (max 2000 characters)" },
        { status: 400 }
      );
    }

    // Insert feedback
    const result = await db
      .insert(feedback)
      .values({
        uid: parseInt(userId),
        comment: comment.trim(),
      })
      .returning();

    log("info", "Feedback submitted successfully", userId, true, { feedbackId: result[0].id });

    return NextResponse.json(
      {
        success: true,
        message: "Feedback submitted successfully",
        data: result[0],
      },
      { status: 201 }
    );
  } catch (error) {
    log("error", "Feedback submission error", undefined, false, {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to submit feedback",
      },
      { status: 500 }
    );
  }
}
