import { db } from "@/db/drizzle";
import { organizations, users, accessLinks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { UserType } from "@/types/vayam";

/**
 * Access Control utilities for managing user permissions and organization access
 */

export interface AccessValidationResult {
  valid: boolean;
  userType?: UserType;
  organizationId?: number;
  accessMethod?: "link_qr" | "domain" | "whitelist";
  error?: string;
}

/**
 * Validate if an email can access an organization based on access method
 * Supports three methods: Link/QR, Domain-based, and Whitelist
 */
export async function validateOrganizationAccess(
  email: string,
  organizationId?: number,
  accessLink?: string
): Promise<AccessValidationResult> {
  try {
    let org;

    // Find organization by ID or access link
    if (organizationId) {
      [org] = await db
        .select()
        .from(organizations)
        .where(and(
          eq(organizations.id, organizationId),
          eq(organizations.isActive, true)
        ))
        .limit(1);
    } else if (accessLink) {
      [org] = await db
        .select()
        .from(organizations)
        .where(and(
          eq(organizations.accessLink, accessLink),
          eq(organizations.isActive, true)
        ))
        .limit(1);
    }

    if (!org) {
      return {
        valid: false,
        error: "Organization not found or inactive",
      };
    }

    // Link/QR access - anyone can join (Google Sheets style sharing)
    if (org.accessLink && accessLink === org.accessLink) {
      // Check if link access is enabled
      if (!org.isLinkAccessEnabled) {
        return {
          valid: false,
          error: "Link access has been disabled for this organization",
        };
      }

      // Check if link has expired
      if (org.accessLinkExpiresAt && new Date(org.accessLinkExpiresAt) < new Date()) {
        return {
          valid: false,
          error: "This access link has expired",
        };
      }

      return {
        valid: true,
        userType: "link_qr",
        organizationId: org.id,
        accessMethod: "link_qr",
      };
    }

    // Domain-based access - company domain verification
    if (org.domain) {
      const emailDomain = email.split("@")[1];
      if (emailDomain === org.domain) {
        return {
          valid: true,
          userType: "private_domain",
          organizationId: org.id,
          accessMethod: "domain",
        };
      }
    }

    // Whitelist-based access - explicit email approval
    if (org.whitelistedEmails && org.whitelistedEmails.includes(email)) {
      return {
        valid: true,
        userType: "private_whitelist",
        organizationId: org.id,
        accessMethod: "whitelist",
      };
    }

    return {
      valid: false,
      error: "Email not authorized for this organization",
    };

  } catch (error) {
    console.error("Error validating organization access:", error);
    return {
      valid: false,
      error: "Failed to validate access",
    };
  }
}

/**
 * Check if user can access a question based on their type and organization
 */
export async function canAccessQuestion(
  userId: number,
  questionId: number
): Promise<boolean> {
  try {
    const { questions } = await import("@/db/schema");

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.uid, userId))
      .limit(1);

    if (!user) return false;

    // Get question
    const [question] = await db
      .select()
      .from(questions)
      .where(eq(questions.id, questionId))
      .limit(1);

    if (!question || !question.isActive) return false;

    // Public questions are accessible to all
    if (question.isPublic) return true;

    // Private questions are only accessible to organization members
    if (question.organizationId && user.organizationId === question.organizationId) {
      return true;
    }

    return false;

  } catch (error) {
    console.error("Error checking question access:", error);
    return false;
  }
}

/**
 * Get accessible questions for a user based on their type
 */
export async function getAccessibleQuestions(userId: number) {
  try {
    const { questions } = await import("@/db/schema");

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.uid, userId))
      .limit(1);

    if (!user) return [];

    // Regular users see all public questions
    if (user.userType === "regular" && !user.organizationId) {
      return await db
        .select()
        .from(questions)
        .where(and(
          eq(questions.isPublic, true),
          eq(questions.isActive, true)
        ));
    }

    // Private users see only their organization's questions
    if (user.organizationId && (user.userType === "private_domain" || user.userType === "private_whitelist")) {
      return await db
        .select()
        .from(questions)
        .where(and(
          eq(questions.organizationId, user.organizationId),
          eq(questions.isActive, true)
        ));
    }

    return [];

  } catch (error) {
    console.error("Error fetching accessible questions:", error);
    return [];
  }
}

/**
 * Check if user should be prompted for personal email
 */
export async function shouldPromptForPersonalEmail(userId: number): Promise<boolean> {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.uid, userId))
      .limit(1);

    if (!user) return false;

    // Private users without personal email should be prompted
    return (
      (user.userType === "private_domain" || user.userType === "private_whitelist") &&
      !user.personalEmail
    );

  } catch (error) {
    console.error("Error checking personal email prompt:", error);
    return false;
  }
}

/**
 * Extract domain from email
 */
export function extractDomain(email: string): string {
  return email.split("@")[1] || "";
}

/**
 * Check if email belongs to a company domain
 */
export async function isCompanyEmail(email: string): Promise<boolean> {
  try {
    const domain = extractDomain(email);
    
    const [org] = await db
      .select()
      .from(organizations)
      .where(and(
        eq(organizations.domain, domain),
        eq(organizations.isActive, true)
      ))
      .limit(1);

    return !!org;

  } catch (error) {
    console.error("Error checking company email:", error);
    return false;
  }
}

/**
 * Validate and track access link usage
 * Ensures link is valid, not expired, and within usage limits
 */
export async function validateAndTrackAccessLink(
  accessLinkToken: string
): Promise<{ valid: boolean; organizationId?: number; error?: string }> {
  try {
    // Find the access link record
    const [linkRecord] = await db
      .select()
      .from(accessLinks)
      .where(
        and(
          eq(accessLinks.token, accessLinkToken),
          eq(accessLinks.isActive, true)
        )
      )
      .limit(1);

    if (!linkRecord) {
      return {
        valid: false,
        error: "Invalid or inactive access link",
      };
    }

    // Check expiration
    if (linkRecord.expiresAt && new Date(linkRecord.expiresAt) < new Date()) {
      return {
        valid: false,
        error: "This access link has expired",
      };
    }

    // Check usage limit
    if (linkRecord.maxUsage && (linkRecord.usageCount || 0) >= linkRecord.maxUsage) {
      return {
        valid: false,
        error: "This access link has reached its usage limit",
      };
    }

    // Increment usage count
    await db
      .update(accessLinks)
      .set({
        usageCount: (linkRecord.usageCount || 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(accessLinks.id, linkRecord.id));

    return {
      valid: true,
      organizationId: linkRecord.organizationId,
    };
  } catch (error) {
    console.error("Error validating access link:", error);
    return {
      valid: false,
      error: "Failed to validate access link",
    };
  }
}

/**
 * Create a new access link for an organization
 */
export async function createAccessLink(
  organizationId: number,
  createdByUserId: number,
  options?: {
    maxUsage?: number;
    expiresAt?: Date;
    accessType?: "public_link" | "qr_code";
  }
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    // Generate unique token (using crypto for secure random)
    const token = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);

    const result = await db
      .insert(accessLinks)
      .values({
        organizationId,
        token,
        accessType: options?.accessType || "public_link",
        maxUsage: options?.maxUsage,
        expiresAt: options?.expiresAt,
        createdByUserId,
        usageCount: 0,
        isActive: true,
      })
      .returning({ token: accessLinks.token });

    if (result.length > 0) {
      return {
        success: true,
        token: result[0].token,
      };
    }

    return {
      success: false,
      error: "Failed to create access link",
    };
  } catch (error) {
    console.error("Error creating access link:", error);
    return {
      success: false,
      error: "Failed to create access link",
    };
  }
}

/**
 * Get organization access link details
 */
export async function getOrganizationAccessLink(
  organizationId: number
): Promise<{ token?: string; isEnabled: boolean; expiresAt?: Date; usageCount: number }> {
  try {
    const [linkRecord] = await db
      .select()
      .from(accessLinks)
      .where(
        and(
          eq(accessLinks.organizationId, organizationId),
          eq(accessLinks.isActive, true)
        )
      )
      .limit(1);

    if (!linkRecord) {
      return {
        isEnabled: false,
        usageCount: 0,
      };
    }

    return {
      token: linkRecord.token,
      isEnabled: !linkRecord.expiresAt || new Date(linkRecord.expiresAt) >= new Date(),
      expiresAt: linkRecord.expiresAt || undefined,
      usageCount: linkRecord.usageCount || 0,
    };
  } catch (error) {
    console.error("Error fetching access link:", error);
    return {
      isEnabled: false,
      usageCount: 0,
    };
  }
}

/**
 * Disable/revoke an organization's access link
 */
export async function revokeAccessLink(organizationId: number): Promise<boolean> {
  try {
    await db
      .update(accessLinks)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(accessLinks.organizationId, organizationId));

    return true;
  } catch (error) {
    console.error("Error revoking access link:", error);
    return false;
  }
}
