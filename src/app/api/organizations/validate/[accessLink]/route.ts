import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/organizations/validate/[accessLink] - Validate access link
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ accessLink: string }> }
) {
  try {
    const { accessLink } = await params;

    // Find organization by access link
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.accessLink, accessLink))
      .limit(1);

    if (!org || !org.isActive) {
      return NextResponse.json(
        { valid: false, error: "Invalid or inactive access link" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      organization: {
        id: org.id,
        name: org.name,
      },
    });

  } catch (error) {
    console.error("Error validating access link:", error);
    return NextResponse.json(
      { valid: false, error: "Failed to validate access link" },
      { status: 500 }
    );
  }
}
