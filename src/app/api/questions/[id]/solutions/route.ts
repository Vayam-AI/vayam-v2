import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-options";
import { db } from "@/db/drizzle";
import { questions, solutions, users, participants, questionAccess, companyUsers } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { z } from "zod";
import { EmailNotifications } from "@/utils/email-templates";
import { log } from "@/lib/logger";

const addSolutionSchema = z.object({
  title: z.string().min(1, "Title is required").max(150, "Title too long"),
  content: z.string().min(1, "Content is required").max(500, "Content too long"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.email) {
      log('warn', 'Unauthorized solution creation attempt', undefined, false);
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const sessionUserId = session.user.id;

    const questionId = parseInt(id);
    if (isNaN(questionId)) {
      return NextResponse.json(
        { success: false, message: "Invalid question ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = addSolutionSchema.parse(body);

    // Get current user
    const currentUser = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (currentUser.length === 0) {
      log('error', 'User not found for solution creation', sessionUserId, true);
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const userId = currentUser[0].uid;

    // Get question and check permissions
    const question = await db
      .select()
      .from(questions)
      .where(eq(questions.id, questionId))
      .limit(1);

    if (question.length === 0) {
      return NextResponse.json(
        { success: false, message: "Question not found" },
        { status: 404 }
      );
    }

    const questionData = question[0];

    // Check if question is active
    if (!questionData.isActive) {
      return NextResponse.json(
        { success: false, message: "Question is not active" },
        { status: 403 }
      );
    }

    // Check if user is allowed to add solutions
    // Access = in allowedEmails OR has explicit questionAccess entry OR is the owner
    const userEmailLower = session.user.email!.toLowerCase();
    const inAllowedEmails = questionData.allowedEmails?.map((e: string) => e.toLowerCase()).includes(userEmailLower);
    const isOwner = questionData.owner === userId;

    let hasQuestionAccess = false;
    if (!inAllowedEmails && !isOwner) {
      try {
        const cuRows = await db
          .select({ id: companyUsers.id })
          .from(companyUsers)
          .where(eq(companyUsers.email, userEmailLower));
        if (cuRows.length > 0) {
          const cuIds = cuRows.map((r) => r.id);
          const accessRows = await db
            .select({ questionId: questionAccess.questionId })
            .from(questionAccess)
            .where(and(
              eq(questionAccess.questionId, questionId),
              inArray(questionAccess.companyUserId, cuIds)
            ));
          hasQuestionAccess = accessRows.length > 0;
        }
      } catch { /* ignore */ }
    }

    if (!inAllowedEmails && !hasQuestionAccess && !isOwner) {
      log('warn', 'Unauthorized solution creation - no access', sessionUserId, true, { 
        questionId 
      });
      return NextResponse.json(
        { success: false, message: "You are not authorized to add solutions to this question" },
        { status: 403 }
      );
    }

    // Add the solution
    const newSolution = await db
      .insert(solutions)
      .values({
        questionId,
        userId,
        title: validatedData.title,
        content: validatedData.content,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Add participation record
    await db
      .insert(participants)
      .values({
        questionId,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoNothing();

    // Update participant count (count unique participants)
    const participantCount = await db
      .selectDistinct({ userId: participants.userId })
      .from(participants)
      .where(eq(participants.questionId, questionId));

    await db
      .update(questions)
      .set({
        participantCount: participantCount.length,
        updatedAt: new Date(),
      })
      .where(eq(questions.id, questionId));

    // Send notification email to question creator (if it's not the same user who added the solution)
    if (questionData.owner !== userId) {
      try {
        const questionOwner = await db
          .select()
          .from(users)
          .where(eq(users.uid, questionData.owner))
          .limit(1);

        if (questionOwner.length > 0 && questionOwner[0].email) {
          const solutionAuthor = currentUser[0];
          await EmailNotifications.sendNewSolutionNotification(questionOwner[0].email, {
            questionTitle: questionData.title,
            questionUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/questions/${questionId}`,
            solutionAuthor: solutionAuthor.email || 'Anonymous',
            solutionPreview: validatedData.content.substring(0, 150) + (validatedData.content.length > 150 ? '...' : ''),
            unsubscribeUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/unsubscribe?user=${questionOwner[0].uid}`
          });
        }
      } catch {
        log('error', 'Failed to send solution notification email', sessionUserId, true, { questionId });
      }
    }

    log('info', 'Solution added successfully', sessionUserId, true, { 
      questionId, 
      solutionId: newSolution[0].id 
    });

    return NextResponse.json({
      success: true,
      data: newSolution[0],
      message: "Solution added successfully",
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      log('warn', 'Solution validation error', undefined, false);
      return NextResponse.json(
        {
          success: false,
          message: error.issues[0]?.message || "Invalid input data",
        },
        { status: 400 }
      );
    }

    log('error', 'Solution creation error', undefined, false, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}