import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-options";
import { db } from "@/db/drizzle";
import { questions, users, questionAccess, companyUsers, organizations } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { isAdminUser } from "@/lib/admin";
import { createQuestionSchema } from "@/validators/vayam";
import { EmailNotifications } from "@/utils/email-templates";
import { log } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  const isAuthenticated = !!session;

  try {
    if (!session || !session.user?.email) {
      log('warn', 'Unauthorized question creation attempt', undefined, false);
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user is admin
    if (!isAdminUser(session.user.role)) {
      log('warn', 'Non-admin tried to create question', userId, isAuthenticated);
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validationResult = createQuestionSchema.safeParse(body);

    if (!validationResult.success) {
      const formattedErrors = validationResult.error.flatten();
      return NextResponse.json(
        {
          success: false,
          error: "Validation Error",
          errors: formattedErrors.fieldErrors,
        },
        { status: 400 }
      );
    }

    // Get user ID from email
    const [userRecord] = await db
      .select({ uid: users.uid })
      .from(users)
      .where(eq(users.email, session.user.email));

    if (!userRecord) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const {
      title,
      description,
      tags = [],
      allowedEmails = [],
      isActive = true,
      isPublic = true,
      organizationId,
    } = validationResult.data;

    // Always include the creator's own email in allowedEmails
    const creatorEmail = session.user.email!.toLowerCase();
    if (!allowedEmails.map(e => e.toLowerCase()).includes(creatorEmail)) {
      allowedEmails.push(creatorEmail);
    }

    // If organizationId is provided, verify user has access
    if (organizationId) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, session.user.email))
        .limit(1);

      if (!user || (user.organizationId !== organizationId && !isAdminUser(user.role))) {
        return NextResponse.json(
          { error: "Unauthorized: You don't have access to this organization" },
          { status: 403 }
        );
      }
    }

    // Create the question
    const [newQuestion] = await db
      .insert(questions)
      .values({
        title,
        description,
        tags,
        allowedEmails,
        owner: userRecord.uid,
        isActive,
        isPublic: isPublic ?? true,
        organizationId: organizationId || null,
        participantCount: 0,
        logos: [],
        infoImages: [],
      })
      .returning();

    // Send email invitations to all allowed emails
   const emailPromises = allowedEmails.map(async (email) => {
  try {
    const namePart = email.split("@")[0];
    const formattedName = namePart
      .replace(/[._-]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    await EmailNotifications.sendSMEInvitation(email, {
      name: formattedName,
      questionTitle: title,
      questionDescription: description,
      questionId: newQuestion.id,
      questionUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/questions/${newQuestion.id}`,
      platformUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      supportUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/support`,
      unsubscribeUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/unsubscribe?email=${encodeURIComponent(email)}`
    });
  } catch (err) {
    // log or silently fail
    log('warn', 'Failed to send SME invitation', userId, isAuthenticated, { email, err });
  }
});


    // Wait for all emails to be processed (but don't fail if they fail)
    await Promise.allSettled(emailPromises);

    // Log successful question creation
    log('info', 'Question created successfully', userId, isAuthenticated, {
      questionId: newQuestion.id,
      title: title,
      allowedEmailsCount: allowedEmails.length
    });

    return NextResponse.json(
      {
        success: true,
        data: newQuestion,
        message: "Question created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    log('error', 'Error creating question', userId, isAuthenticated, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    console.error("Error creating question:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        ...(process.env.NODE_ENV === "development" && {
          stack: error instanceof Error ? error.stack : undefined,
        }),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  const isAuthenticated = !!session;

  try {
    if (!session || !session.user?.email) {
      log('warn', 'Unauthorized attempt to fetch questions', undefined, false);
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get current user to check their access type
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all questions with unified access control
    let allQuestions;
    const isAdmin = isAdminUser(session.user?.role);
    const userEmail = session.user.email!.toLowerCase();

    // Determine user's organization
    let userOrgId: number | null = currentUser.organizationId;
    if (isAdmin && !userOrgId) {
      const [org] = await db
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.adminUserId, currentUser.uid))
        .limit(1);
      userOrgId = org?.id ?? null;
    }

    try {
      // Admins see all questions (including inactive); regular users only active
      const whereCondition = isAdmin ? undefined : eq(questions.isActive, true);

      allQuestions = await db
        .select({
          id: questions.id,
          title: questions.title,
          description: questions.description,
          tags: questions.tags,
          participantCount: questions.participantCount,
          allowedEmails: questions.allowedEmails,
          owner: questions.owner,
          isActive: questions.isActive,
          isPublic: questions.isPublic,
          organizationId: questions.organizationId,
          createdAt: questions.createdAt,
          updatedAt: questions.updatedAt,
          ownerEmail: users.email,
          ownerUsername: users.username,
        })
        .from(questions)
        .leftJoin(users, eq(questions.owner, users.uid))
        .where(whereCondition);
    } catch (dbError) {
      console.error("Database query error:", dbError);
      return NextResponse.json({
        success: true,
        data: [],
        message: "No questions available yet",
      });
    }

    if (!allQuestions || allQuestions.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: "No questions available",
      });
    }

    // Get question IDs this user has explicit access to via question_access
    let accessQuestionIds: number[] = [];
    try {
      const cuRows = await db
        .select({ id: companyUsers.id })
        .from(companyUsers)
        .where(eq(companyUsers.email, userEmail));

      if (cuRows.length > 0) {
        const cuIds = cuRows.map((r) => r.id);
        const accessRows = await db
          .select({ questionId: questionAccess.questionId })
          .from(questionAccess)
          .where(inArray(questionAccess.companyUserId, cuIds));
        accessQuestionIds = accessRows.map((r) => r.questionId);
      }
    } catch { /* ignore */ }

    // Unified access filter — same rules for admin and regular users
    const accessibleQuestions = allQuestions.filter(question => {
      // Owner always sees their own questions
      if (question.owner === currentUser.uid) return true;

      // Same organization
      if (userOrgId && question.organizationId === userOrgId) return true;

      // Explicit access via questionAccess table
      if (accessQuestionIds.includes(question.id)) return true;

      // Email in the allowedEmails list
      if (question.allowedEmails && question.allowedEmails.map(e => e.toLowerCase()).includes(userEmail)) return true;

      return false;
    });

    // Log successful fetch
    log('info', 'Questions fetched successfully', userId, isAuthenticated, {
      questionCount: accessibleQuestions.length
    });

    return NextResponse.json({
      success: true,
      data: accessibleQuestions,
    });
  } catch (error) {
    log('error', 'Error fetching questions', userId, isAuthenticated, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    console.error("Error fetching questions:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to fetch questions",
      },
      { status: 500 }
    );
  }
}