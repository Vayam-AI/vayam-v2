import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-options";
import { db } from "@/db/drizzle";
import { votes, users, solutions, pros, cons, participants, questions } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { z } from "zod";
import { log } from "@/lib/logger";

const voteSchema = z.object({
  type: z.enum(["solution", "pro", "con"]),
  id: z.number().positive(),
  vote: z.number().refine((val) => val === 1 || val === -1, {
    message: "Vote must be 1 (like) or -1 (dislike)"
  }).transform(val => val as 1 | -1),
});

const sanitizeId = (id: unknown): number | null => {
  if (typeof id === 'number' && id > 0) return id;
  return null;
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      log('warn', 'Unauthorized vote attempt', undefined, false);
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = voteSchema.parse(body);

    // Get current user
    const currentUser = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (currentUser.length === 0) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const userId = currentUser[0].uid;
    let questionId: number;
    let solutionId: number | null = null;
    let prosId: number | null = null;
    let consId: number | null = null;

    // Determine what we're voting on and get the questionId
    if (validatedData.type === "solution") {
      const solution = await db
        .select()
        .from(solutions)
        .where(eq(solutions.id, validatedData.id))
        .limit(1);

      if (solution.length === 0) {
        return NextResponse.json(
          { success: false, message: "Solution not found" },
          { status: 404 }
        );
      }

      if (!solution[0].isActive) {
        return NextResponse.json(
          { success: false, message: "Solution is not active" },
          { status: 403 }
        );
      }

      questionId = solution[0].questionId;
      solutionId = validatedData.id;
    } else if (validatedData.type === "pro") {
      const pro = await db
        .select({
          id: pros.id,
          solutionId: pros.solutionId,
          questionId: solutions.questionId,
        })
        .from(pros)
        .leftJoin(solutions, eq(pros.solutionId, solutions.id))
        .where(eq(pros.id, validatedData.id))
        .limit(1);

      if (pro.length === 0) {
        return NextResponse.json(
          { success: false, message: "Pro not found" },
          { status: 404 }
        );
      }

      questionId = pro[0].questionId!;
      prosId = validatedData.id;
      solutionId = pro[0].solutionId;
    } else { // con
      const con = await db
        .select({
          id: cons.id,
          solutionId: cons.solutionId,
          questionId: solutions.questionId,
        })
        .from(cons)
        .leftJoin(solutions, eq(cons.solutionId, solutions.id))
        .where(eq(cons.id, validatedData.id))
        .limit(1);

      if (con.length === 0) {
        return NextResponse.json(
          { success: false, message: "Con not found" },
          { status: 404 }
        );
      }

      questionId = con[0].questionId!;
      consId = validatedData.id;
      solutionId = con[0].solutionId;
    }

    // Check if user already voted on this specific item
    let whereCondition;
    if (validatedData.type === "solution") {
      // For solution votes, check by solutionId only
      whereCondition = and(
        eq(votes.userId, userId),
        eq(votes.solutionId, solutionId!),
        isNull(votes.prosId),
        isNull(votes.consId)
      );
    } else if (prosId) {
      // For pro votes, check by specific prosId
      whereCondition = and(
        eq(votes.userId, userId),
        eq(votes.prosId, prosId)
      );
    } else {
      // For con votes, check by specific consId
      whereCondition = and(
        eq(votes.userId, userId),
        eq(votes.consId, consId!)
      );
    }

    const existingVote = await db
      .select()
      .from(votes)
      .where(whereCondition)
      .limit(1);

    if (existingVote.length > 0) {
      // Update existing vote - only update the vote value and timestamp
      await db
        .update(votes)
        .set({
          vote: validatedData.vote,
          updatedAt: new Date(),
        })
        .where(whereCondition);
    } else {
      // Create new vote with proper references
      const voteData = {
        questionId,
        userId,
        vote: validatedData.vote,
        solutionId: sanitizeId(solutionId) || null,
        prosId: sanitizeId(prosId) || null,
        consId: sanitizeId(consId) || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.insert(votes).values(voteData);

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

      // Update participant count
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
    }

    // Get updated vote count for the specific item that was voted on
    let voteCount = 0;
    if (validatedData.type === "solution") {
      // Count votes for this specific solution (not pros/cons of the solution)
      const solutionVotes = await db
        .select()
        .from(votes)
        .where(and(
          eq(votes.solutionId, solutionId!),
          isNull(votes.prosId),
          isNull(votes.consId)
        ));
      voteCount = solutionVotes.reduce((sum, vote) => sum + vote.vote, 0);
    } else if (prosId) {
      // Count votes for this specific pro
      const proVotes = await db
        .select()
        .from(votes)
        .where(eq(votes.prosId, prosId));
      voteCount = proVotes.reduce((sum, vote) => sum + vote.vote, 0);
    } else if (consId) {
      // Count votes for this specific con
      const conVotes = await db
        .select()
        .from(votes)
        .where(eq(votes.consId, consId));
      voteCount = conVotes.reduce((sum, vote) => sum + vote.vote, 0);
    }

    log('info', 'Vote recorded successfully', userId.toString(), true, {
      type: validatedData.type,
      itemId: validatedData.id,
      vote: validatedData.vote
    });

    return NextResponse.json({
      success: true,
      message: "Vote recorded successfully",
      data: {
        voteCount,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      log('warn', 'Vote validation error', undefined, false);
      return NextResponse.json(
        {
          success: false,
          message: error.issues[0]?.message || "Invalid input data",
        },
        { status: 400 }
      );
    }
    log('error', 'Vote processing error', undefined, false, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}