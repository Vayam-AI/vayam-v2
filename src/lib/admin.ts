// Admin emails that can access conversation creation and dashboard
export const ADMIN_EMAILS = [
  "keerolla@gmail.com",
  "Keerthi@vayam.ai", 
  "we@vayam.ai",
  "abhiramjaini28@gmail.com",
];

/**
 * Check if a user email is in the admin list
 * @param email - User email to check
 * @returns boolean - True if user is admin
 */
export function isAdminUser(email: string | null | undefined): boolean {
  return email ? ADMIN_EMAILS.includes(email) : false;
}

/**
 * Middleware to check if user has admin access
 * @param email - User email to check
 * @throws Error if user is not admin
 */
export function requireAdmin(email: string | null | undefined): void {
  if (!isAdminUser(email)) {
    throw new Error("Unauthorized: Admin access required");
  }
}

/**
 * Check if a user can contribute solutions to a question
 * @param email - User email to check
 * @param allowedEmails - Array of allowed emails for the question
 * @returns boolean - True if user can contribute
 */
export function canContributeSolution(email: string | null | undefined, allowedEmails: string[]): boolean {
  return email ? allowedEmails.includes(email) : false;
}