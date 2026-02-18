import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-options";
import { isAdminUser } from "@/lib/admin";
import { EmailNotifications, SMEInvitationData } from "@/utils/email-templates";
import { log } from "@/lib/logger";

interface SMEInput {
  name: string;
  email: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.email) {
      log('warn', 'Unauthorized SME invitation attempt', undefined, false);
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if user is admin
    if (!isAdminUser(session.user.role)) {
      log('warn', 'Non-admin SME invitation attempt', userId, true);
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const { smes, questionTitle, questionId, questionDescription } = await req.json();

    if (!smes || !Array.isArray(smes) || smes.length === 0) {
      return NextResponse.json(
        { error: "Valid SME data (name & email) is required" },
        { status: 400 }
      );
    }

    const invalidSMEs = smes.filter((sme: SMEInput) => !sme.email || !sme.name);
    if (invalidSMEs.length > 0) {
      return NextResponse.json(
        { error: "Each SME must have both name and email" },
        { status: 400 }
      );
    }

    if (!questionTitle) {
      return NextResponse.json(
        { error: "Question title is required" },
        { status: 400 }
      );
    }

    const questionUrl = `${process.env.NEXTAUTH_URL}/questions/${questionId}`;

    const emailPromises = smes.map(async (sme: SMEInput) => {
      const data: SMEInvitationData = {
        name: sme.name,
        questionTitle,
        questionId,
        questionDescription,
        questionUrl,
        platformUrl: process.env.NEXTAUTH_URL || "https://vayam.ai",
        supportUrl: `${process.env.NEXTAUTH_URL}/support`,
        unsubscribeUrl: `${process.env.NEXTAUTH_URL}/unsubscribe`,
      };

      return EmailNotifications.sendSMEInvitation(sme.email, data);
    });

    const results = await Promise.allSettled(emailPromises);

    // Check results
    const successful = results.filter(result =>
      result.status === 'fulfilled' && result.value.success
    ).length;

    const failed = results.length - successful;

    if (failed > 0) {
      log('warn', 'Some SME invitations failed', userId, true, { successful, failed, questionId });
      return NextResponse.json({
        success: false,
        message: `${successful} invitation(s) sent successfully, ${failed} failed`,
        details: { successful, failed }
      });
    }

    log('info', 'SME invitations sent successfully', userId, true, {
      emailCount: successful,
      questionId
    });

    return NextResponse.json({
      success: true,
      message: `Invitations sent successfully to ${successful} SME(s)`,
    });

  } catch (error) {
    log('error', 'SME invitation error', undefined, false, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return NextResponse.json(
      { error: "Failed to send invitations" },
      { status: 500 }
    );
  }
}