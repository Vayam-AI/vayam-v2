import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-options";
import { isAdminUser } from "@/lib/admin";
import { getBatchStatus } from "@/lib/queue";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!isAdminUser(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { batchId } = await params;

  try {
    const status = await getBatchStatus(batchId);
    if (!status) {
      return NextResponse.json({ error: "Batch not found or expired" }, { status: 404 });
    }

    const pending = status.total - status.completed - status.failed;
    const done = status.completed + status.failed === status.total;

    return NextResponse.json({
      success: true,
      data: {
        batchId: status.batchId,
        total: status.total,
        completed: status.completed,
        failed: status.failed,
        pending,
        done,
        failedEmails: status.failedEmails,
        startedAt: status.startedAt,
        progress: status.total > 0
          ? Math.round(((status.completed + status.failed) / status.total) * 100)
          : 0,
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
