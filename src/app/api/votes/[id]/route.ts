import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-options";
import { db } from "@/db/drizzle";
import { votes } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { log } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const itemId = parseInt(id, 10);

    if (isNaN(itemId)) {
      return NextResponse.json(
        { success: false, message: "Invalid ID" },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type"); // "solution", "pro", or "con"

    if (!type || !["solution", "pro", "con"].includes(type)) {
      return NextResponse.json(
        { success: false, message: "Invalid or missing type parameter" },
        { status: 400 }
      );
    }

    let voteCount = 0;

    if (type === "solution") {
      // Get vote count for solution
      const solutionVotes = await db
        .select()
        .from(votes)
        .where(and(
          eq(votes.solutionId, itemId),
          isNull(votes.prosId),
          isNull(votes.consId)
        ));
      voteCount = solutionVotes.reduce((sum, vote) => sum + vote.vote, 0);
    } else if (type === "pro") {
      // Get vote count for pro
      const proVotes = await db
        .select()
        .from(votes)
        .where(eq(votes.prosId, itemId));
      voteCount = proVotes.reduce((sum, vote) => sum + vote.vote, 0);
    } else if (type === "con") {
      // Get vote count for con
      const conVotes = await db
        .select()
        .from(votes)
        .where(eq(votes.consId, itemId));
      voteCount = conVotes.reduce((sum, vote) => sum + vote.vote, 0);
    }

    log('info', 'Vote count fetched', session.user.id, true, { type, itemId, voteCount });

    return NextResponse.json({
      success: true,
      data: {
        voteCount,
      },
    });

  } catch (error) {
    log('error', 'Vote fetch error', undefined, false, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
