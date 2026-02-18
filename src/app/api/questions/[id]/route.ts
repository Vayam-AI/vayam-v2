import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-options"
import { db } from "@/db/drizzle"
import { questions, users, solutions, pros, cons, votes, participants, questionAccess, companyUsers, organizations } from "@/db/schema"
import { eq, and, sql, inArray } from "drizzle-orm"
import { isAdminUser } from "@/lib/admin"
import { z } from "zod"

// Helper: resolve admin's org ID and uid
async function getAdminOrgAndUid(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) return null;
  if (!isAdminUser(user.role)) return null;
  let orgId: number | null = user.organizationId ?? null;
  if (!orgId) {
    const [org] = await db.select().from(organizations).where(eq(organizations.adminUserId, user.uid)).limit(1);
    orgId = org?.id ?? null;
  }
  return { orgId, uid: user.uid };
}

// Validation schema for question updates
const updateQuestionSchema = z.object({
  title: z.string().min(1, "Title is required").max(500, "Title too long"),
  description: z.string().min(1, "Description is required").max(2000, "Description too long"),
  tags: z.array(z.string()).optional().default([]),
  allowedEmails: z.array(z.string().email()).optional().default([]),
  isActive: z.boolean().default(true),
})

// GET single question with solutions, pros, cons, and votes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const questionId = parseInt(id)
    if (isNaN(questionId)) {
      return NextResponse.json({ error: "Invalid question ID" }, { status: 400 })
    }

    // Get current user
    const currentUser = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (currentUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userId = currentUser[0].uid;

    // Get the question with owner details
    const questionResult = await db
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
      .where(eq(questions.id, questionId))
      .limit(1)

    if (questionResult.length === 0) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    const question = questionResult[0]

    // Check access permissions
    const isAdmin = isAdminUser(session.user.role)

    if (!question.isActive && !isAdmin) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    // Check if user is allowed to view this question
    if (!isAdmin && question.owner !== userId) {
      const userEmailLower = session.user.email!.toLowerCase();
      const inAllowedEmails = question.allowedEmails?.map((e: string) => e.toLowerCase()).includes(userEmailLower);

      // Check explicit questionAccess
      let hasQuestionAccess = false;
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

      if (!inAllowedEmails && !hasQuestionAccess) {
        return NextResponse.json({ error: "You don't have access to this question" }, { status: 403 })
      }
    }

    // Get solutions with their authors
    const solutionsResult = await db
      .select({
        id: solutions.id,
        questionId: solutions.questionId,
        userId: solutions.userId,
        title: solutions.title,
        content: solutions.content,
        isActive: solutions.isActive,
        createdAt: solutions.createdAt,
        updatedAt: solutions.updatedAt,
        userEmail: users.email,
        username: users.username,
      })
      .from(solutions)
      .leftJoin(users, eq(solutions.userId, users.uid))
      .where(and(eq(solutions.questionId, questionId), eq(solutions.isActive, true)))
      .orderBy(solutions.createdAt);

    // Get all pros for these solutions
    const prosResult = solutionsResult.length > 0 ? await db
      .select({
        id: pros.id,
        solutionId: pros.solutionId,
        userId: pros.userId,
        content: pros.content,
        createdAt: pros.createdAt,
        updatedAt: pros.updatedAt,
        userEmail: users.email,
        username: users.username,
      })
      .from(pros)
      .leftJoin(users, eq(pros.userId, users.uid))
      .where(
        sql`${pros.solutionId} IN (${sql.join(
          solutionsResult.map(s => sql`${s.id}`),
          sql`, `
        )})`
      )
      .orderBy(pros.createdAt) : [];

    // Get all cons for these solutions
    const consResult = solutionsResult.length > 0 ? await db
      .select({
        id: cons.id,
        solutionId: cons.solutionId,
        userId: cons.userId,
        content: cons.content,
        createdAt: cons.createdAt,
        updatedAt: cons.updatedAt,
        userEmail: users.email,
        username: users.username,
      })
      .from(cons)
      .leftJoin(users, eq(cons.userId, users.uid))
      .where(
        sql`${cons.solutionId} IN (${sql.join(
          solutionsResult.map(s => sql`${s.id}`),
          sql`, `
        )})`
      )
      .orderBy(cons.createdAt) : [];

    // Get vote counts and user votes for solutions (direct solution votes only, not pros/cons)
    const solutionVotes = solutionsResult.length > 0 ? await db
      .select({
        solutionId: votes.solutionId,
        voteCount: sql<number>`SUM(${votes.vote})`.as('voteCount'),
        userVote: sql<number>`MAX(CASE WHEN ${votes.userId} = ${userId} THEN ${votes.vote} ELSE NULL END)`.as('userVote'),
      })
      .from(votes)
      .where(
        and(
          sql`${votes.solutionId} IN (${sql.join(
            solutionsResult.map(s => sql`${s.id}`),
            sql`, `
          )})`,
          sql`${votes.solutionId} IS NOT NULL`,
          sql`${votes.prosId} IS NULL`,
          sql`${votes.consId} IS NULL`
        )
      )
      .groupBy(votes.solutionId) : [];

    // Get vote counts and user votes for pros
    const proVotes = prosResult.length > 0 ? await db
      .select({
        prosId: votes.prosId,
        upVotes: sql<number>`SUM(CASE WHEN ${votes.vote} = 1 THEN 1 ELSE 0 END)`.as('upVotes'),
        downVotes: sql<number>`SUM(CASE WHEN ${votes.vote} = -1 THEN 1 ELSE 0 END)`.as('downVotes'),
        voteCount: sql<number>`SUM(${votes.vote})`.as('voteCount'),
        userVote: sql<number>`MAX(CASE WHEN ${votes.userId} = ${userId} THEN ${votes.vote} ELSE NULL END)`.as('userVote'),
      })
      .from(votes)
      .where(
        and(
          sql`${votes.prosId} IN (${sql.join(
            prosResult.map(p => sql`${p.id}`),
            sql`, `
          )})`,
          sql`${votes.prosId} IS NOT NULL`
        )
      )
      .groupBy(votes.prosId) : [];

    // Get vote counts and user votes for cons
    const conVotes = consResult.length > 0 ? await db
      .select({
        consId: votes.consId,
        upVotes: sql<number>`SUM(CASE WHEN ${votes.vote} = 1 THEN 1 ELSE 0 END)`.as('upVotes'),
        downVotes: sql<number>`SUM(CASE WHEN ${votes.vote} = -1 THEN 1 ELSE 0 END)`.as('downVotes'),
        voteCount: sql<number>`SUM(${votes.vote})`.as('voteCount'),
        userVote: sql<number>`MAX(CASE WHEN ${votes.userId} = ${userId} THEN ${votes.vote} ELSE NULL END)`.as('userVote'),
      })
      .from(votes)
      .where(
        and(
          sql`${votes.consId} IN (${sql.join(
            consResult.map(c => sql`${c.id}`),
            sql`, `
          )})`,
          sql`${votes.consId} IS NOT NULL`
        )
      )
      .groupBy(votes.consId) : [];

    // Organize the data
    const solutionsWithData = solutionsResult.map(solution => {
      const solutionPros = prosResult
        .filter(pro => pro.solutionId === solution.id)
        .map(pro => {
          const proVote = proVotes.find(v => v.prosId === pro.id);
          return {
            ...pro,
            user: {
              uid: pro.userId,
              email: pro.userEmail,
              username: pro.username,
            },
            upvotes: proVote?.upVotes || 0,
            downvotes: proVote?.downVotes || 0,
            voteCount: proVote?.voteCount || 0,
            userVote: proVote?.userVote || null,
          };
        });

      const solutionCons = consResult
        .filter(con => con.solutionId === solution.id)
        .map(con => {
          const conVote = conVotes.find(v => v.consId === con.id);
          return {
            ...con,
            user: {
              uid: con.userId,
              email: con.userEmail,
              username: con.username,
            },
            upvotes: conVote?.upVotes || 0,
            downvotes: conVote?.downVotes || 0,
            voteCount: conVote?.voteCount || 0,
            userVote: conVote?.userVote || null,
          };
        });

      const solutionVote = solutionVotes.find(v => v.solutionId === solution.id);

      return {
        ...solution,
        user: {
          uid: solution.userId,
          email: solution.userEmail,
          username: solution.username,
        },
        pros: solutionPros,
        cons: solutionCons,
        voteCount: solutionVote?.voteCount || 0,
        userVote: solutionVote?.userVote || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        question: {
          ...question,
          hasAccess: true, // user passed access check, so they have access
        },
        solutions: solutionsWithData,
      },
    })
  } catch (error) {
    // Question fetch error logged in development only
    if (process.env.NODE_ENV === 'development') {
      console.error("Error fetching question:", error)
    }
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to fetch question",
      },
      { status: 500 }
    )
  }
}

// PUT update question
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check if user is admin
    if (!isAdminUser(session.user.role)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const questionId = parseInt(id)
    if (isNaN(questionId)) {
      return NextResponse.json({ error: "Invalid question ID" }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = updateQuestionSchema.parse(body)

    // Check if question exists and verify ownership
    const existingQuestion = await db
      .select()
      .from(questions)
      .where(eq(questions.id, questionId))
      .limit(1)

    if (existingQuestion.length === 0) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    // Verify the admin owns this question or it belongs to their org
    const admin = await getAdminOrgAndUid(session.user.email!);
    if (admin) {
      const q = existingQuestion[0];
      const ownsQuestion = q.owner === admin.uid;
      const sameOrg = admin.orgId && q.organizationId === admin.orgId;
      if (!ownsQuestion && !sameOrg) {
        return NextResponse.json({ error: "You don't have permission to edit this question" }, { status: 403 });
      }
    }

    // Update the question
    const updatedQuestion = await db
      .update(questions)
      .set({
        title: validatedData.title,
        description: validatedData.description,
        tags: validatedData.tags,
        allowedEmails: validatedData.allowedEmails,
        isActive: validatedData.isActive,
        updatedAt: new Date(),
      })
      .where(eq(questions.id, questionId))
      .returning()

    return NextResponse.json({
      success: true,
      data: updatedQuestion[0],
      message: "Question updated successfully",
    })
  } catch (error) {
    console.error("Error updating question:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation Error",
          message: error.issues[0]?.message || "Invalid input data",
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to update question",
      },
      { status: 500 }
    )
  }
}

// DELETE question
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check if user is admin
    if (!isAdminUser(session.user.role)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const questionId = parseInt(id)
    if (isNaN(questionId)) {
      return NextResponse.json({ error: "Invalid question ID" }, { status: 400 })
    }

    // Check if question exists and verify ownership
    const existingQuestion = await db
      .select()
      .from(questions)
      .where(eq(questions.id, questionId))
      .limit(1)

    if (existingQuestion.length === 0) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    // Verify the admin owns this question or it belongs to their org
    const admin = await getAdminOrgAndUid(session.user.email!);
    if (admin) {
      const q = existingQuestion[0];
      const ownsQuestion = q.owner === admin.uid;
      const sameOrg = admin.orgId && q.organizationId === admin.orgId;
      if (!ownsQuestion && !sameOrg) {
        return NextResponse.json({ error: "You don't have permission to delete this question" }, { status: 403 });
      }
    }

    // Get all solutions for this question to cascade delete properly
    const questionSolutions = await db
      .select({ id: solutions.id })
      .from(solutions)
      .where(eq(solutions.questionId, questionId));

    const solutionIds = questionSolutions.map(s => s.id);

    // Get all pros and cons for these solutions
    let prosIds: number[] = [];
    let consIds: number[] = [];

    if (solutionIds.length > 0) {
      const questionPros = await db
        .select({ id: pros.id })
        .from(pros)
        .where(sql`${pros.solutionId} IN (${sql.join(solutionIds.map(id => sql`${id}`), sql`, `)})`);
      
      const questionCons = await db
        .select({ id: cons.id })
        .from(cons)
        .where(sql`${cons.solutionId} IN (${sql.join(solutionIds.map(id => sql`${id}`), sql`, `)})`);

      prosIds = questionPros.map(p => p.id);
      consIds = questionCons.map(c => c.id);
    }

    // Delete in the correct order to respect foreign key constraints
    
    // 1. Delete all votes related to this question (pros, cons, solutions)
    if (prosIds.length > 0) {
      await db.delete(votes).where(sql`${votes.prosId} IN (${sql.join(prosIds.map(id => sql`${id}`), sql`, `)})`);
    }
    if (consIds.length > 0) {
      await db.delete(votes).where(sql`${votes.consId} IN (${sql.join(consIds.map(id => sql`${id}`), sql`, `)})`);
    }
    if (solutionIds.length > 0) {
      await db.delete(votes).where(sql`${votes.solutionId} IN (${sql.join(solutionIds.map(id => sql`${id}`), sql`, `)})`);
    }

    // 2. Delete participants
    await db.delete(participants).where(eq(participants.questionId, questionId));

    // 3. Delete pros and cons
    if (prosIds.length > 0) {
      await db.delete(pros).where(sql`${pros.id} IN (${sql.join(prosIds.map(id => sql`${id}`), sql`, `)})`);
    }
    if (consIds.length > 0) {
      await db.delete(cons).where(sql`${cons.id} IN (${sql.join(consIds.map(id => sql`${id}`), sql`, `)})`);
    }

    // 4. Delete solutions
    if (solutionIds.length > 0) {
      await db.delete(solutions).where(eq(solutions.questionId, questionId));
    }

    // 5. Finally delete the question
    await db.delete(questions).where(eq(questions.id, questionId));

    return NextResponse.json({
      success: true,
      message: "Question deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting question:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to delete question",
      },
      { status: 500 }
    )
  }
}