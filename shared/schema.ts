import mongoose, { Schema, Document } from 'mongoose';
import { z } from 'zod';

// User Schema
export interface IUser extends Document {
  _id: string;
  username: string;
  leetcodeUsername?: string;
  totalSolved?: number;
  easySolved?: number;
  mediumSolved?: number;
  hardSolved?: number;
  lastFetchedAt?: Date;
  githubRepoUrl?: string;
  githubToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  leetcodeUsername: { type: String, default: null },
  totalSolved: { type: Number, default: 0 },
  easySolved: { type: Number, default: 0 },
  mediumSolved: { type: Number, default: 0 },
  hardSolved: { type: Number, default: 0 },
  lastFetchedAt: { type: Date, default: null },
  githubRepoUrl: { type: String, default: null },
  githubToken: { type: String, default: null },
}, {
  timestamps: true,
  toJSON: { 
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete (ret as any)._id;
      delete (ret as any).__v;
      return ret;
    }
  }
});

// Topic Schema
export interface ITopic extends Document {
  _id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  isCustom: number;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const topicSchema = new Schema<ITopic>({
  name: { type: String, required: true },
  description: { type: String, default: null },
  color: { type: String, default: 'blue' },
  icon: { type: String, default: null },
  isCustom: { type: Number, default: 0 },
  userId: { type: String, default: null },
}, {
  timestamps: true,
  toJSON: { 
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete (ret as any)._id;
      delete (ret as any).__v;
      return ret;
    }
  }
});

// Problem Schema
export interface IProblem extends Document {
  _id: string;
  leetcodeId: number;
  title: string;
  titleSlug: string;
  difficulty: string;
  tags?: string[];
  description?: string;
  submissionDate?: Date;
  language?: string;
  code?: string;
  userId?: string;
  topicId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const problemSchema = new Schema<IProblem>({
  leetcodeId: { type: Number, required: true },
  title: { type: String, required: true },
  titleSlug: { type: String, required: true },
  difficulty: { type: String, required: true },
  tags: [{ type: String }],
  description: { type: String, default: null },
  submissionDate: { type: Date, default: null },
  language: { type: String, default: null },
  code: { type: String, default: null },
  userId: { type: String, default: null },
  topicId: { type: String, default: null },
}, {
  timestamps: true,
  toJSON: { 
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete (ret as any)._id;
      delete (ret as any).__v;
      return ret;
    }
  }
});

// Create Models
export const UserModel = mongoose.model<IUser>('User', userSchema);
export const TopicModel = mongoose.model<ITopic>('Topic', topicSchema);
export const ProblemModel = mongoose.model<IProblem>('Problem', problemSchema);

// Zod Validation Schemas
export const insertUserSchema = z.object({
  username: z.string().min(1),
  leetcodeUsername: z.string().optional(),
  totalSolved: z.number().optional(),
  easySolved: z.number().optional(),
  mediumSolved: z.number().optional(),
  hardSolved: z.number().optional(),
  lastFetchedAt: z.date().optional(),
  githubRepoUrl: z.string().optional(),
  githubToken: z.string().optional(),
});

export const insertTopicSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  isCustom: z.number().optional(),
  userId: z.string().optional(),
});

export const insertProblemSchema = z.object({
  leetcodeId: z.number(),
  title: z.string().min(1),
  titleSlug: z.string().min(1),
  difficulty: z.string().min(1),
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
  submissionDate: z.date().optional(),
  language: z.string().optional(),
  code: z.string().optional(),
  userId: z.string().optional(),
  topicId: z.string().optional(),
});

// Type exports
export type User = {
  id: string;
  username: string;
  leetcodeUsername?: string | null;
  totalSolved?: number | null;
  easySolved?: number | null;
  mediumSolved?: number | null;
  hardSolved?: number | null;
  lastFetchedAt?: Date | null;
  githubRepoUrl?: string | null;
  githubToken?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type InsertUser = z.infer<typeof insertUserSchema>;

export type Topic = {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  icon?: string | null;
  isCustom: number;
  userId?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type InsertTopic = z.infer<typeof insertTopicSchema>;

export type Problem = {
  id: string;
  leetcodeId: number;
  title: string;
  titleSlug: string;
  difficulty: string;
  tags?: string[] | null;
  description?: string | null;
  submissionDate?: Date | null;
  language?: string | null;
  code?: string | null;
  runtime?: string;
  userId?: string | null;
  topicId?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type InsertProblem = z.infer<typeof insertProblemSchema>;

// Solution interface for storing multiple solutions per problem
export interface ISolution {
  id: string;
  problemId: string;
  name: string;
  approach: string;
  timeComplexity: string;
  spaceComplexity: string;
  explanation: string;
  code: string;
  language: string;
  notes: string;
  userId?: string;
  isFromGitHub?: boolean;
  githubFileName?: string;
  githubFolderName?: string;
  submissionDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const solutionSchema = new Schema<ISolution>({
  problemId: { type: String, required: true },
  name: { type: String, required: true },
  approach: { type: String, required: true },
  timeComplexity: { type: String, required: true },
  spaceComplexity: { type: String, required: true },
  explanation: { type: String, default: '' },
  code: { type: String, required: true },
  language: { type: String, required: true },
  notes: { type: String, default: '' },
  userId: { type: String, default: null },
  isFromGitHub: { type: Boolean, default: false },
  githubFileName: { type: String, default: null },
  githubFolderName: { type: String, default: null },
  submissionDate: { type: Date, default: null },
}, {
  timestamps: true,
  toJSON: { 
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete (ret as any)._id;
      delete (ret as any).__v;
      return ret;
    }
  }
});

export const SolutionModel = mongoose.model<ISolution>('Solution', solutionSchema);

// Favorite Schema
export interface IFavorite extends Document {
  _id: string;
  userId: string;
  problemId: string;
  createdAt: Date;
}

const favoriteSchema = new Schema<IFavorite>({
  userId: { type: String, required: true, index: true },
  problemId: { type: String, required: true, index: true },
}, {
  timestamps: { createdAt: true, updatedAt: false },
  toJSON: { 
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete (ret as any)._id;
      delete (ret as any).__v;
      return ret;
    }
  }
});

// Compound index to prevent duplicates and optimize queries
favoriteSchema.index({ userId: 1, problemId: 1 }, { unique: true });

export const FavoriteModel = mongoose.model<IFavorite>('Favorite', favoriteSchema);

// GitHub Code Schema
export interface IGitHubCode extends Document {
  _id: string;
  userId: string;
  problemId: string;
  language: string;
  code: string;
  fileName: string;
  contentHash: string;
  createdAt: Date;
}

const githubCodeSchema = new Schema<IGitHubCode>({
  userId: { type: String, required: true, index: true },
  problemId: { type: String, required: true, index: true },
  language: { type: String, required: true },
  code: { type: String, required: true },
  fileName: { type: String, required: true },
  contentHash: { type: String, required: true },
}, {
  timestamps: { createdAt: true, updatedAt: false },
  toJSON: { 
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete (ret as any)._id;
      delete (ret as any).__v;
      return ret;
    }
  }
});

githubCodeSchema.index({ userId: 1, problemId: 1, language: 1 });
export const GitHubCodeModel = mongoose.model<IGitHubCode>('GitHubCode', githubCodeSchema);

// Zod schemas for validation
export const insertSolutionSchema = z.object({
  problemId: z.string().min(1),
  name: z.string().min(1),
  approach: z.string().min(1),
  timeComplexity: z.string().min(1),
  spaceComplexity: z.string().min(1),
  explanation: z.string().optional(),
  code: z.string().min(1),
  language: z.string().min(1),
  notes: z.string().optional(),
  userId: z.string().optional(),
  isFromGitHub: z.boolean().optional(),
  githubFileName: z.string().optional(),
  githubFolderName: z.string().optional(),
  submissionDate: z.date().optional(),
});

export type Solution = {
  id: string;
  problemId: string;
  name: string;
  approach: string;
  timeComplexity: string;
  spaceComplexity: string;
  explanation?: string | null;
  code: string;
  language: string;
  notes?: string | null;
  userId?: string | null;
  isFromGitHub?: boolean | null;
  githubFileName?: string | null;
  githubFolderName?: string | null;
  submissionDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type InsertSolution = z.infer<typeof insertSolutionSchema>;

// Favorite types and validation
export const insertFavoriteSchema = z.object({
  userId: z.string().min(1),
  problemId: z.string().min(1),
});

export type Favorite = {
  id: string;
  userId: string;
  problemId: string;
  createdAt: Date;
};

export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;

// GitHub Code Schema for simple code extraction
export const insertGithubCodeSchema = z.object({
  id: z.string(),
  userId: z.string(),
  problemId: z.string(), // This will be the title slug for matching
  problemNumber: z.number().optional(), // The extracted problem number if available
  language: z.string(),
  code: z.string(),
  fileName: z.string(),
  folderName: z.string().optional(), // The original folder name from GitHub
  contentHash: z.string(),
  createdAt: z.date(),
});

export type GitHubCode = z.infer<typeof insertGithubCodeSchema>;
