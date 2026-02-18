import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  smallint,
  unique,
  check,
  jsonb
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// Organizations/Companies table
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  domain: varchar("domain", { length: 255 }).unique(), // e.g., "companyname.com"
  accessLink: varchar("access_link", { length: 255 }).unique(), // Unique link for QR/Link access
  whitelistedEmails: text("whitelisted_emails").array().default([]), // Admin-submitted whitelist
  adminUserId: integer("admin_user_id"), // Will be set after user creation
  isActive: boolean("is_active").default(true),
  isLinkAccessEnabled: boolean("is_link_access_enabled").default(true), // Toggle link/QR access on/off
  accessLinkExpiresAt: timestamp("access_link_expires_at"), // Optional expiration for temporary links
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Users table with timestamp instead of bigint
export const users = pgTable("users", {
  uid: serial("uid").primaryKey(),
  username: varchar("username", { length: 255 }).unique(),
  email: varchar("email", { length: 255 }).unique(), // Work/company email
  personalEmail: varchar("personal_email", { length: 255 }), // Personal email for private users
  mobile: varchar("mobile", { length: 15 }).unique(), // +91XXXXXXXXXX format
  pwhash: text("pwhash"), // bcrypt hash for email/password users (nullable for OAuth users)
  provider: varchar("provider", { length: 50 }).default("email"), // google, email
  isEmailVerified: boolean("is_email_verified").default(false),
  isMobileVerified: boolean("is_mobile_verified").default(false),
  hasSkippedMobileVerification: boolean("has_skipped_mobile").default(false),
  userType: varchar("user_type", { length: 50 }).default("regular"), // regular, private_domain, private_whitelist, link_qr
  role: varchar("role", { length: 30 }).default("user").notNull(), // "admin" | "company_admin" | "user"
  accessLinkUsed: varchar("access_link_used", { length: 255 }), // Track which link/QR was used to join
  organizationId: integer("organization_id").references(() => organizations.id), // For private users
  isOrgAdmin: boolean("is_org_admin").default(false), // Legacy — use `role` instead
  createdAt: timestamp("created_at").defaultNow(),
});

// Questions/Cases table (renamed from "solutions" table name which was incorrect)
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  tags: text("tags").array().default([]),
  participantCount: integer("participant_count").default(0),
  allowedEmails: text("allowed_emails").array().default([]), // SME emails who can contribute solutions
  owner: integer("owner").references(() => users.uid).notNull(), // Admin who created
  isActive: boolean("is_active").default(true),
  isPublic: boolean("is_public").default(true), // true = public civic, false = private company
  organizationId: integer("organization_id").references(() => organizations.id), // For private conversations
  logos: text("logos").array().default([]),
  infoImages: text("info_images").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Solutions table (SME-submitted solutions)
export const solutions = pgTable("solutions", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").references(() => questions.id).notNull(),
  userId: integer("user_id").references(() => users.uid).notNull(),
  title: text("title").notNull(), // Solution title
  content: text("content").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pros table (user-contributed positive points)
export const pros = pgTable("pros", {
  id: serial("id").primaryKey(),
  solutionId: integer("solution_id").references(() => solutions.id).notNull(),
  userId: integer("user_id").references(() => users.uid).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cons table (user-contributed negative points)
export const cons = pgTable("cons", {
  id: serial("id").primaryKey(),
  solutionId: integer("solution_id").references(() => solutions.id).notNull(),
  userId: integer("user_id").references(() => users.uid).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Votes table (user votes on solutions, pros, and cons)
// Each vote must reference exactly one item: solution OR pros OR cons
export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").references(() => questions.id).notNull(),
  solutionId: integer("solution_id").references(() => solutions.id),
  prosId: integer("pros_id").references(() => pros.id),
  consId: integer("cons_id").references(() => cons.id),
  userId: integer("user_id").references(() => users.uid).notNull(),
  vote: smallint("vote").notNull(), // 1 for upvote, 0 for neutral, -1 for downvote
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Ensure that either a solutionId is provided with a prosId or consId, or a prosId or consId without solutionId
 checkExactlyOneReference: check("exactly_one_reference", 
  sql`
    ${table.solutionId} IS NOT NULL AND (
      (${table.prosId} IS NOT NULL AND ${table.consId} IS NULL) OR
      (${table.prosId} IS NULL AND ${table.consId} IS NOT NULL)
    )
  `
  )


}));



// Participants table (tracks user engagement)
export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").references(() => questions.id).notNull(),
  userId: integer("user_id").references(() => users.uid).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Unique constraint to ensure one participation record per user per question
  uniqueParticipation: unique().on(table.questionId, table.userId),
}));

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  uid: integer("uid").references(() => users.uid).notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
})

// Access Links table - tracks individual shareable links with metadata
export const accessLinks = pgTable("access_links", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  token: varchar("token", { length: 255 }).unique().notNull(), // Unique token/link identifier
  accessType: varchar("access_type", { length: 50 }).default("public_link"), // public_link, qr_code
  usageCount: integer("usage_count").default(0), // Track how many times this link has been used
  maxUsage: integer("max_usage"), // Optional limit on number of uses
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"), // Optional expiration date
  createdByUserId: integer("created_by_user_id").references(() => users.uid),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  level: varchar("level", { length: 20 }).notNull(),
  message: text("message").notNull(),
  userId: varchar("user_id", { length: 255 }).default("anonymous"),
  isAuthenticated: boolean("is_authenticated").default(false),
  extraData: jsonb("extra_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const inviteSmes = pgTable("invite_smes", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(), // SME email
  role: varchar("role", { length: 100 }).notNull(),
  background: text("background").notNull(),
  areas: text("areas").notNull(), // JSON string of areas of expertise
  createdAt: timestamp("created_at").defaultNow(),
});

// Company Users / Employee Directory (managed by org admin)
export const companyUsers = pgTable("company_users", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  department: varchar("department", { length: 255 }),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  isRegistered: boolean("is_registered").default(false),
  userId: integer("user_id").references(() => users.uid), // linked when they create a Vayam account
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueOrgEmail: unique().on(table.organizationId, table.email),
}));

// Per-user question access control
export const questionAccess = pgTable("question_access", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").references(() => questions.id).notNull(),
  companyUserId: integer("company_user_id").references(() => companyUsers.id).notNull(),
  grantedBy: integer("granted_by").references(() => users.uid).notNull(),
  inviteStatus: varchar("invite_status", { length: 50 }).default("pending"), // pending, sent, accepted
  invitedAt: timestamp("invited_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueQuestionUser: unique().on(table.questionId, table.companyUserId),
}));

// Custom email templates per question (admin-editable invite text)
export const questionEmailTemplates = pgTable("question_email_templates", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").references(() => questions.id).notNull(),
  subject: varchar("subject", { length: 500 }),
  body: text("body"),
  createdBy: integer("created_by").references(() => users.uid),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueQuestion: unique().on(table.questionId),
}));

// Relations for better querying
export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  admin: one(users, {
    fields: [organizations.adminUserId],
    references: [users.uid],
  }),
  users: many(users),
  questions: many(questions),
  companyUsers: many(companyUsers),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  createdQuestions: many(questions),
  solutions: many(solutions),
  pros: many(pros),
  cons: many(cons),
  votes: many(votes),
  participations: many(participants),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  owner: one(users, {
    fields: [questions.owner],
    references: [users.uid],
  }),
  organization: one(organizations, {
    fields: [questions.organizationId],
    references: [organizations.id],
  }),
  solutions: many(solutions),
  votes: many(votes),
  participants: many(participants),
  accessList: many(questionAccess),
  emailTemplate: many(questionEmailTemplates),
}));

export const solutionsRelations = relations(solutions, ({ one, many }) => ({
  question: one(questions, {
    fields: [solutions.questionId],
    references: [questions.id],
  }),
  user: one(users, {
    fields: [solutions.userId],
    references: [users.uid],
  }),
  pros: many(pros),
  cons: many(cons),
  votes: many(votes),
}));

export const prosRelations = relations(pros, ({ one, many }) => ({
  solution: one(solutions, {
    fields: [pros.solutionId],
    references: [solutions.id],
  }),
  user: one(users, {
    fields: [pros.userId],
    references: [users.uid],
  }),
  votes: many(votes),
}));

export const consRelations = relations(cons, ({ one, many }) => ({
  solution: one(solutions, {
    fields: [cons.solutionId],
    references: [solutions.id],
  }),
  user: one(users, {
    fields: [cons.userId],
    references: [users.uid],
  }),
  votes: many(votes),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  user: one(users, {
    fields: [votes.userId],
    references: [users.uid],
  }),
  question: one(questions, {
    fields: [votes.questionId],
    references: [questions.id],
  }),
  solution: one(solutions, {
    fields: [votes.solutionId],
    references: [solutions.id],
  }),
  pros: one(pros, {
    fields: [votes.prosId],
    references: [pros.id],
  }),
  cons: one(cons, {
    fields: [votes.consId],
    references: [cons.id],
  }),
}));

export const participantsRelations = relations(participants, ({ one }) => ({
  user: one(users, {
    fields: [participants.userId],
    references: [users.uid],
  }),
  question: one(questions, {
    fields: [participants.questionId],
    references: [questions.id],
  }),
}));

export const companyUsersRelations = relations(companyUsers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [companyUsers.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [companyUsers.userId],
    references: [users.uid],
  }),
  questionAccess: many(questionAccess),
}));

export const questionAccessRelations = relations(questionAccess, ({ one }) => ({
  question: one(questions, {
    fields: [questionAccess.questionId],
    references: [questions.id],
  }),
  companyUser: one(companyUsers, {
    fields: [questionAccess.companyUserId],
    references: [companyUsers.id],
  }),
  grantedByUser: one(users, {
    fields: [questionAccess.grantedBy],
    references: [users.uid],
  }),
}));

export const questionEmailTemplatesRelations = relations(questionEmailTemplates, ({ one }) => ({
  question: one(questions, {
    fields: [questionEmailTemplates.questionId],
    references: [questions.id],
  }),
  createdByUser: one(users, {
    fields: [questionEmailTemplates.createdBy],
    references: [users.uid],
  }),
}));
