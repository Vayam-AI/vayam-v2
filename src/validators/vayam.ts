import { z } from "zod";

// Question validation schemas
export const createQuestionSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters").max(200, "Title too long"),
  description: z.string().min(50, "Description must be at least 50 characters").max(2000, "Description too long"),
  tags: z.array(z.string().min(1).max(50)).max(10, "Too many tags").optional(),
  allowedEmails: z.array(z.string().email("Invalid email format")).max(100, "Too many allowed emails").optional(),
  isActive: z.boolean().optional(),
});

export const updateQuestionSchema = createQuestionSchema.partial();

// Solution validation schemas
export const createSolutionSchema = z.object({
  questionId: z.number().int().positive("Invalid question ID"),
  title: z.string().min(5, "Title must be at least 5 characters").max(150, "Title too long"),
  content: z.string().min(100, "Solution must be at least 100 characters").max(5000, "Solution too long"),
});

export const updateSolutionSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(150, "Title too long").optional(),
  content: z.string().min(100, "Solution must be at least 100 characters").max(5000, "Solution too long").optional(),
});

// Pro validation schemas
export const createProSchema = z.object({
  solutionId: z.number().int().positive("Invalid solution ID"),
  content: z.string().min(10, "Content must be at least 10 characters").max(500, "Content too long"),
});

// Con validation schemas
export const createConSchema = z.object({
  solutionId: z.number().int().positive("Invalid solution ID"),
  content: z.string().min(10, "Content must be at least 10 characters").max(500, "Content too long"),
});

// Vote validation schemas
export const voteSchema = z.object({
  targetType: z.enum(["question", "solution", "pro", "con"], { message: "Invalid target type" }),
  targetId: z.number().int().positive("Invalid target ID"),
  voteType: z.enum(["upvote", "downvote"], { message: "Vote type must be 'upvote' or 'downvote'" }),
});

// User profile validation schemas
export const updateUserProfileSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters").max(50, "Username too long").optional(),
});

// Query parameter validation schemas
export const paginationSchema = z.object({
  page: z.coerce.number().min(1, "Page must be at least 1").default(1),
  limit: z.coerce.number().min(1, "Limit must be at least 1").max(100, "Limit too high").default(10),
});

export const questionsQuerySchema = paginationSchema.extend({
  isActive: z.coerce.boolean().optional(),
  tag: z.string().optional(),
  search: z.string().max(100, "Search query too long").optional(),
  owner: z.coerce.number().int().positive().optional(),
});

export const solutionsQuerySchema = paginationSchema.extend({
  questionId: z.coerce.number().int().positive("Invalid question ID"),
  userId: z.coerce.number().int().positive().optional(),
  isActive: z.coerce.boolean().optional(),
});

export const prosConsQuerySchema = paginationSchema.extend({
  solutionId: z.coerce.number().int().positive("Invalid solution ID"),
  userId: z.coerce.number().int().positive().optional(),
});

// Type exports for the validated schemas
export type CreateQuestionData = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionData = z.infer<typeof updateQuestionSchema>;
export type CreateSolutionData = z.infer<typeof createSolutionSchema>;
export type UpdateSolutionData = z.infer<typeof updateSolutionSchema>;
export type CreateProData = z.infer<typeof createProSchema>;
export type CreateConData = z.infer<typeof createConSchema>;
export type VoteData = z.infer<typeof voteSchema>;
export type UpdateUserProfileData = z.infer<typeof updateUserProfileSchema>;
export type PaginationData = z.infer<typeof paginationSchema>;
export type QuestionsQueryData = z.infer<typeof questionsQuerySchema>;
export type SolutionsQueryData = z.infer<typeof solutionsQuerySchema>;
export type ProsConsQueryData = z.infer<typeof prosConsQuerySchema>;