import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-options";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { UpdatePersonalEmailRequest } from "@/types/vayam";
import { EmailNotifications } from "@/utils/email-templates";

/**
 * POST /api/users/personal-email - Update personal email for private users
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body: UpdatePersonalEmailRequest = await req.json();
    const { personalEmail } = body;

    if (!personalEmail || !personalEmail.includes("@")) {
      return NextResponse.json(
        { error: "Valid personal email is required" },
        { status: 400 }
      );
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is a private user
    if (user.userType === "regular") {
      return NextResponse.json(
        { error: "Personal email is only for private organization users" },
        { status: 400 }
      );
    }

    // Check if personal email is already in use
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, personalEmail))
      .limit(1);

    if (existingUser && existingUser.uid !== user.uid) {
      return NextResponse.json(
        { error: "This email is already registered" },
        { status: 400 }
      );
    }

    // Update personal email
    const [updatedUser] = await db
      .update(users)
      .set({ personalEmail })
      .where(eq(users.uid, user.uid))
      .returning();

    // Send notification email
    try {
      await EmailNotifications.sendPersonalEmailAdded(
        personalEmail,
        user.username || "User",
        user.email ?? ""
      );
    } catch (emailError) {
      console.error("Failed to send email notification:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      user: {
        uid: updatedUser.uid,
        email: updatedUser.email,
        personalEmail: updatedUser.personalEmail,
      },
    });

  } catch (error) {
    console.error("Error updating personal email:", error);
    return NextResponse.json(
      { error: "Failed to update personal email" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/users/personal-email - Get current user's personal email
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      email: user.email,
      personalEmail: user.personalEmail,
      userType: user.userType,
    });

  } catch (error) {
    console.error("Error fetching personal email:", error);
    return NextResponse.json(
      { error: "Failed to fetch personal email" },
      { status: 500 }
    );
  }
}
