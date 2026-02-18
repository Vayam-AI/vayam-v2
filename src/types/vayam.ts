// Type definitions for the Vayam platform

// Access Control Types
export type UserType = "regular" | "private_domain" | "private_whitelist" | "link_qr";
export type AccessMethod = "link_qr" | "domain" | "whitelist";
export type LinkAccessType = "public_link" | "qr_code";

export interface Organization {
  id: number;
  name: string;
  domain?: string | null;
  accessLink?: string | null;
  whitelistedEmails: string[];
  adminUserId?: number | null;
  isActive: boolean;
  isLinkAccessEnabled: boolean;
  accessLinkExpiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccessLink {
  id: number;
  organizationId: number;
  token: string;
  accessType: "public_link" | "qr_code";
  usageCount: number;
  maxUsage?: number | null;
  isActive: boolean;
  expiresAt?: Date | null;
  createdByUserId?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  uid: number;
  username?: string | null;
  email: string;
  personalEmail?: string | null;
  pwhash?: string;
  provider: string;
  isEmailVerified: boolean;
  userType: UserType;
  accessLinkUsed?: string | null;
  organizationId?: number | null;
  isOrgAdmin: boolean;
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
  organizationId?: number | null;
  logos: string[];
  infoImages: string[];
  createdAt: string;
  updatedAt: string;
  ownerEmail: string;
  ownerUsername: string | null;
}

export interface ProCon {
  id: number;
  solutionId: number;
  userId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: Pick<User, "uid" | "username" | "email">;
  upvotes: number;
  downvotes: number;
  voteCount: number;
  userVote: number | null; // 1 for upvote, -1 for downvote, null for no vote
}

export interface Solution {
  id: number;
  questionId: number;
  userId: number;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user: Pick<User, "uid" | "username" | "email">;
  pros: ProCon[];
  cons: ProCon[];
  voteCount: number;
  userVote: number | null;
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

// API Response Types for processing server data
export interface ApiSolutionResponse {
  id: number;
  questionId: number;
  userId: number;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user: Pick<User, "uid" | "username" | "email">;
  pros: ApiProConResponse[];
  cons: ApiProConResponse[];
  voteCount: string | number;
  userVote: string | number | null;
}

export interface ApiProConResponse {
  id: number;
  solutionId: number;
  userId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: Pick<User, "uid" | "username" | "email">;
  upvotes: string | number;
  downvotes: string | number;
  voteCount: string | number;
  userVote: string | number | null;
}

// Request/Response types for API endpoints
export interface CreateQuestionRequest {
  title: string;
  description: string;
  aboutContent?: string;
  tags?: string[];
  allowedEmails?: string[];
  isPublic?: boolean;
  organizationId?: number;
  logos?: string[];
  infoImages?: string[];
}

export interface CreateOrganizationRequest {
  name: string;
  domain?: string;
  whitelistedEmails?: string[];
  accessMethod: AccessMethod;
}

export interface UpdatePersonalEmailRequest {
  personalEmail: string;
}

export interface ValidateAccessRequest {
  email: string;
  accessLink?: string;
  organizationId?: number;
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

export interface SolutionWithDetails {
  id: number;
  questionId: number;
  userId: number;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user: Pick<User, "uid" | "username" | "email">;
  pros: ProCon[];
  cons: ProCon[];
  userVote?: Vote;
  totalUpvotes: number;
  totalDownvotes: number;
  voteCount: number;
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