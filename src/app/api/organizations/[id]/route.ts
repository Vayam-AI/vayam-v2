import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-options";
import { db } from "@/db/drizzle";
import { organizations, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAdminUser } from "@/lib/admin";

/**
 * PATCH /api/organizations/[id] - Update organization
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const orgId = parseInt(id);
    const body = await req.json();

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user || !isAdminUser(user.role)) {
      return NextResponse.json(
        { error: "Only organization admins can update organizations" },
        { status: 403 }
      );
    }

    // Verify user owns this organization
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (!org || org.adminUserId !== user.uid) {
      return NextResponse.json(
        { error: "Organization not found or unauthorized" },
        { status: 404 }
      );
    }

    // Update organization
    const [updatedOrg] = await db
      .update(organizations)
      .set({
        name: body.name || org.name,
        domain: body.domain !== undefined ? body.domain : org.domain,
        whitelistedEmails: body.whitelistedEmails || org.whitelistedEmails,
        isActive: body.isActive !== undefined ? body.isActive : org.isActive,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId))
      .returning();

    return NextResponse.json({ organization: updatedOrg });

  } catch (error) {
    console.error("Error updating organization:", error);
    return NextResponse.json(
      { error: "Failed to update organization" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organizations/[id] - Delete organization
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const orgId = parseInt(id);

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user || !isAdminUser(user.role)) {
      return NextResponse.json(
        { error: "Only organization admins can delete organizations" },
        { status: 403 }
      );
    }

    // Verify user owns this organization
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (!org || org.adminUserId !== user.uid) {
      return NextResponse.json(
        { error: "Organization not found or unauthorized" },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    await db
      .update(organizations)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(organizations.id, orgId));

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error deleting organization:", error);
    return NextResponse.json(
      { error: "Failed to delete organization" },
      { status: 500 }
    );
  }
}
