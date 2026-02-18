import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users, organizations, companyUsers, questionAccess } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { passwordService } from "@/utils/password";
import { otpService } from "@/utils/otp";
import { EmailNotifications } from "@/utils/email-templates";
import { log } from "@/lib/logger";
import { validateOrganizationAccess } from "@/lib/access-control";
import type { UserType } from "@/types/vayam";

export async function POST(request: NextRequest) {
  try {
    const { email, password, username, accessLink, organizationId } = await request.json();
    
    // Log signup attempt
    log('info', 'Signup attempt', undefined, false, { email, accessLink, organizationId });

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

    // Validate organization access if provided
    let userType: UserType = "regular";
    let validatedOrgId: number | null = null;

    if (accessLink || organizationId) {
      const accessValidation = await validateOrganizationAccess(
        email,
        organizationId,
        accessLink
      );

      if (!accessValidation.valid) {
        return NextResponse.json(
          { error: accessValidation.error || "Access validation failed" },
          { status: 403 }
        );
      }

      userType = accessValidation.userType!;
      validatedOrgId = accessValidation.organizationId!;
    }

    // Hash password
    const hashedPassword = await passwordService.hashPassword(password);

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        email,
        username,
        pwhash: hashedPassword,
        provider: "email",
        isEmailVerified: false, // Will be verified via OTP
        isMobileVerified: false,
        userType,
        organizationId: validatedOrgId,
        isOrgAdmin: false,
        role: "user",
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
      
      // Log email sending failure
      log('error', 'Failed to send verification email', undefined, false, { email });
      
      return NextResponse.json(
        { error: "Failed to send verification email. Please try again." },
        { status: 500 }
      );
    }

    // Log successful signup
    log('info', 'User signup successful', newUser[0].uid.toString(), false, { 
      email, 
      userType,
      organizationId: validatedOrgId 
    });

    // Link company_users record and mark question_access as accepted
    try {
      const cuRows = await db
        .select()
        .from(companyUsers)
        .where(eq(companyUsers.email, email.toLowerCase()));
      for (const cu of cuRows) {
        await db
          .update(companyUsers)
          .set({ isRegistered: true, userId: newUser[0].uid, updatedAt: new Date() })
          .where(eq(companyUsers.id, cu.id));
        // Mark any pending access as accepted
        await db
          .update(questionAccess)
          .set({ inviteStatus: "accepted" })
          .where(and(eq(questionAccess.companyUserId, cu.id), eq(questionAccess.inviteStatus, "sent")));
      }
    } catch {
      // Don't fail signup if linkage fails
    }

    // If private user, send private registration email
    if (validatedOrgId && (userType === "private_domain" || userType === "private_whitelist")) {
      try {
        const [org] = await db
          .select()
          .from(organizations)
          .where(eq(organizations.id, validatedOrgId))
          .limit(1);

        if (org) {
          await EmailNotifications.sendPrivateUserRegistration(email, {
            name: username || "User",
            organizationName: org.name,
            workEmail: email,
            addPersonalEmailUrl: `${process.env.NEXTAUTH_URL}/profile?action=add-personal-email`,
            platformUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
          });
        }
      } catch (emailError) {
        console.error("Failed to send private user registration email:", emailError);
        // Don't fail the request
      }
    }

    return NextResponse.json(
      { 
        message: "Account created successfully. Please check your email for verification code.",
        email: email,
        userType,
      },
      { status: 201 }
    );

  } catch (error) {
    // Log error
    log('error', 'Signup error', undefined, false, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}