import { NextRequest, NextResponse } from "next/server";
import { otpService } from "@/utils/otp";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { EmailNotifications } from "@/utils/email-templates";
import { log } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();
    
    log('info', 'OTP verification attempt', undefined, false, { email });

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
      log('warn', 'Invalid or expired OTP', undefined, false, { email });
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
      log('error', 'User not found during OTP verification', undefined, false, { email });
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userId = updatedUser[0].uid.toString();

    // Send welcome email to newly verified user
    try {
      const name = email.split('@')[0];
      const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);

      await EmailNotifications.sendWelcomeEmail(email, {
        name: capitalizedName,
        platformUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        dashboardUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`
      });
    } catch {
      log('error', 'Failed to send welcome email', userId, false, { email });
    }

    log('info', 'Email verified successfully', userId, false, { email });

    return NextResponse.json(
      { 
        message: "Email verified successfully",
        success: true 
      },
      { status: 200 }
    );

  } catch (error) {
    log('error', 'OTP verification error', undefined, false, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}