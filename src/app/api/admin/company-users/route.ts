import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-options";
import { db } from "@/db/drizzle";
import { companyUsers, users, organizations } from "@/db/schema";
import { eq, and, ilike, or } from "drizzle-orm";
import { isAdminUser } from "@/lib/admin";
import { log } from "@/lib/logger";

// Helper: resolve the admin's org
async function getAdminOrg(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) return null;

  if (!isAdminUser(user.role)) return null;
  if (user.organizationId) return user.organizationId;
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.adminUserId, user.uid))
    .limit(1);
  return org?.id ?? null;
}

// GET — list company users for admin's org
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const orgId = await getAdminOrg(session.user.email);
  if (!orgId) {
    return NextResponse.json({ error: "No organization found. Create one first." }, { status: 404 });
  }

  try {
    const search = req.nextUrl.searchParams.get("search") || "";

    let rows;
    if (search) {
      rows = await db
        .select()
        .from(companyUsers)
        .where(
          and(
            eq(companyUsers.organizationId, orgId),
            or(
              ilike(companyUsers.name, `%${search}%`),
              ilike(companyUsers.email, `%${search}%`),
              ilike(companyUsers.department, `%${search}%`)
            )
          )
        );
    } else {
      rows = await db
        .select()
        .from(companyUsers)
        .where(eq(companyUsers.organizationId, orgId));
    }

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    log("error", "Failed to fetch company users", session.user.id, true, {
      error: error instanceof Error ? error.message : "Unknown",
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — add one or many company users (bulk paste)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const orgId = await getAdminOrg(session.user.email);
  if (!orgId) {
    return NextResponse.json({ error: "No organization found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    // Accepts { users: [{ department?, name, email }] }
    const incoming: { department?: string; name: string; email: string }[] = body.users;

    if (!Array.isArray(incoming) || incoming.length === 0) {
      return NextResponse.json({ error: "Provide an array of users" }, { status: 400 });
    }

    // Validate emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalid = incoming.filter((u) => !emailRegex.test(u.email));
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: "Invalid emails", details: invalid.map((u) => u.email) },
        { status: 400 }
      );
    }

    // Check which already exist to avoid duplicates
    const existingRows = await db
      .select({ email: companyUsers.email })
      .from(companyUsers)
      .where(eq(companyUsers.organizationId, orgId));
    const existingSet = new Set(existingRows.map((r) => r.email.toLowerCase()));

    const toInsert = incoming
      .filter((u) => !existingSet.has(u.email.toLowerCase()))
      .map((u) => ({
        organizationId: orgId,
        department: u.department || null,
        name: u.name,
        email: u.email.toLowerCase(),
      }));

    const skipped = incoming.length - toInsert.length;

    if (toInsert.length > 0) {
      // Check if any of these emails already have a Vayam account
      const allEmails = toInsert.map((u) => u.email);
      const registeredUsers = await db
        .select({ uid: users.uid, email: users.email })
        .from(users)
        .where(
          or(...allEmails.map((e) => eq(users.email, e)))
        );
      const registeredMap = new Map(registeredUsers.map((u) => [u.email!.toLowerCase(), u.uid]));

      const values = toInsert.map((u) => ({
        ...u,
        isRegistered: registeredMap.has(u.email),
        userId: registeredMap.get(u.email) || null,
      }));

      await db.insert(companyUsers).values(values);
    }

    log("info", "Company users added", session.user.id, true, {
      inserted: toInsert.length,
      skipped,
    });

    return NextResponse.json({
      success: true,
      inserted: toInsert.length,
      skipped,
    });
  } catch (error) {
    log("error", "Failed to add company users", session.user.id, true, {
      error: error instanceof Error ? error.message : "Unknown",
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
