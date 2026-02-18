import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { accessLinks } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/organizations/access-links/qr - Generate QR code for access link
 * Returns SVG QR code or PNG image of the QR code
 * Requires: ?token=<accessLink>&format=svg|png
 * Note: Intentionally public — the token itself serves as the auth mechanism.
 * The token must be valid (exist in DB) to generate a QR code.
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    const format = req.nextUrl.searchParams.get("format") || "svg";

    if (!token) {
      return NextResponse.json(
        { error: "token parameter is required" },
        { status: 400 }
      );
    }

    // Verify the access link exists
    const [linkRecord] = await db
      .select()
      .from(accessLinks)
      .where(eq(accessLinks.token, token))
      .limit(1);

    if (!linkRecord) {
      return NextResponse.json(
        { error: "Invalid access link" },
        { status: 404 }
      );
    }

    // Generate QR code URL
    const joinUrl = `${process.env.NEXTAUTH_URL}/join/${token}`;
    
    // Use a simple QR code generation service (qr-server.com)
    // For production, consider using a library like 'qrcode' for server-side generation
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinUrl)}`;

    if (format === "url") {
      return NextResponse.json({
        qrCodeUrl,
        joinUrl,
      });
    }

    // Fetch and return the QR code image
    try {
      const qrResponse = await fetch(qrCodeUrl);
      const qrBuffer = await qrResponse.arrayBuffer();

      return new NextResponse(qrBuffer, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=3600",
        },
      });
    } catch {
      return NextResponse.json({
        qrCodeUrl, // Fallback: return the URL
        joinUrl,
      });
    }

  } catch (error) {
    console.error("Error generating QR code:", error);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}
