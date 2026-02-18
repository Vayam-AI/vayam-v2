import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-options";
import { db } from "@/db/drizzle";
import { questionAccess, companyUsers, questions, users, organizations } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { isAdminUser } from "@/lib/admin";
import { log } from "@/lib/logger";

async function getAdminOrgAndUid(email: string): Promise<{ orgId: number; uid: number } | null> {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) return null;
  if (!isAdminUser(user.role)) return null;
  let orgId = user.organizationId;
  if (!orgId) {
    const [org] = await db.select().from(organizations).where(eq(organizations.adminUserId, user.uid)).limit(1);
    orgId = org?.id ?? null;
  }
  if (!orgId) return null;
  return { orgId, uid: user.uid };
}

// GET — list all questions a specific company user has access to
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const adminInfo = await getAdminOrgAndUid(session.user.email);
  if (!adminInfo) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const { orgId } = adminInfo;

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

    // Get all questions this user has access to
    const accessList = await db
      .select({
        accessId: questionAccess.id,
        questionId: questionAccess.questionId,
        inviteStatus: questionAccess.inviteStatus,
        invitedAt: questionAccess.invitedAt,
        createdAt: questionAccess.createdAt,
        questionTitle: questions.title,
        questionIsActive: questions.isActive,
      })
      .from(questionAccess)
      .innerJoin(questions, eq(questionAccess.questionId, questions.id))
      .where(eq(questionAccess.companyUserId, companyUserId));

    return NextResponse.json({
      success: true,
      data: {
        user: cu,
        access: accessList,
      },
    });
  } catch (error) {
    console.error("Failed to fetch user access:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — grant access to a question for this company user
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const adminInfo = await getAdminOrgAndUid(session.user.email);
  if (!adminInfo) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const { orgId, uid: adminUid } = adminInfo;

  const { id } = await params;
  const companyUserId = parseInt(id, 10);
  if (isNaN(companyUserId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { questionId } = body;

    if (!questionId) {
      return NextResponse.json({ error: "questionId is required" }, { status: 400 });
    }

    // Verify company user belongs to admin's org
    const [cu] = await db
      .select()
      .from(companyUsers)
      .where(and(eq(companyUsers.id, companyUserId), eq(companyUsers.organizationId, orgId)))
      .limit(1);

    if (!cu) {
      return NextResponse.json({ error: "Company user not found" }, { status: 404 });
    }

    // Verify question belongs to admin's org OR admin owns it
    const [q] = await db
      .select()
      .from(questions)
      .where(
        and(
          eq(questions.id, questionId),
          or(eq(questions.organizationId, orgId), eq(questions.owner, adminUid))
        )
      )
      .limit(1);

    if (!q) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // Check if access already exists
    const [existing] = await db
      .select()
      .from(questionAccess)
      .where(
        and(
          eq(questionAccess.questionId, questionId),
          eq(questionAccess.companyUserId, companyUserId)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: "Access already granted" }, { status: 409 });
    }

    // Grant access
    await db.insert(questionAccess).values({
      questionId,
      companyUserId,
      grantedBy: adminUid,
      inviteStatus: "pending",
    });

    // Also add email to question's allowedEmails if not already there
    const currentAllowed = q.allowedEmails || [];
    if (!currentAllowed.includes(cu.email)) {
      await db
        .update(questions)
        .set({ allowedEmails: [...currentAllowed, cu.email] })
        .where(eq(questions.id, questionId));
    }

    log("info", "Question access granted", session.user.id, true, {
      companyUserId,
      questionId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to grant access:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — revoke access to a question for this company user
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const adminInfo = await getAdminOrgAndUid(session.user.email);
  if (!adminInfo) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const { orgId } = adminInfo;

  const { id } = await params;
  const companyUserId = parseInt(id, 10);
  if (isNaN(companyUserId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const questionId = parseInt(searchParams.get("questionId") || "", 10);

    if (isNaN(questionId)) {
      return NextResponse.json({ error: "questionId is required" }, { status: 400 });
    }

    // Verify company user belongs to admin's org
    const [cu] = await db
      .select()
      .from(companyUsers)
      .where(and(eq(companyUsers.id, companyUserId), eq(companyUsers.organizationId, orgId)))
      .limit(1);

    if (!cu) {
      return NextResponse.json({ error: "Company user not found" }, { status: 404 });
    }

    // Remove access record
    await db
      .delete(questionAccess)
      .where(
        and(
          eq(questionAccess.questionId, questionId),
          eq(questionAccess.companyUserId, companyUserId)
        )
      );

    // Also remove email from question's allowedEmails
    const [q] = await db
      .select()
      .from(questions)
      .where(eq(questions.id, questionId))
      .limit(1);

    if (q) {
      const updatedEmails = (q.allowedEmails || []).filter((e) => e !== cu.email);
      await db
        .update(questions)
        .set({ allowedEmails: updatedEmails })
        .where(eq(questions.id, questionId));
    }

    log("info", "Question access revoked", session.user.id, true, {
      companyUserId,
      questionId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to revoke access:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
