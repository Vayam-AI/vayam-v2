import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-options";
import { db } from "@/db/drizzle";
import { users, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAdminUser } from "@/lib/admin";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!isAdminUser(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const [user] = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let orgId = user.organizationId;
    if (!orgId) {
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.adminUserId, user.uid))
        .limit(1);
      orgId = org?.id ?? null;
    }

    if (!orgId) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: org.id,
        name: org.name,
        domain: org.domain,
        accessLink: org.accessLink,
        isActive: org.isActive,
        isLinkAccessEnabled: org.isLinkAccessEnabled,
        accessLinkExpiresAt: org.accessLinkExpiresAt,
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
