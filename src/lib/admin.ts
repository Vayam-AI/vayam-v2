// Valid user roles
export type UserRole = "admin" | "company_admin" | "user";

// Platform-level admin emails (super admins) — used ONLY during signup to auto-assign "admin" role
export const ADMIN_EMAILS = [
  "keerolla@gmail.com",
  "Keerthi@vayam.ai",
  "we@vayam.ai",
];

/**
 * Check if an email is in the hardcoded platform admin list.
 * Used during signup to auto-assign the "admin" role.
 */
export function isPlatformAdminEmail(email: string | null | undefined): boolean {
  return email ? ADMIN_EMAILS.includes(email) : false;
}

/**
 * Check if a user has admin-level access (platform admin OR company admin).
 * Should be called with the `role` field from the session/JWT.
 */
export function isAdminUser(role: UserRole | string | undefined | null): boolean {
  return role === "admin" || role === "company_admin";
}

/**
 * Check if a user is a platform-level admin (super admin).
 */
export function isPlatformAdmin(role: UserRole | string | undefined | null): boolean {
  return role === "admin";
}

/**
 * Check if a user is a company admin.
 */
export function isCompanyAdmin(role: UserRole | string | undefined | null): boolean {
  return role === "company_admin";
}

/**
 * Check if a user can contribute solutions to a question
 */
export function canContributeSolution(email: string | null | undefined, allowedEmails: string[]): boolean {
  return email ? allowedEmails.includes(email) : false;
}