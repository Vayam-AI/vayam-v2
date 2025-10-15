import { NextRequest, NextResponse } from "next/server";
import { otpService } from "@/utils/otp";
import { EmailNotifications } from "@/utils/email-templates";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
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

    // Check if OTP already exists (rate limiting)
    const hasActiveOTP = await otpService.hasActiveOTP(email);
    if (hasActiveOTP) {
      const ttl = await otpService.getOTPTTL(email);
      return NextResponse.json(
        { 
          error: "OTP already sent. Please wait before requesting a new one.",
          retryAfter: ttl 
        },
        { status: 429 }
      );
    }

    // Generate and store OTP
    const otp = otpService.generateOTP();
    await otpService.storeOTP(email, otp);

    // Send OTP via email using template
    const emailResult = await EmailNotifications.sendOTPVerification(email, { otp });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: "Failed to send OTP email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "OTP sent successfully to your email" },
      { status: 200 }
    );

  } catch (error) {
    // Send OTP error logged in development only
    if (process.env.NODE_ENV === 'development') {
      console.error("Send OTP error:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}