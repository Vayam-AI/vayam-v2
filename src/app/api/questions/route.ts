import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-options";
import { db } from "@/db/drizzle";
import { questions, users } from "@/db/schema";
import { eq } from "drizzle-orm";
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
    if (!isAdminUser(session.user.email)) {
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
    } = validationResult.data;

    // Validation for private questions
    if (allowedEmails.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation Error",
          message: "Questions require at least one allowed email",
        },
        { status: 400 }
      );
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

    // Get all questions (active for regular users, all for admins)
    let allQuestions;
    try {
      // If admin, get all questions; otherwise only active ones
      const whereCondition = isAdminUser(session.user?.email)
        ? undefined
        : eq(questions.isActive, true);

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
      // If table doesn't exist or other DB error, return empty array
      return NextResponse.json({
        success: true,
        data: [],
        message: "No questions available yet",
      });
    }

    // Handle case when no questions exist
    if (!allQuestions || allQuestions.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: "No questions available",
      });
    }

    // Filter questions based on user access
    const accessibleQuestions = allQuestions.filter(question => {
      const isAdmin = isAdminUser(session.user?.email);

      // Admins can see all questions (active and inactive)
      if (isAdmin) return true;

      // Regular users can see all active questions (not just allowed emails)
      return question.isActive;
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