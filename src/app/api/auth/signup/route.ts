import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { passwordService } from "@/utils/password";
import { generateName } from "@/utils/generateName";
import { otpService } from "@/utils/otp";
import { EmailNotifications } from "@/utils/email-templates";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = passwordService.validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: "Password validation failed", details: passwordValidation.errors },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      const user = existingUser[0];
      if (user.provider === 'google') {
        return NextResponse.json(
          { error: "An account with this email already exists. Please sign in with Google instead." },
          { status: 409 }
        );
      } else {
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 409 }
        );
      }
    }

    // Hash password
    const hashedPassword = await passwordService.hashPassword(password);

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        email,
        username: generateName(),
        pwhash: hashedPassword,
        provider: "email",
        isEmailVerified: false, // Will be verified via OTP
        isMobileVerified: false,
      })
      .returning();

    // Generate and send OTP for email verification
    const otp = otpService.generateOTP();
    await otpService.storeOTP(email, otp);

    // Send OTP via email using template
    const emailResult = await EmailNotifications.sendOTPVerification(email, { otp });

    if (!emailResult.success) {
      // Delete user if email sending fails
      await db
        .delete(users)
        .where(eq(users.uid, newUser[0].uid));
        
      return NextResponse.json(
        { error: "Failed to send verification email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: "Account created successfully. Please check your email for verification code.",
        email: email
      },
      { status: 201 }
    );

  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}