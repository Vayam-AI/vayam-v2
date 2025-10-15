import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-options";
import { db } from "@/db/drizzle";
import { solutions, pros, users, participants, questions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const addProSchema = z.object({
  content: z.string().min(1, "Content is required").max(1000, "Content too long"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const solutionId = parseInt(id);
    if (isNaN(solutionId)) {
      return NextResponse.json(
        { success: false, message: "Invalid solution ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = addProSchema.parse(body);

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

    // Get solution and check if it exists and is active
    const solution = await db
      .select()
      .from(solutions)
      .where(eq(solutions.id, solutionId))
      .limit(1);

    if (solution.length === 0) {
      return NextResponse.json(
        { success: false, message: "Solution not found" },
        { status: 404 }
      );
    }

    const solutionData = solution[0];

    if (!solutionData.isActive) {
      return NextResponse.json(
        { success: false, message: "Solution is not active" },
        { status: 403 }
      );
    }

    // Add the pro
    const newPro = await db
      .insert(pros)
      .values({
        solutionId,
        userId,
        content: validatedData.content,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Add participation record
    await db
      .insert(participants)
      .values({
        questionId: solutionData.questionId,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoNothing();

    // Update participant count
    const participantCount = await db
      .selectDistinct({ userId: participants.userId })
      .from(participants)
      .where(eq(participants.questionId, solutionData.questionId));

    await db
      .update(questions)
      .set({
        participantCount: participantCount.length,
        updatedAt: new Date(),
      })
      .where(eq(questions.id, solutionData.questionId));

    return NextResponse.json({
      success: true,
      data: newPro[0],
      message: "Pro added successfully",
    });

  } catch (error) {
    console.error("Error adding pro:", error);
    
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