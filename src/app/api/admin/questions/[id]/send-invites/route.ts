import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-options";
import { db } from "@/db/drizzle";
import { questionAccess, companyUsers, questions, questionEmailTemplates, users, organizations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { isAdminUser } from "@/lib/admin";
import { log } from "@/lib/logger";
import { getEmailQueue, InviteEmailJobData, createBatch } from "@/lib/queue";

async function getAdminUid(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) return null;
  if (isAdminUser(user.role)) return user.uid;
  return null;
}

// POST — send invite emails via BullMQ to all non-registered users with access
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const uid = await getAdminUid(session.user.email);
  if (!uid) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  const questionId = parseInt(id, 10);
  if (isNaN(questionId)) {
    return NextResponse.json({ error: "Invalid question ID" }, { status: 400 });
  }

  try {
    // Get question
    const [q] = await db.select().from(questions).where(eq(questions.id, questionId)).limit(1);
    if (!q) return NextResponse.json({ error: "Question not found" }, { status: 404 });

    // Verify this admin owns the question or it belongs to their org
    const [adminUser] = await db.select().from(users).where(eq(users.email, session.user.email!)).limit(1);
    let adminOrgId: number | null = adminUser?.organizationId ?? null;
    if (!adminOrgId && adminUser) {
      const [org] = await db.select().from(organizations).where(eq(organizations.adminUserId, adminUser.uid)).limit(1);
      adminOrgId = org?.id ?? null;
    }
    if (q.owner !== uid && q.organizationId !== adminOrgId) {
      return NextResponse.json({ error: "You don't have permission to send invites for this question" }, { status: 403 });
    }

    // Get custom template if any
    const [template] = await db
      .select()
      .from(questionEmailTemplates)
      .where(eq(questionEmailTemplates.questionId, questionId))
      .limit(1);

    // Get non-registered users who have access and haven't been invited yet (or are pending)
    const accessList = await db
      .select({
        accessId: questionAccess.id,
        companyUserId: questionAccess.companyUserId,
        inviteStatus: questionAccess.inviteStatus,
        name: companyUsers.name,
        email: companyUsers.email,
        isRegistered: companyUsers.isRegistered,
      })
      .from(questionAccess)
      .innerJoin(companyUsers, eq(questionAccess.companyUserId, companyUsers.id))
      .where(
        and(
          eq(questionAccess.questionId, questionId),
          eq(companyUsers.isRegistered, false)
        )
      );

    if (accessList.length === 0) {
      return NextResponse.json({
        success: true,
        queued: 0,
        message: "All users with access are already registered",
      });
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const queue = getEmailQueue();
    let queued = 0;

    // Create a batch for tracking progress
    const batchId = await createBatch(accessList.length, questionId);

    for (const item of accessList) {
      const inviteLink = `${baseUrl}/signup?ref=invite&email=${encodeURIComponent(item.email)}`;

      const jobData: InviteEmailJobData = {
        to: item.email,
        recipientName: item.name,
        questionTitle: q.title,
        questionId: q.id,
        inviteLink,
        customSubject: template?.subject || undefined,
        customBody: template?.body || undefined,
        batchId,
      };

      await queue.add("send-invite", jobData, {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      });

      // Mark as sent
      await db
        .update(questionAccess)
        .set({ inviteStatus: "sent", invitedAt: new Date() })
        .where(eq(questionAccess.id, item.accessId));

      queued++;
    }

    log("info", "Invite emails queued", session.user.id, true, {
      questionId,
      queued,
      batchId,
    });

    return NextResponse.json({ success: true, queued, batchId });
  } catch (error) {
    log("error", "Failed to send invites", session.user.id, true, {
      error: error instanceof Error ? error.message : "Unknown",
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
