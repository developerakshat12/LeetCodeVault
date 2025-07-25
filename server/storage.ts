import { type User, type InsertUser, type Topic, type InsertTopic, type Problem, type InsertProblem } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByLeetcodeUsername(leetcodeUsername: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  // Topic operations
  getTopics(userId?: string): Promise<Topic[]>;
  getTopic(id: string): Promise<Topic | undefined>;
  createTopic(topic: InsertTopic): Promise<Topic>;
  updateTopic(id: string, updates: Partial<Topic>): Promise<Topic | undefined>;
  deleteTopic(id: string): Promise<boolean>;
  
  // Problem operations
  getProblems(userId?: string, topicId?: string): Promise<Problem[]>;
  getProblem(id: string): Promise<Problem | undefined>;
  createProblem(problem: InsertProblem): Promise<Problem>;
  updateProblem(id: string, updates: Partial<Problem>): Promise<Problem | undefined>;
  deleteProblem(id: string): Promise<boolean>;
  getProblemsByTopic(topicId: string): Promise<Problem[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private topics: Map<string, Topic>;
  private problems: Map<string, Problem>;

  constructor() {
    this.users = new Map();
    this.topics = new Map();
    this.problems = new Map();
    
    // Initialize default topics
    this.initializeDefaultTopics();
  }

  private initializeDefaultTopics() {
    const defaultTopics = [
      { name: "Arrays", description: "Linear data structures and manipulation techniques", color: "blue", icon: "grid" },
      { name: "Strings", description: "String manipulation and pattern matching", color: "purple", icon: "text" },
      { name: "Dynamic Programming", description: "Optimization problems and memoization", color: "green", icon: "chart" },
      { name: "Trees", description: "Binary trees, BST, and tree traversals", color: "orange", icon: "tree" },
      { name: "Graphs", description: "Graph algorithms, DFS, BFS, shortest paths", color: "red", icon: "network" },
      { name: "Linked Lists", description: "Singly, doubly linked lists and operations", color: "cyan", icon: "link" },
      { name: "Hash Tables", description: "Hash maps, sets, and hashing techniques", color: "pink", icon: "hash" },
      { name: "Stack & Queue", description: "LIFO and FIFO data structure operations", color: "indigo", icon: "stack" },
    ];

    defaultTopics.forEach(topic => {
      const id = randomUUID();
      this.topics.set(id, {
        id,
        name: topic.name,
        description: topic.description,
        color: topic.color,
        icon: topic.icon,
        isCustom: 0,
        userId: null,
      });
    });
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByLeetcodeUsername(leetcodeUsername: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.leetcodeUsername === leetcodeUsername,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      leetcodeUsername: insertUser.leetcodeUsername || null,
      totalSolved: insertUser.totalSolved || null,
      easySolved: insertUser.easySolved || null,
      mediumSolved: insertUser.mediumSolved || null,
      hardSolved: insertUser.hardSolved || null,
      lastFetchedAt: insertUser.lastFetchedAt || null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Topic operations
  async getTopics(userId?: string): Promise<Topic[]> {
    return Array.from(this.topics.values()).filter(
      topic => !topic.userId || topic.userId === userId
    );
  }

  async getTopic(id: string): Promise<Topic | undefined> {
    return this.topics.get(id);
  }

  async createTopic(insertTopic: InsertTopic): Promise<Topic> {
    const id = randomUUID();
    const topic: Topic = { 
      ...insertTopic, 
      id,
      color: insertTopic.color || "blue",
      description: insertTopic.description || null,
      icon: insertTopic.icon || null,
      isCustom: insertTopic.isCustom || 0,
      userId: insertTopic.userId || null
    };
    this.topics.set(id, topic);
    return topic;
  }

  async updateTopic(id: string, updates: Partial<Topic>): Promise<Topic | undefined> {
    const topic = this.topics.get(id);
    if (!topic) return undefined;
    
    const updatedTopic = { ...topic, ...updates };
    this.topics.set(id, updatedTopic);
    return updatedTopic;
  }

  async deleteTopic(id: string): Promise<boolean> {
    return this.topics.delete(id);
  }

  // Problem operations
  async getProblems(userId?: string, topicId?: string): Promise<Problem[]> {
    let problems = Array.from(this.problems.values());
    
    if (userId) {
      problems = problems.filter(problem => problem.userId === userId);
    }
    
    if (topicId) {
      problems = problems.filter(problem => problem.topicId === topicId);
    }
    
    return problems;
  }

  async getProblem(id: string): Promise<Problem | undefined> {
    return this.problems.get(id);
  }

  async createProblem(insertProblem: InsertProblem): Promise<Problem> {
    const id = randomUUID();
    const problem: Problem = { 
      ...insertProblem, 
      id,
      description: insertProblem.description || null,
      submissionDate: insertProblem.submissionDate || null,
      language: insertProblem.language || null,
      code: insertProblem.code || null,
      runtime: insertProblem.runtime || null,
      memory: insertProblem.memory || null,
      tags: insertProblem.tags || null,
      userId: insertProblem.userId || null,
      topicId: insertProblem.topicId || null
    };
    this.problems.set(id, problem);
    return problem;
  }

  async updateProblem(id: string, updates: Partial<Problem>): Promise<Problem | undefined> {
    const problem = this.problems.get(id);
    if (!problem) return undefined;
    
    const updatedProblem = { ...problem, ...updates };
    this.problems.set(id, updatedProblem);
    return updatedProblem;
  }

  async deleteProblem(id: string): Promise<boolean> {
    return this.problems.delete(id);
  }

  async getProblemsByTopic(topicId: string): Promise<Problem[]> {
    return Array.from(this.problems.values()).filter(
      problem => problem.topicId === topicId
    );
  }
}

export const storage = new MemStorage();
