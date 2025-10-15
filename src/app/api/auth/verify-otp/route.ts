import { NextRequest, NextResponse } from "next/server";
import { otpService } from "@/utils/otp";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { EmailNotifications } from "@/utils/email-templates";

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    // Validate input
    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    // Verify OTP
    const isValidOTP = await otpService.verifyOTP(email, otp);
    
    if (!isValidOTP) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    // Update user's email verification status
    const updatedUser = await db
      .update(users)
      .set({ isEmailVerified: true })
      .where(eq(users.email, email))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Send welcome email to newly verified user
    try {
      await EmailNotifications.sendWelcomeEmail(email, {
        platformUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        dashboardUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`
      });
    } catch (error) {
      // Log welcome email error but don't fail the verification
      if (process.env.NODE_ENV === 'development') {
        console.error("Failed to send welcome email:", error);
      }
    }

    return NextResponse.json(
      { 
        message: "Email verified successfully",
        success: true 
      },
      { status: 200 }
    );

  } catch (error) {
    // Verify OTP error logged in development only
    if (process.env.NODE_ENV === 'development') {
      console.error("Verify OTP error:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}