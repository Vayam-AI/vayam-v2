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

// Users table with timestamp instead of bigint
export const users = pgTable("users", {
  uid: serial("uid").primaryKey(),
  username: varchar("username", { length: 255 }).unique(),
  email: varchar("email", { length: 255 }).unique(),
  mobile: varchar("mobile", { length: 15 }).unique(), // +91XXXXXXXXXX format
  pwhash: text("pwhash"), // bcrypt hash for email/password users (nullable for OAuth users)
  provider: varchar("provider", { length: 50 }).default("email"), // google, email
  isEmailVerified: boolean("is_email_verified").default(false),
  isMobileVerified: boolean("is_mobile_verified").default(false),
  hasSkippedMobileVerification: boolean("has_skipped_mobile").default(false), // New field to track if user skipped mobile verification
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

export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  level: varchar("level", { length: 20 }).notNull(),
  message: text("message").notNull(),
  userId: varchar("user_id", { length: 255 }).default("anonymous"),
  isAuthenticated: boolean("is_authenticated").default(false),
  extraData: jsonb("extra_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations for better querying
export const usersRelations = relations(users, ({ many }) => ({
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
  solutions: many(solutions),
  votes: many(votes),
  participants: many(participants),
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
