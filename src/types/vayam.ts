// Type definitions for the Vayam platform
export interface User {
  uid: number;
  username?: string;
  email: string;
  pwhash?: string;
  provider: string;
  isEmailVerified: boolean;
  createdAt: Date;
}

export interface Question {
  id: number;
  title: string;
  description: string;
  aboutContent?: string;
  tags: string[];
  participantCount: number;
  allowedEmails: string[]; // SME emails who can contribute solutions
  owner: number; // Admin user ID
  isActive: boolean;
  isPublic: boolean;
  logos: string[];
  infoImages: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Solution {
  id: number;
  questionId: number;
  userId: number;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Pro {
  id: number;
  solutionId: number;
  userId: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Con {
  id: number;
  solutionId: number;
  userId: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vote {
  id: number;
  questionId?: number;
  solutionId?: number;
  prosId?: number;
  consId?: number;
  userId: number;
  vote: number; // 1 for upvote, -1 for downvote
  createdAt: Date;
  updatedAt: Date;
}

export interface Participant {
  id: number;
  questionId: number;
  userId: number;
  participationType: string; // "solution", "pro", "con", "vote"
  createdAt: Date;
  updatedAt: Date;
}

// Request/Response types for API endpoints
export interface CreateQuestionRequest {
  title: string;
  description: string;
  aboutContent?: string;
  tags?: string[];
  allowedEmails?: string[];
  isPublic?: boolean;
  logos?: string[];
  infoImages?: string[];
}

export interface CreateSolutionRequest {
  questionId: number;
  title: string;
  content: string;
}

export interface CreateProRequest {
  solutionId: number;
  content: string;
}

export interface CreateConRequest {
  solutionId: number;
  content: string;
}

export interface VoteRequest {
  targetType: "question" | "solution" | "pro" | "con";
  targetId: number;
  voteType: "upvote" | "downvote";
}

// Display types with joined data
export interface QuestionWithDetails extends Question {
  ownerUser: Pick<User, "uid" | "username" | "email">;
  solutions: Solution[];
  totalSolutions: number;
  totalParticipants: number;
}

export interface SolutionWithDetails extends Solution {
  user: Pick<User, "uid" | "username" | "email">;
  pros: Pro[];
  cons: Con[];
  userVote?: Vote;
  totalUpvotes: number;
  totalDownvotes: number;
}

export interface ProConWithVotes {
  id: number;
  content: string;
  user: Pick<User, "uid" | "username" | "email">;
  upvotes: number;
  downvotes: number;
  userVote?: Vote;
  createdAt: Date;
}

// User role types
export type UserRole = "admin" | "sme" | "user";

// Platform statistics
export interface PlatformStats {
  totalQuestions: number;
  activeQuestions: number;
  totalUsers: number;
  totalSolutions: number;
  totalProsAndCons: number;
  totalVotes: number;
}