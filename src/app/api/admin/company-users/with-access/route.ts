import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-options";
import { db } from "@/db/drizzle";
import { companyUsers, users, organizations, questionAccess, questions } from "@/db/schema";
import { eq, and, sql, ilike, or } from "drizzle-orm";
import { isAdminUser } from "@/lib/admin";
import { log } from "@/lib/logger";

async function getAdminOrg(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!user) return null;
  if (!isAdminUser(user.role)) return null;
  if (user.organizationId) return { orgId: user.organizationId, uid: user.uid };
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.adminUserId, user.uid))
    .limit(1);
  return org ? { orgId: org.id, uid: user.uid } : null;
}

// GET — list company users with their question access counts + org questions list
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const admin = await getAdminOrg(session.user.email);
  if (!admin) {
    return NextResponse.json(
      { error: "No organization found. Create one first." },
      { status: 404 }
    );
  }

  const { orgId, uid } = admin;

  try {
    const search = req.nextUrl.searchParams.get("search") || "";

    // Get company users
    let userRows;
    if (search) {
      userRows = await db
        .select()
        .from(companyUsers)
        .where(
          and(
            eq(companyUsers.organizationId, orgId),
            or(
              ilike(companyUsers.name, `%${search}%`),
              ilike(companyUsers.email, `%${search}%`),
              ilike(companyUsers.department, `%${search}%`)
            )
          )
        );
    } else {
      userRows = await db
        .select()
        .from(companyUsers)
        .where(eq(companyUsers.organizationId, orgId));
    }

    // Get question access counts per company user
    const accessCounts = await db
      .select({
        companyUserId: questionAccess.companyUserId,
        totalAccess: sql<number>`COUNT(*)`.as("totalAccess"),
        pendingCount: sql<number>`SUM(CASE WHEN ${questionAccess.inviteStatus} = 'pending' THEN 1 ELSE 0 END)`.as("pendingCount"),
        sentCount: sql<number>`SUM(CASE WHEN ${questionAccess.inviteStatus} = 'sent' THEN 1 ELSE 0 END)`.as("sentCount"),
        acceptedCount: sql<number>`SUM(CASE WHEN ${questionAccess.inviteStatus} = 'accepted' THEN 1 ELSE 0 END)`.as("acceptedCount"),
      })
      .from(questionAccess)
      .innerJoin(companyUsers, eq(questionAccess.companyUserId, companyUsers.id))
      .where(eq(companyUsers.organizationId, orgId))
      .groupBy(questionAccess.companyUserId);

    const accessMap = new Map(
      accessCounts.map((r) => [
        r.companyUserId,
        {
          totalAccess: r.totalAccess,
          pendingCount: r.pendingCount,
          sentCount: r.sentCount,
          acceptedCount: r.acceptedCount,
        },
      ])
    );

    // Enrich users with access stats
    const enrichedUsers = userRows.map((u) => ({
      ...u,
      accessStats: accessMap.get(u.id) || {
        totalAccess: 0,
        pendingCount: 0,
        sentCount: 0,
        acceptedCount: 0,
      },
    }));

    // Get all org questions (for filter dropdown)
    const orgQuestions = await db
      .select({
        id: questions.id,
        title: questions.title,
        isActive: questions.isActive,
      })
      .from(questions)
      .where(
        or(
          eq(questions.owner, uid),
          eq(questions.organizationId, orgId)
        )
      )
      .orderBy(sql`${questions.createdAt} DESC`);

    // Get unique departments for filter
    const departments = [
      ...new Set(
        userRows
          .map((u) => u.department)
          .filter(Boolean) as string[]
      ),
    ].sort();

    return NextResponse.json({
      success: true,
      data: enrichedUsers,
      questions: orgQuestions,
      departments,
    });
  } catch (error) {
    log("error", "Failed to fetch company users with access", session.user.id, true, {
      error: error instanceof Error ? error.message : "Unknown",
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
