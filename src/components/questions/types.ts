export interface User {
  uid: number;
  username: string | null;
  email: string;
}

export interface ProCon {
  id: number;
  solutionId: number;
  userId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: User;
  upvotes: number;
  downvotes: number;
  voteCount: number;
  userVote: number | null;
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
  user: User;
  pros: ProCon[];
  cons: ProCon[];
  voteCount: number;
  userVote: number | null;
}

export interface Question {
  id: number;
  title: string;
  description: string;
  tags: string[];
  participantCount: number;
  allowedEmails: string[];
  owner: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  ownerEmail: string;
  ownerUsername: string | null;
  hasAccess?: boolean;
}

// API Response Types for processing server data
export interface ApiProConResponse {
  id: number;
  solutionId: number;
  userId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: User;
  upvotes: string | number;
  downvotes: string | number;
  voteCount: string | number;
  userVote: string | number | null;
}

export interface ApiSolutionResponse {
  id: number;
  questionId: number;
  userId: number;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user: User;
  pros: ApiProConResponse[];
  cons: ApiProConResponse[];
  voteCount: string | number;
  userVote: string | number | null;
}
