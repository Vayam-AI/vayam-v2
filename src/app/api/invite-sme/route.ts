import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-options";
import { isAdminUser } from "@/lib/admin";
import { EmailNotifications, SMEInvitationData } from "@/utils/email-templates";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user is admin
    if (!isAdminUser(session.user.email)) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const { emails, questionTitle, questionId, questionDescription } = await req.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: "Valid email addresses are required" },
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
    
    // Prepare template data
    const templateData: SMEInvitationData = {
      questionTitle,
      questionId,
      questionDescription,
      questionUrl,
      platformUrl: process.env.NEXTAUTH_URL || "https://vayam.ai",
      supportUrl: `${process.env.NEXTAUTH_URL}/support`,
      unsubscribeUrl: `${process.env.NEXTAUTH_URL}/unsubscribe`,
    };

    // Send emails to all SMEs using the new helper
    const emailPromises = emails.map(async (email: string) => {
      return EmailNotifications.sendSMEInvitation(email, templateData);
    });

    const results = await Promise.allSettled(emailPromises);
    
    // Check results
    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;
    
    const failed = results.length - successful;
    
    if (failed > 0) {
      // Email sending failure logged in development only
      if (process.env.NODE_ENV === 'development') {
        console.error(`${failed} email(s) failed to send`);
      }
      return NextResponse.json({
        success: false,
        message: `${successful} invitation(s) sent successfully, ${failed} failed`,
        details: { successful, failed }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Invitations sent successfully to ${successful} SME(s)`,
    });

  } catch (error) {
    // SME invitation error logged in development only
    if (process.env.NODE_ENV === 'development') {
      console.error("Error sending SME invitations:", error);
    }
    return NextResponse.json(
      { error: "Failed to send invitations" },
      { status: 500 }
    );
  }
}