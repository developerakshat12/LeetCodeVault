import dotenv from "dotenv";
import mongoose from 'mongoose';
import {
  UserModel, TopicModel, ProblemModel, SolutionModel, FavoriteModel, GitHubCodeModel,
  type User, type InsertUser,
  type Topic, type InsertTopic,
  type Problem, type InsertProblem,
  type Solution, type InsertSolution,
  type Favorite, type InsertFavorite,
  type GitHubCode
} from "@shared/schema";
import { IStorage } from "./storage";

dotenv.config();

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is required");
}

// MongoDB connection
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI!);
      console.log('MongoDB connected successfully');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Initialize connection
connectDB();

export class MongoStorage implements IStorage {

  // Helper function to map topic names to possible tag variations
  private getTagVariationsForTopic(topicName: string): string[] {
    const variations: { [key: string]: string[] } = {
      'Array': ['array', 'arrays'],
      'String': ['string', 'strings'],
      'Dynamic Programming': ['dynamic-programming', 'dp', 'dynamic programming'],
      'Tree': ['tree', 'trees', 'binary-tree', 'binary tree'],
      'Graph': ['graph', 'graphs'],
      'Linked List': ['linked-list', 'linked list'],
      'Hash Table': ['hash-table', 'hash table', 'hashtable', 'hashmap', 'hash map'],
      'Stack & Queue': ['stack', 'queue', 'stacks', 'queues'],
      'Two Pointers': ['two-pointers', 'two pointers'],
      'Binary Search': ['binary-search', 'binary search'],
      'Sliding Window': ['sliding-window', 'sliding window'],
      'Backtracking': ['backtracking'],
      'Greedy': ['greedy'],
      'Math': ['math', 'mathematics'],
      'Bit Manipulation': ['bit-manipulation', 'bit manipulation', 'bitwise'],
      'Heap': ['heap', 'priority-queue', 'priority queue'],
      'Trie': ['trie'],
      'Union Find': ['union-find', 'union find', 'disjoint-set'],
      'Sorting': ['sorting', 'sort'],
      'Searching': ['searching', 'search'],
    };

    return variations[topicName] || [topicName.toLowerCase()];
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    try {
      const user = await UserModel.findById(id).lean();
      return user ? this.transformUser(user) : undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByLeetcodeUsername(leetcodeUsername: string): Promise<User | undefined> {
    try {
      const user = await UserModel.findOne({ leetcodeUsername }).lean();
      return user ? this.transformUser(user) : undefined;
    } catch (error) {
      console.error('Error getting user by leetcode username:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const user = new UserModel(insertUser);
      const savedUser = await user.save();
      return this.transformUser(savedUser.toObject());
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    try {
      const user = await UserModel.findByIdAndUpdate(id, updates, { new: true }).lean();
      if (user) {
        console.log("✅ User after transform:", this.transformUser(user));
      }
      return user ? this.transformUser(user) : undefined;
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  // Topic operations
  async getTopics(userId?: string): Promise<Topic[]> {
    try {
      let filter = {};
      if (userId) {
        // Show user's custom topics and default topics
        filter = { $or: [{ userId, isCustom: 1 }, { isCustom: 0 }] };
      } else {
        // Show only default topics
        filter = { isCustom: 0 };
      }
      const topics = await TopicModel.find(filter).lean();
      return topics.map(topic => this.transformTopic(topic));
    } catch (error) {
      console.error('Error getting topics:', error);
      return [];
    }
  }

  async getTopic(id: string): Promise<Topic | undefined> {
    try {
      const topic = await TopicModel.findById(id).lean();
      return topic ? this.transformTopic(topic) : undefined;
    } catch (error) {
      console.error('Error getting topic:', error);
      return undefined;
    }
  }

  async createTopic(insertTopic: InsertTopic): Promise<Topic> {
    try {
      const topic = new TopicModel(insertTopic);
      const savedTopic = await topic.save();
      return this.transformTopic(savedTopic.toObject());
    } catch (error) {
      console.error('Error creating topic:', error);
      throw error;
    }
  }

  async updateTopic(id: string, updates: Partial<Topic>): Promise<Topic | undefined> {
    try {
      const topic = await TopicModel.findByIdAndUpdate(id, updates, { new: true }).lean();
      return topic ? this.transformTopic(topic) : undefined;
    } catch (error) {
      console.error('Error updating topic:', error);
      return undefined;
    }
  }

  async deleteTopic(id: string): Promise<boolean> {
    try {
      const result = await TopicModel.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      console.error('Error deleting topic:', error);
      return false;
    }
  }

  // Problem operations
  async getProblems(userId?: string, topicId?: string): Promise<Problem[]> {
    try {
      const filter: any = {};
      if (userId) filter.userId = userId;
      if (topicId) filter.topicId = topicId;

      const problems = await ProblemModel.find(filter).lean();
      return problems.map(problem => this.transformProblem(problem));
    } catch (error) {
      console.error('Error getting problems:', error);
      return [];
    }
  }

  async getProblem(id: string): Promise<Problem | undefined> {
    try {
      const problem = await ProblemModel.findById(id).lean();
      return problem ? this.transformProblem(problem) : undefined;
    } catch (error) {
      console.error('Error getting problem:', error);
      return undefined;
    }
  }

  async findProblemByLeetcodeId(leetcodeId: number): Promise<Problem | undefined> {
    try {
      const problem = await ProblemModel.findOne({ leetcodeId }).lean();
      return problem ? this.transformProblem(problem) : undefined;
    } catch (error) {
      console.error('Error finding problem by leetcode ID:', error);
      return undefined;
    }
  }

  async findProblemByTitleSlug(titleSlug: string): Promise<Problem | undefined> {
    try {
      const problem = await ProblemModel.findOne({ titleSlug }).lean();
      return problem ? this.transformProblem(problem) : undefined;
    } catch (error) {
      console.error('Error finding problem by title slug:', error);
      return undefined;
    }
  }

  async createProblem(insertProblem: InsertProblem): Promise<Problem> {
    try {
      const problem = new ProblemModel(insertProblem);
      const savedProblem = await problem.save();
      return this.transformProblem(savedProblem.toObject());
    } catch (error) {
      console.error('Error creating problem:', error);
      throw error;
    }
  }

  async updateProblem(id: string, updates: Partial<Problem>): Promise<Problem | undefined> {
    try {
      const problem = await ProblemModel.findByIdAndUpdate(id, updates, { new: true }).lean();
      return problem ? this.transformProblem(problem) : undefined;
    } catch (error) {
      console.error('Error updating problem:', error);
      return undefined;
    }
  }

  async deleteProblem(id: string): Promise<boolean> {
    try {
      const result = await ProblemModel.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      console.error('Error deleting problem:', error);
      return false;
    }
  }

  async getProblemsByTopic(topicId: string): Promise<Problem[]> {
    try {
      const problems = await ProblemModel.find({ topicId }).lean();
      return problems.map(problem => this.transformProblem(problem));
    } catch (error) {
      console.error('Error getting problems by topic:', error);
      return [];
    }
  }

  async getProblemsByTopicName(topicName: string, userId?: string): Promise<Problem[]> {
    try {
      const filter: any = {};
      if (userId) filter.userId = userId;

      // Get tag variations for this topic
      const tagVariations = this.getTagVariationsForTopic(topicName);

      // Create regex patterns for flexible matching
      const regexPatterns = tagVariations.map(variation => new RegExp(variation, 'i'));

      // Use MongoDB $in with regex to match any of the tag variations
      filter.tags = { $in: regexPatterns };

      const problems = await ProblemModel.find(filter).lean();
      return problems.map(problem => this.transformProblem(problem));
    } catch (error) {
      console.error('Error getting problems by topic name:', error);
      return [];
    }
  }

  private transformUser(user: any): User {
    return {
      id: user._id.toString(),
      username: user.username,
      leetcodeUsername: user.leetcodeUsername ?? null,
      totalSolved: user.totalSolved ?? null,
      easySolved: user.easySolved ?? null,
      mediumSolved: user.mediumSolved ?? null,
      hardSolved: user.hardSolved ?? null,
      lastFetchedAt: user.lastFetchedAt ?? null,
      githubRepoUrl: user.githubRepoUrl ?? null,
      githubToken: user.githubToken ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private transformTopic(topic: any): Topic {
    return {
      id: topic._id.toString(),
      name: topic.name,
      description: topic.description,
      color: topic.color,
      icon: topic.icon,
      isCustom: topic.isCustom,
      userId: topic.userId,
      createdAt: topic.createdAt,
      updatedAt: topic.updatedAt,
    };
  }

  private transformProblem(problem: any): Problem {
    return {
      id: problem._id.toString(),
      leetcodeId: problem.leetcodeId,
      title: problem.title,
      titleSlug: problem.titleSlug,
      difficulty: problem.difficulty,
      tags: problem.tags,
      description: problem.description,
      submissionDate: problem.submissionDate,
      language: problem.language,
      code: problem.code,
      userId: problem.userId,
      topicId: problem.topicId,
      createdAt: problem.createdAt,
      updatedAt: problem.updatedAt,
    };
  }

  // Solution operations
  async getSolutions(problemId: string, userId?: string): Promise<Solution[]> {
    try {
      const query: any = { problemId };
      if (userId) {
        query.userId = userId;
      }

      const solutions = await SolutionModel.find(query).sort({ createdAt: -1 });
      return solutions.map(this.transformSolution);
    } catch (error) {
      console.error('Error fetching solutions:', error);
      return [];
    }
  }

  async getSolution(id: string): Promise<Solution | undefined> {
    try {
      const solution = await SolutionModel.findById(id);
      return solution ? this.transformSolution(solution) : undefined;
    } catch (error) {
      console.error('Error fetching solution:', error);
      return undefined;
    }
  }

  async createSolution(insertSolution: InsertSolution): Promise<Solution> {
    try {
      const solution = await SolutionModel.create(insertSolution);
      return this.transformSolution(solution);
    } catch (error) {
      console.error('Error creating solution:', error);
      throw error;
    }
  }

  async updateSolution(id: string, updates: Partial<Solution>): Promise<Solution | undefined> {
    try {
      const solution = await SolutionModel.findByIdAndUpdate(id, updates, { new: true });
      return solution ? this.transformSolution(solution) : undefined;
    } catch (error) {
      console.error('Error updating solution:', error);
      return undefined;
    }
  }

  async deleteSolution(id: string): Promise<boolean> {
    try {
      const result = await SolutionModel.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      console.error('Error deleting solution:', error);
      return false;
    }
  }

  private transformSolution(solution: any): Solution {
    return {
      id: solution._id.toString(),
      problemId: solution.problemId,
      name: solution.name,
      approach: solution.approach,
      timeComplexity: solution.timeComplexity,
      spaceComplexity: solution.spaceComplexity,
      explanation: solution.explanation,
      code: solution.code,
      language: solution.language,
      notes: solution.notes,
      userId: solution.userId,
      createdAt: solution.createdAt,
      updatedAt: solution.updatedAt,
    };
  }

  // Favorite operations
  async addFavorite(userId: string, problemId: string): Promise<Favorite> {
    try {
      const favorite = new FavoriteModel({ userId, problemId });
      await favorite.save();
      return this.transformFavorite(favorite.toObject());
    } catch (error: any) {
      if (error.code === 11000) { // Duplicate key error
        throw new Error('Problem already in favorites');
      }
      throw error;
    }
  }

  async removeFavorite(userId: string, problemId: string): Promise<boolean> {
    try {
      const result = await FavoriteModel.deleteOne({ userId, problemId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error removing favorite:', error);
      return false;
    }
  }

  async getUserFavorites(userId: string): Promise<Problem[]> {
    try {
      const favorites = await FavoriteModel.find({ userId }).sort({ createdAt: -1 }).lean();
      const problemIds = favorites.map(f => f.problemId);

      const problems = await ProblemModel.find({ _id: { $in: problemIds } }).lean();

      // Maintain the order from favorites (newest first)
      const problemMap = new Map(problems.map(p => [p._id.toString(), p]));
      return problemIds
        .map(id => problemMap.get(id))
        .filter(Boolean)
        .map(p => this.transformProblem(p));
    } catch (error) {
      console.error('Error getting user favorites:', error);
      return [];
    }
  }

  async isFavorited(userId: string, problemId: string): Promise<boolean> {
    try {
      const count = await FavoriteModel.countDocuments({ userId, problemId });
      return count > 0;
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  }

  // GitHub code operations
  async saveGithubCode(userId: string, githubCode: GitHubCode): Promise<void> {
    try {
      const codeDoc = new GitHubCodeModel({
        ...githubCode,
        userId,
      });
      await codeDoc.save();
    } catch (error) {
      console.error('Error saving GitHub code:', error);
      throw error;
    }
  }

  async getGithubCodes(userId: string, problemId?: string): Promise<GitHubCode[]> {
    try {
      const filter: any = { userId };
      if (problemId) {
        filter.problemId = problemId;
      }

      const codes = await GitHubCodeModel.find(filter).sort({ createdAt: -1 }).lean();
      return codes.map(code => this.transformGithubCode(code));
    } catch (error) {
      console.error('Error getting GitHub codes:', error);
      return [];
    }
  }

  async hasCodeChanged(userId: string, problemId: string, language: string, contentHash: string): Promise<boolean> {
    try {
      const existing = await GitHubCodeModel.findOne({
        userId,
        problemId,
        language,
        contentHash,
      });
      return !existing; // Returns true if code has changed (no existing with same hash)
    } catch (error) {
      console.error('Error checking code changes:', error);
      return true; // Assume changed on error
    }
  }

  private transformGithubCode(code: any): GitHubCode {
    return {
      id: code._id.toString(),
      userId: code.userId,
      problemId: code.problemId,
      language: code.language,
      code: code.code,
      fileName: code.fileName,
      contentHash: code.contentHash,
      createdAt: code.createdAt,
    };
  }

  private transformFavorite(favorite: any): Favorite {
    return {
      id: favorite._id.toString(),
      userId: favorite.userId,
      problemId: favorite.problemId,
      createdAt: favorite.createdAt,
    };
  }
}

export const storage = new MongoStorage();
