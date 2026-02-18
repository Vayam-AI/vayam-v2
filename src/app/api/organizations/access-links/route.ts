import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-options";
import { db } from "@/db/drizzle";
import { organizations, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createAccessLink, getOrganizationAccessLink, revokeAccessLink } from "@/lib/access-control";
import { isAdminUser } from "@/lib/admin";

/**
 * Verify the authenticated user is an admin of the given organization.
 */
async function verifyOrgAdmin(email: string, organizationId: number) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !isAdminUser(user.role)) return null;
  const [org] = await db.select().from(organizations).where(
    and(eq(organizations.id, organizationId), eq(organizations.adminUserId, user.uid))
  ).limit(1);
  return org ? user : null;
}

/**
 * GET /api/organizations/access-links - Get current access link for an organization
 * Requires: ?organizationId=<id>
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = req.nextUrl.searchParams.get("organizationId");
    if (!organizationId) {
      return NextResponse.json({ error: "organizationId parameter is required" }, { status: 400 });
    }

    // Verify user is admin of this organization
    const admin = await verifyOrgAdmin(session.user.email, parseInt(organizationId));
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const linkInfo = await getOrganizationAccessLink(parseInt(organizationId));

    return NextResponse.json({
      token: linkInfo.token,
      isEnabled: linkInfo.isEnabled,
      expiresAt: linkInfo.expiresAt,
      usageCount: linkInfo.usageCount,
      shareUrl: linkInfo.token ? `${process.env.NEXTAUTH_URL}/join/${linkInfo.token}` : null,
    });

  } catch (error) {
    console.error("Error fetching access link:", error);
    return NextResponse.json(
      { error: "Failed to fetch access link" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organizations/access-links - Create or regenerate access link
 * Body: { organizationId: number, options?: { maxUsage?: number, expiresAt?: string } }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { organizationId, options } = body;

    if (!organizationId) {
      return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
    }

    // Verify user is admin of this organization
    const admin = await verifyOrgAdmin(session.user.email, organizationId);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await createAccessLink(
      organizationId,
      admin.uid,
      {
        maxUsage: options?.maxUsage,
        expiresAt: options?.expiresAt ? new Date(options.expiresAt) : undefined,
        accessType: options?.accessType || "public_link",
      }
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        token: result.token,
        shareUrl: `${process.env.NEXTAUTH_URL}/join/${result.token}`,
      });
    }

    return NextResponse.json(
      { error: result.error || "Failed to create access link" },
      { status: 500 }
    );

  } catch (error) {
    console.error("Error creating access link:", error);
    return NextResponse.json(
      { error: "Failed to create access link" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organizations/access-links - Revoke an access link
 * Requires: ?organizationId=<id>
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = req.nextUrl.searchParams.get("organizationId");
    if (!organizationId) {
      return NextResponse.json({ error: "organizationId parameter is required" }, { status: 400 });
    }

    // Verify user is admin of this organization
    const admin = await verifyOrgAdmin(session.user.email, parseInt(organizationId));
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const success = await revokeAccessLink(parseInt(organizationId));

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Access link revoked",
      });
    }

    return NextResponse.json(
      { error: "Failed to revoke access link" },
      { status: 500 }
    );

  } catch (error) {
    console.error("Error revoking access link:", error);
    return NextResponse.json(
      { error: "Failed to revoke access link" },
      { status: 500 }
    );
  }
}
