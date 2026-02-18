import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-options";
import { db } from "@/db/drizzle";
import { questionEmailTemplates, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAdminUser } from "@/lib/admin";
import { log } from "@/lib/logger";

async function getAdminUid(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) return null;
  if (isAdminUser(user.role)) return user.uid;
  return null;
}

// GET — get custom email template for a question
export async function GET(
  _req: NextRequest,
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
    const [template] = await db
      .select()
      .from(questionEmailTemplates)
      .where(eq(questionEmailTemplates.questionId, questionId))
      .limit(1);

    return NextResponse.json({
      success: true,
      data: template || null,
      defaults: {
        subject: "You're invited to join a conversation on Vayam",
        body: "Hi {{name}},\n\nYou have been invited to participate in \"{{questionTitle}}\" on Vayam.\n\nClick here to join: {{inviteLink}}\n\nYour perspective matters!",
      },
      variables: ["{{name}}", "{{questionTitle}}", "{{inviteLink}}", "{{platformUrl}}"],
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT — create or update custom email template
export async function PUT(
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
    const { subject, body } = await req.json();

    if (!subject && !body) {
      return NextResponse.json({ error: "Provide subject or body" }, { status: 400 });
    }

    // Upsert
    const [existing] = await db
      .select()
      .from(questionEmailTemplates)
      .where(eq(questionEmailTemplates.questionId, questionId))
      .limit(1);

    if (existing) {
      await db
        .update(questionEmailTemplates)
        .set({
          subject: subject ?? existing.subject,
          body: body ?? existing.body,
          updatedAt: new Date(),
        })
        .where(eq(questionEmailTemplates.id, existing.id));
    } else {
      await db.insert(questionEmailTemplates).values({
        questionId,
        subject,
        body,
        createdBy: uid,
      });
    }

    log("info", "Email template updated", session.user.id, true, { questionId });

    return NextResponse.json({ success: true });
  } catch (error) {
    log("error", "Failed to update email template", session.user.id, true, {
      error: error instanceof Error ? error.message : "Unknown",
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
