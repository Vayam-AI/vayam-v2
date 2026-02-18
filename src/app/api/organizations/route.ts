import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-options";
import { db } from "@/db/drizzle";
import { organizations, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CreateOrganizationRequest } from "@/types/vayam";
import { nanoid } from "nanoid";

/**
 * POST /api/organizations - Create a new organization
 * Only accessible by authenticated users
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

    const body: CreateOrganizationRequest = await req.json();
    const { name, domain, whitelistedEmails = [], accessMethod } = body;

    if (!name || !accessMethod) {
      return NextResponse.json(
        { error: "Organization name and access method are required" },
        { status: 400 }
      );
    }

    // Validate access method requirements
    if (accessMethod === "domain" && !domain) {
      return NextResponse.json(
        { error: "Domain is required for domain-based access" },
        { status: 400 }
      );
    }

    if (accessMethod === "whitelist" && (!whitelistedEmails || whitelistedEmails.length === 0)) {
      return NextResponse.json(
        { error: "Whitelisted emails are required for whitelist-based access" },
        { status: 400 }
      );
    }

    // Get user ID
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

    // Generate unique access link for QR/Link access
    const accessLink = accessMethod === "link_qr" ? nanoid(16) : null;

    // Create organization
    const [newOrg] = await db
      .insert(organizations)
      .values({
        name,
        domain: domain || null,
        accessLink,
        whitelistedEmails: whitelistedEmails || [],
        adminUserId: user.uid,
        isActive: true,
      })
      .returning();

    // Update user to be organization admin
    await db
      .update(users)
      .set({
        isOrgAdmin: true,
        organizationId: newOrg.id,
      })
      .where(eq(users.uid, user.uid));

    return NextResponse.json({
      success: true,
      organization: newOrg,
      accessUrl: accessLink ? `${process.env.NEXTAUTH_URL}/join/${accessLink}` : null,
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating organization:", error);
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/organizations - Get user's organization or list all (for admins)
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

    // If user has an organization, return it
    if (user.organizationId) {
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, user.organizationId))
        .limit(1);

      return NextResponse.json({ organization: org });
    }

    return NextResponse.json({ organization: null });

  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}
