import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-options";
import { db } from "@/db/drizzle";
import { companyUsers, users, organizations } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { isAdminUser } from "@/lib/admin";
import { log } from "@/lib/logger";
import * as XLSX from "xlsx";

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

// POST — import company users from Excel (dept, name, email)
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
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json({ error: "Empty workbook" }, { status: 400 });
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });

    if (rows.length === 0) {
      return NextResponse.json({ error: "No data rows found" }, { status: 400 });
    }

    // Normalize header names
    const normalize = (h: string) => h.toLowerCase().replace(/[^a-z]/g, "");
    const headerMap = Object.keys(rows[0]).reduce(
      (acc, key) => {
        const n = normalize(key);
        if (n.includes("dept") || n.includes("department")) acc.department = key;
        else if (n.includes("name")) acc.name = key;
        else if (n.includes("email") || n.includes("mail")) acc.email = key;
        return acc;
      },
      {} as { department?: string; name?: string; email?: string }
    );

    if (!headerMap.email) {
      return NextResponse.json(
        { error: "Excel must have an 'email' column" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const parsed: { department: string | null; name: string; email: string }[] = [];
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const email = (row[headerMap.email!] || "").trim().toLowerCase();
      const name = (row[headerMap.name || ""] || "").trim() || email.split("@")[0];
      const department = headerMap.department ? (row[headerMap.department] || "").trim() || null : null;

      if (!emailRegex.test(email)) {
        errors.push(`Row ${i + 2}: invalid email "${email}"`);
        continue;
      }
      parsed.push({ department, name, email });
    }

    // Deduplicate within file
    const seen = new Set<string>();
    const unique = parsed.filter((r) => {
      if (seen.has(r.email)) return false;
      seen.add(r.email);
      return true;
    });

    // Check existing
    const existingRows = await db
      .select({ email: companyUsers.email })
      .from(companyUsers)
      .where(eq(companyUsers.organizationId, orgId));
    const existingSet = new Set(existingRows.map((r) => r.email.toLowerCase()));
    const toInsert = unique.filter((u) => !existingSet.has(u.email));

    if (toInsert.length > 0) {
      // Check registered Vayam accounts
      const allEmails = toInsert.map((u) => u.email);
      const registeredUsers = await db
        .select({ uid: users.uid, email: users.email })
        .from(users)
        .where(or(...allEmails.map((e) => eq(users.email, e))));
      const registeredMap = new Map(registeredUsers.map((u) => [u.email!.toLowerCase(), u.uid]));

      const values = toInsert.map((u) => ({
        organizationId: orgId,
        department: u.department,
        name: u.name,
        email: u.email,
        isRegistered: registeredMap.has(u.email),
        userId: registeredMap.get(u.email) || null,
      }));

      await db.insert(companyUsers).values(values);
    }

    log("info", "Excel import completed", session.user.id, true, {
      totalRows: rows.length,
      inserted: toInsert.length,
      skipped: unique.length - toInsert.length,
      errors: errors.length,
    });

    return NextResponse.json({
      success: true,
      inserted: toInsert.length,
      skipped: unique.length - toInsert.length,
      errors,
      totalParsed: unique.length,
    });
  } catch (error) {
    log("error", "Excel import failed", session.user.id, true, {
      error: error instanceof Error ? error.message : "Unknown",
    });
    return NextResponse.json({ error: "Failed to process file" }, { status: 500 });
  }
}
