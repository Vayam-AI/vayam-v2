import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Centralized middleware for authentication and role-based access control.
 * Uses next-auth/jwt (Edge-compatible) instead of the full auth() wrapper
 * which would pull in Node.js-only dependencies (drizzle, fs, etc.).
 *
 * - Public routes (auth, contact, sme, org validation, QR) are allowed through.
 * - All other API routes require a valid session.
 * - /api/admin/* routes additionally require admin or company_admin role.
 * - /admin/* pages additionally require admin or company_admin role.
 */

const PUBLIC_API_PREFIXES = [
  "/api/auth",
  "/api/contact",
  "/api/sme",
  "/api/organizations/validate",
  "/api/organizations/access-links/qr",
];

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isAdminRole(role: string | undefined | null): boolean {
  return role === "admin" || role === "company_admin";
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Public API routes: allow through ──
  if (isPublicApiRoute(pathname)) {
    return NextResponse.next();
  }

  // Decode JWT token (Edge-compatible, no DB or Node.js APIs needed)
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || "development-secret-key",
  });

  // ── Protected API routes ──
  if (pathname.startsWith("/api/")) {
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admin API routes require admin role
    if (pathname.startsWith("/api/admin/")) {
      if (!isAdminRole(token.role as string)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.next();
  }

  // ── Protected pages under /admin/* ──
  if (pathname.startsWith("/admin")) {
    if (!token) {
      const signInUrl = new URL("/signin", req.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
    if (!isAdminRole(token.role as string)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // ── Protected pages (dashboard, questions, profile, organization) ──
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/questions") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/organization")
  ) {
    if (!token) {
      const signInUrl = new URL("/signin", req.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
    return NextResponse.next();
  }

  // Everything else: allow through (public pages, static assets, etc.)
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
    "/admin/:path*",
    "/dashboard/:path*",
    "/questions/:path*",
    "/profile/:path*",
    "/organization/:path*",
  ],
};
