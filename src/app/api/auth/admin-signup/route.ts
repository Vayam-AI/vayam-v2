import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { passwordService } from "@/utils/password";
import { otpService } from "@/utils/otp";
import { EmailNotifications } from "@/utils/email-templates";
import { log } from "@/lib/logger";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email, password, username, companyName, companyDomain } =
      await request.json();

    // Validate required fields
    if (!email || !password || !companyName) {
      return NextResponse.json(
        { error: "Email, password, and company name are required" },
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
        {
          error: "Password validation failed",
          details: passwordValidation.errors,
        },
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
      if (user.provider === "google") {
        return NextResponse.json(
          {
            error:
              "An account with this email already exists. Please sign in with Google instead.",
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // If domain is provided, check it isn't already taken
    if (companyDomain) {
      const existingOrg = await db
        .select()
        .from(organizations)
        .where(eq(organizations.domain, companyDomain.toLowerCase()))
        .limit(1);

      if (existingOrg.length > 0) {
        return NextResponse.json(
          { error: "An organization with this domain already exists" },
          { status: 409 }
        );
      }
    }

    // Hash password
    const hashedPassword = await passwordService.hashPassword(password);

    // Create user first (need uid for org.adminUserId)
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        username: username || email.split("@")[0],
        pwhash: hashedPassword,
        provider: "email",
        isEmailVerified: false,
        isMobileVerified: false,
        userType: "private_domain",
        isOrgAdmin: true,
        role: "company_admin",
      })
      .returning();

    // Create organization
    const accessLink = crypto.randomBytes(16).toString("hex");
    const [newOrg] = await db
      .insert(organizations)
      .values({
        name: companyName,
        domain: companyDomain ? companyDomain.toLowerCase() : null,
        adminUserId: newUser.uid,
        accessLink,
        isActive: true,
        isLinkAccessEnabled: true,
      })
      .returning();

    // Update user with organizationId
    await db
      .update(users)
      .set({ organizationId: newOrg.id })
      .where(eq(users.uid, newUser.uid));

    // Generate and send OTP for email verification
    const otp = otpService.generateOTP();
    await otpService.storeOTP(email, otp);

    const emailResult = await EmailNotifications.sendOTPVerification(email, {
      otp,
    });

    if (!emailResult.success) {
      // Rollback: delete user and org
      await db.delete(users).where(eq(users.uid, newUser.uid));
      await db.delete(organizations).where(eq(organizations.id, newOrg.id));

      log("error", "Admin signup - failed to send verification email", undefined, false, { email });

      return NextResponse.json(
        { error: "Failed to send verification email. Please try again." },
        { status: 500 }
      );
    }

    log("info", "Admin signup successful", newUser.uid.toString(), false, {
      email,
      companyName,
      organizationId: newOrg.id,
    });

    return NextResponse.json(
      {
        message:
          "Admin account created successfully. Please check your email for verification code.",
        email,
        organizationId: newOrg.id,
      },
      { status: 201 }
    );
  } catch (error) {
    log("error", "Admin signup error", undefined, false, {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
