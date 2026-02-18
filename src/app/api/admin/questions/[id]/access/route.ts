import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-options";
import { db } from "@/db/drizzle";
import { questionAccess, companyUsers, questions, users, organizations } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { isAdminUser } from "@/lib/admin";
import { log } from "@/lib/logger";

async function getAdminOrgAndUid(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) return null;
  if (!isAdminUser(user.role)) return null;
  let orgId: number | null = null;
  orgId = user.organizationId ?? null;
  if (!orgId) {
    const [org] = await db.select().from(organizations).where(eq(organizations.adminUserId, user.uid)).limit(1);
    orgId = org?.id ?? null;
  }
  if (!orgId) return null;
  return { orgId, uid: user.uid };
}

// GET — list who has access to a question
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const admin = await getAdminOrgAndUid(session.user.email);
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  const questionId = parseInt(id, 10);
  if (isNaN(questionId)) {
    return NextResponse.json({ error: "Invalid question ID" }, { status: 400 });
  }

  try {
    // Verify question belongs to admin's org or was created by admin
    const [q] = await db.select().from(questions).where(eq(questions.id, questionId)).limit(1);
    if (!q) return NextResponse.json({ error: "Question not found" }, { status: 404 });

    // Enforce org/ownership boundary
    if (q.owner !== admin.uid && q.organizationId !== admin.orgId) {
      return NextResponse.json({ error: "You don't have access to this question" }, { status: 403 });
    }

    // Get access list with company user info
    const accessList = await db
      .select({
        id: questionAccess.id,
        companyUserId: questionAccess.companyUserId,
        inviteStatus: questionAccess.inviteStatus,
        invitedAt: questionAccess.invitedAt,
        createdAt: questionAccess.createdAt,
        name: companyUsers.name,
        email: companyUsers.email,
        department: companyUsers.department,
        isRegistered: companyUsers.isRegistered,
      })
      .from(questionAccess)
      .innerJoin(companyUsers, eq(questionAccess.companyUserId, companyUsers.id))
      .where(eq(questionAccess.questionId, questionId));

    return NextResponse.json({ success: true, data: accessList });
  } catch (error) {
    log("error", "Failed to fetch question access", session.user.id, true, {
      error: error instanceof Error ? error.message : "Unknown",
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — grant access to company users for a question
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const admin = await getAdminOrgAndUid(session.user.email);
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  const questionId = parseInt(id, 10);
  if (isNaN(questionId)) {
    return NextResponse.json({ error: "Invalid question ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const companyUserIds: number[] = body.companyUserIds;

    if (!Array.isArray(companyUserIds) || companyUserIds.length === 0) {
      return NextResponse.json({ error: "Provide companyUserIds array" }, { status: 400 });
    }

    // Verify they belong to admin's org
    const cuRows = await db
      .select()
      .from(companyUsers)
      .where(
        and(
          inArray(companyUsers.id, companyUserIds),
          eq(companyUsers.organizationId, admin.orgId)
        )
      );
    const validIds = new Set(cuRows.map((r) => r.id));

    // Filter to only valid + not already granted
    const existing = await db
      .select({ companyUserId: questionAccess.companyUserId })
      .from(questionAccess)
      .where(eq(questionAccess.questionId, questionId));
    const existingSet = new Set(existing.map((r) => r.companyUserId));

    const toInsert = companyUserIds
      .filter((id) => validIds.has(id) && !existingSet.has(id))
      .map((cuId) => ({
        questionId,
        companyUserId: cuId,
        grantedBy: admin.uid,
        inviteStatus: cuRows.find((r) => r.id === cuId)?.isRegistered ? "accepted" as const : "pending" as const,
      }));

    if (toInsert.length > 0) {
      await db.insert(questionAccess).values(toInsert);
    }

    log("info", "Question access granted", session.user.id, true, {
      questionId,
      granted: toInsert.length,
    });

    return NextResponse.json({
      success: true,
      granted: toInsert.length,
      skipped: companyUserIds.length - toInsert.length,
    });
  } catch (error) {
    log("error", "Failed to grant question access", session.user.id, true, {
      error: error instanceof Error ? error.message : "Unknown",
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — revoke access (pass companyUserId in body)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const admin = await getAdminOrgAndUid(session.user.email);
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  const questionId = parseInt(id, 10);

  try {
    const { companyUserId } = await req.json();
    if (!companyUserId) {
      return NextResponse.json({ error: "companyUserId required" }, { status: 400 });
    }

    await db
      .delete(questionAccess)
      .where(
        and(
          eq(questionAccess.questionId, questionId),
          eq(questionAccess.companyUserId, companyUserId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    log("error", "Failed to revoke question access", session.user.id, true, {
      error: error instanceof Error ? error.message : "Unknown",
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
