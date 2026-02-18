import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-options";
import { db } from "@/db/drizzle";
import { companyUsers, questions, questionAccess, users, organizations } from "@/db/schema";
import { eq, and, count, sql } from "drizzle-orm";
import { isAdminUser } from "@/lib/admin";

async function getAdminOrg(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) return null;
  if (!isAdminUser(user.role)) return null;
  if (user.organizationId) return user.organizationId;
  const [org] = await db.select().from(organizations).where(eq(organizations.adminUserId, user.uid)).limit(1);
  return org?.id ?? null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const orgId = await getAdminOrg(session.user.email);
  if (!orgId) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    // Total company users
    const [totalUsersRow] = await db
      .select({ count: count() })
      .from(companyUsers)
      .where(eq(companyUsers.organizationId, orgId));

    // Registered vs unregistered
    const [registeredRow] = await db
      .select({ count: count() })
      .from(companyUsers)
      .where(and(eq(companyUsers.organizationId, orgId), eq(companyUsers.isRegistered, true)));

    // Total questions scoped to admin's org
    const [user] = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1);
    const [questionsRow] = await db
      .select({ count: count() })
      .from(questions)
      .where(
        and(
          eq(questions.owner, user!.uid),
          eq(questions.organizationId, orgId)
        )
      );

    // Active questions scoped to admin's org
    const [activeQuestionsRow] = await db
      .select({ count: count() })
      .from(questions)
      .where(and(eq(questions.owner, user!.uid), eq(questions.organizationId, orgId), eq(questions.isActive, true)));

    // Total access grants
    const accessRows = await db
      .select({
        status: questionAccess.inviteStatus,
        count: count(),
      })
      .from(questionAccess)
      .innerJoin(questions, eq(questionAccess.questionId, questions.id))
      .where(eq(questions.owner, user!.uid))
      .groupBy(questionAccess.inviteStatus);

    const inviteStats = {
      pending: 0,
      sent: 0,
      accepted: 0,
    };

    for (const row of accessRows) {
      if (row.status === "pending") inviteStats.pending = row.count;
      else if (row.status === "sent") inviteStats.sent = row.count;
      else if (row.status === "accepted") inviteStats.accepted = row.count;
    }

    // Total participants across questions
    const [participantsRow] = await db
      .select({ total: sql<number>`COALESCE(SUM(${questions.participantCount}), 0)` })
      .from(questions)
      .where(eq(questions.owner, user!.uid));

    // Organization info
    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);

    // Recent users (last 5)
    const recentUsers = await db
      .select()
      .from(companyUsers)
      .where(eq(companyUsers.organizationId, orgId))
      .orderBy(sql`${companyUsers.createdAt} DESC`)
      .limit(5);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: totalUsersRow.count,
        registeredUsers: registeredRow.count,
        unregisteredUsers: totalUsersRow.count - registeredRow.count,
        totalQuestions: questionsRow.count,
        activeQuestions: activeQuestionsRow.count,
        inactiveQuestions: questionsRow.count - activeQuestionsRow.count,
        inviteStats,
        totalParticipants: participantsRow.total,
        organization: org ? { name: org.name, domain: org.domain, isActive: org.isActive } : null,
        recentUsers,
      },
    });
  } catch (error) {
    console.error("Failed to fetch admin stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
