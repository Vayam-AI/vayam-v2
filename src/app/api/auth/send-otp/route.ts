import { NextRequest, NextResponse } from "next/server";
import { otpService } from "@/utils/otp";
import { EmailNotifications } from "@/utils/email-templates";
import { log } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    log('info', 'OTP send request', undefined, false, { email });

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
      log('warn', 'OTP rate limit exceeded', undefined, false, { email, retryAfter: ttl });
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
      log('error', 'Failed to send OTP email', undefined, false, { email });
      return NextResponse.json(
        { error: "Failed to send OTP email. Please try again." },
        { status: 500 }
      );
    }

    log('info', 'OTP sent successfully', undefined, false, { email });

    return NextResponse.json(
      { message: "OTP sent successfully to your email" },
      { status: 200 }
    );

  } catch (error) {
    log('error', 'Send OTP error', undefined, false, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}