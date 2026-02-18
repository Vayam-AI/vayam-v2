import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-options";
import { db } from "@/db/drizzle";
import { companyUsers, questionAccess, users, organizations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { isAdminUser } from "@/lib/admin";
import { log } from "@/lib/logger";

async function getAdminOrg(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) return null;
  if (!isAdminUser(user.role)) return null;
  if (user.organizationId) return user.organizationId;
  const [org] = await db.select().from(organizations).where(eq(organizations.adminUserId, user.uid)).limit(1);
  return org?.id ?? null;
}

// DELETE — remove a company user
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const orgId = await getAdminOrg(session.user.email);
  if (!orgId) {
    return NextResponse.json({ error: "No organization found" }, { status: 404 });
  }

  const { id } = await params;
  const companyUserId = parseInt(id, 10);
  if (isNaN(companyUserId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    // Verify user belongs to admin's org
    const [cu] = await db
      .select()
      .from(companyUsers)
      .where(and(eq(companyUsers.id, companyUserId), eq(companyUsers.organizationId, orgId)))
      .limit(1);

    if (!cu) {
      return NextResponse.json({ error: "Company user not found" }, { status: 404 });
    }

    // Delete associated question access records first
    await db
      .delete(questionAccess)
      .where(eq(questionAccess.companyUserId, companyUserId));

    // Delete the company user
    await db.delete(companyUsers).where(eq(companyUsers.id, companyUserId));

    log("info", "Company user deleted", session.user.id, true, { companyUserId });

    return NextResponse.json({ success: true });
  } catch (error) {
    log("error", "Failed to delete company user", session.user.id, true, {
      error: error instanceof Error ? error.message : "Unknown",
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH — update a company user
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const orgId = await getAdminOrg(session.user.email);
  if (!orgId) {
    return NextResponse.json({ error: "No organization found" }, { status: 404 });
  }

  const { id } = await params;
  const companyUserId = parseInt(id, 10);
  if (isNaN(companyUserId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { name, department, email } = body;

    const [cu] = await db
      .select()
      .from(companyUsers)
      .where(and(eq(companyUsers.id, companyUserId), eq(companyUsers.organizationId, orgId)))
      .limit(1);

    if (!cu) {
      return NextResponse.json({ error: "Company user not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (department !== undefined) updates.department = department;
    if (email !== undefined) updates.email = email.toLowerCase();

    await db.update(companyUsers).set(updates).where(eq(companyUsers.id, companyUserId));

    return NextResponse.json({ success: true });
  } catch (error) {
    log("error", "Failed to update company user", session.user.id, true, {
      error: error instanceof Error ? error.message : "Unknown",
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
