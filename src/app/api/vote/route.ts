import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-options";
import { db } from "@/db/drizzle";
import { votes, users, solutions, pros, cons, participants, questions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const voteSchema = z.object({
  type: z.enum(["solution", "pro", "con"]),
  id: z.number().positive(),
  vote: z.number().refine((val) => val === 1 || val === -1, {
    message: "Vote must be 1 (like) or -1 (dislike)"
  }).transform(val => val as 1 | -1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
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
    }

    // Check if user already voted on this item
    let whereCondition;
    if (solutionId) {
      whereCondition = and(
        eq(votes.userId, userId),
        eq(votes.solutionId, solutionId)
      );
    } else if (prosId) {
      whereCondition = and(
        eq(votes.userId, userId),
        eq(votes.prosId, prosId)
      );
    } else {
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
      // Update existing vote
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
        solutionId: solutionId || null,
        prosId: prosId || null,
        consId: consId || null,
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

    // Get updated vote count for the item
    let voteCount = 0;
    if (solutionId) {
      const solutionVotes = await db
        .select()
        .from(votes)
        .where(eq(votes.solutionId, solutionId));
      voteCount = solutionVotes.reduce((sum, vote) => sum + vote.vote, 0);
    } else if (prosId) {
      const proVotes = await db
        .select()
        .from(votes)
        .where(eq(votes.prosId, prosId));
      voteCount = proVotes.reduce((sum, vote) => sum + vote.vote, 0);
    } else if (consId) {
      const conVotes = await db
        .select()
        .from(votes)
        .where(eq(votes.consId, consId));
      voteCount = conVotes.reduce((sum, vote) => sum + vote.vote, 0);
    }

    return NextResponse.json({
      success: true,
      message: "Vote recorded successfully",
      data: {
        voteCount,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: error.issues[0]?.message || "Invalid input data",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}