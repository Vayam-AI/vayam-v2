import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-options";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Profile response interface
interface ProfileResponse {
  uid: number;
  email: string;
  mobile: string | null;
  provider: string;
  isEmailVerified: boolean;
  isMobileVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Profile update schema
const profileUpdateSchema = z.object({
  mobile: z.string()
    .regex(/^(\+91|91)?[6-9]\d{9}$/, "Mobile must be a valid Indian mobile number")
    .optional()
    .transform(val => {
      if (!val) return val;
      // Normalize to +91XXXXXXXXXX format
      const cleaned = val.replace(/\D/g, '');
      if (cleaned.startsWith('91') && cleaned.length === 12) {
        return '+' + cleaned;
      } else if (cleaned.length === 10) {
        return '+91' + cleaned;
      }
      return val;
    }),
});

// GET /api/profile - Get user profile
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user profile from database
    const userProfile = await db
      .select({
        uid: users.uid,
        email: users.email,
        mobile: users.mobile,
        provider: users.provider,
        isEmailVerified: users.isEmailVerified,
        isMobileVerified: users.isMobileVerified,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (userProfile.length === 0) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const profile = userProfile[0];
    const response: ProfileResponse = {
      uid: profile.uid,
      email: profile.email!,
      mobile: profile.mobile,
      provider: profile.provider || "email",
      isEmailVerified: profile.isEmailVerified || false,
      isMobileVerified: profile.isMobileVerified || false,
      createdAt: profile.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: profile.createdAt?.toISOString() || new Date().toISOString(), // Using createdAt as updatedAt since we don't have updatedAt field
    };

    return NextResponse.json({
      success: true,
      data: response,
    });

  } catch {
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = profileUpdateSchema.parse(body);

    // Check if user exists
    const existingUser = await db
      .select({ uid: users.uid })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // If mobile is being updated, check if it's already in use
    if (validatedData.mobile) {
      const existingMobile = await db
        .select({ uid: users.uid })
        .from(users)
        .where(eq(users.mobile, validatedData.mobile))
        .limit(1);

      if (existingMobile.length > 0 && existingMobile[0].uid !== existingUser[0].uid) {
        return NextResponse.json(
          { success: false, message: "Mobile number is already registered" },
          { status: 400 }
        );
      }
    }

    // Update user profile
    const updateData: { mobile?: string; isMobileVerified?: boolean } = {};
    if (validatedData.mobile !== undefined) {
      updateData.mobile = validatedData.mobile;
      updateData.isMobileVerified = false; // Reset verification when mobile changes
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.email, session.user.email));

    // Return updated profile
    const updatedProfile = await db
      .select({
        uid: users.uid,
        email: users.email,
        mobile: users.mobile,
        provider: users.provider,
        isEmailVerified: users.isEmailVerified,
        isMobileVerified: users.isMobileVerified,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    const profile = updatedProfile[0];
    const response: ProfileResponse = {
      uid: profile.uid,
      email: profile.email!,
      mobile: profile.mobile,
      provider: profile.provider || "email",
      isEmailVerified: profile.isEmailVerified || false,
      isMobileVerified: profile.isMobileVerified || false,
      createdAt: profile.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: new Date().toISOString(), // Current timestamp for updates
    };

    return NextResponse.json({
      success: true,
      data: response,
      message: "Profile updated successfully",
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Invalid data", errors: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}