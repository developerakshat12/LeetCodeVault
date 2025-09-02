import { type User, type InsertUser, type Topic, type InsertTopic, type Problem, type InsertProblem, type Solution, type InsertSolution, type Favorite, type InsertFavorite, type GitHubCode } from "@shared/schema";
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
  findProblemByLeetcodeId(leetcodeId: number): Promise<Problem | undefined>;
  findProblemByTitleSlug(titleSlug: string): Promise<Problem | undefined>;
  createProblem(problem: InsertProblem): Promise<Problem>;
  updateProblem(id: string, updates: Partial<Problem>): Promise<Problem | undefined>;
  deleteProblem(id: string): Promise<boolean>;
  getProblemsByTopic(topicId: string): Promise<Problem[]>;
  getProblemsByTopicName(topicName: string, userId?: string): Promise<Problem[]>;

  // Solution operations
  getSolutions(problemId: string, userId?: string): Promise<Solution[]>;
  getSolution(id: string): Promise<Solution | undefined>;
  createSolution(solution: InsertSolution): Promise<Solution>;
  updateSolution(id: string, updates: Partial<Solution>): Promise<Solution | undefined>;
  deleteSolution(id: string): Promise<boolean>;

  // Favorite operations
  addFavorite(userId: string, problemId: string): Promise<Favorite>;
  removeFavorite(userId: string, problemId: string): Promise<boolean>;
  getUserFavorites(userId: string): Promise<Problem[]>;
  isFavorited(userId: string, problemId: string): Promise<boolean>;

  // GitHub code operations
  saveGithubCode(userId: string, githubCode: GitHubCode): Promise<void>;
  getGithubCodes(userId: string, problemId?: string): Promise<GitHubCode[]>;
  hasCodeChanged(userId: string, problemId: string, language: string, contentHash: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private topics: Map<string, Topic>;
  private problems: Map<string, Problem>;
  private solutions: Map<string, Solution>;
  private favorites: Map<string, Favorite>;
  private githubCodes: Map<string, GitHubCode>;

  constructor() {
    this.users = new Map();
    this.topics = new Map();
    this.problems = new Map();
    this.solutions = new Map();
    this.favorites = new Map();
    this.githubCodes = new Map();

    // Initialize default topics
    this.initializeDefaultTopics();
  }

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

  // Check if a problem's tags match a topic
  private problemMatchesTopic(problem: Problem, topicName: string): boolean {
    if (!problem.tags || problem.tags.length === 0) return false;
    
    const tagVariations = this.getTagVariationsForTopic(topicName);
    const problemTags = problem.tags.map(tag => tag.toLowerCase());
    
    return tagVariations.some(variation => 
      problemTags.some(tag => 
        tag.includes(variation) || variation.includes(tag)
      )
    );
  }

  // Generic helper methods to reduce duplication
  private updateEntity<T>(map: Map<string, T>, id: string, updates: Partial<T>): T | undefined {
    const entity = map.get(id);
    if (!entity) return undefined;

    const updatedEntity = { ...entity, ...updates };
    map.set(id, updatedEntity);
    return updatedEntity;
  }

  private deleteEntity<T>(map: Map<string, T>, id: string): boolean {
    return map.delete(id);
  }

  private createEntity<T>(map: Map<string, T>, entity: T): T {
    map.set((entity as any).id, entity);
    return entity;
  }

  private initializeDefaultTopics() {
    const defaultTopics = [
      { name: "Array", description: "Linear data structures and manipulation techniques", color: "blue", icon: "grid" },
      { name: "String", description: "String manipulation and pattern matching", color: "purple", icon: "text" },
      { name: "Dynamic Programming", description: "Optimization problems and memoization", color: "green", icon: "chart" },
      { name: "Tree", description: "Binary trees, BST, and tree traversals", color: "orange", icon: "tree" },
      { name: "Graph", description: "Graph algorithms, DFS, BFS, shortest paths", color: "red", icon: "network" },
      { name: "Linked List", description: "Singly, doubly linked lists and operations", color: "cyan", icon: "link" },
      { name: "Hash Table", description: "Hash maps, sets, and hashing techniques", color: "pink", icon: "hash" },
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
        createdAt: new Date(),
        updatedAt: new Date(),
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
      username: insertUser.username,
      leetcodeUsername: insertUser.leetcodeUsername || null,
      totalSolved: insertUser.totalSolved || 0,
      easySolved: insertUser.easySolved || 0,
      mediumSolved: insertUser.mediumSolved || 0,
      hardSolved: insertUser.hardSolved || 0,
      lastFetchedAt: insertUser.lastFetchedAt || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return this.createEntity(this.users, user);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    return this.updateEntity(this.users, id, updates);
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
      isCustom: 0,
      userId: insertTopic.userId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return this.createEntity(this.topics, topic);
  }

  async updateTopic(id: string, updates: Partial<Topic>): Promise<Topic | undefined> {
    return this.updateEntity(this.topics, id, updates);
  }

  async deleteTopic(id: string): Promise<boolean> {
    return this.deleteEntity(this.topics, id);
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

  async findProblemByLeetcodeId(leetcodeId: number): Promise<Problem | undefined> {
    const problemsArray = Array.from(this.problems.values());
    return problemsArray.find(problem => problem.leetcodeId === leetcodeId);
  }

  async findProblemByTitleSlug(titleSlug: string): Promise<Problem | undefined> {
    const problemsArray = Array.from(this.problems.values());
    return problemsArray.find(problem => problem.titleSlug === titleSlug);
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
      tags: insertProblem.tags || null,
      userId: insertProblem.userId || null,
      topicId: insertProblem.topicId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return this.createEntity(this.problems, problem);
  }

  async updateProblem(id: string, updates: Partial<Problem>): Promise<Problem | undefined> {
    return this.updateEntity(this.problems, id, updates);
  }

  async deleteProblem(id: string): Promise<boolean> {
    return this.deleteEntity(this.problems, id);
  }

  async getProblemsByTopic(topicId: string): Promise<Problem[]> {
    return Array.from(this.problems.values()).filter(
      problem => problem.topicId === topicId
    );
  }

  async getProblemsByTopicName(topicName: string, userId?: string): Promise<Problem[]> {
    let problems = Array.from(this.problems.values());
    
    // Filter by user if specified
    if (userId) {
      problems = problems.filter(problem => problem.userId === userId);
    }
    
    // Filter problems that match this topic based on their tags
    return problems.filter(problem => this.problemMatchesTopic(problem, topicName));
  }

  // Solution operations
  async getSolutions(problemId: string, userId?: string): Promise<Solution[]> {
    return Array.from(this.solutions.values()).filter(
      solution => solution.problemId === problemId && (!userId || solution.userId === userId)
    );
  }

  async getSolution(id: string): Promise<Solution | undefined> {
    return this.solutions.get(id);
  }

  async createSolution(insertSolution: InsertSolution): Promise<Solution> {
    const id = randomUUID();
    const solution: Solution = { 
      ...insertSolution, 
      id,
      explanation: insertSolution.explanation || '',
      notes: insertSolution.notes || '',
      userId: insertSolution.userId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return this.createEntity(this.solutions, solution);
  }

  async updateSolution(id: string, updates: Partial<Solution>): Promise<Solution | undefined> {
    return this.updateEntity(this.solutions, id, updates);
  }

  async deleteSolution(id: string): Promise<boolean> {
    return this.deleteEntity(this.solutions, id);
  }

  // Favorite operations
  async addFavorite(userId: string, problemId: string): Promise<Favorite> {
    // Check if already favorited
    const existingFavorite = Array.from(this.favorites.values()).find(
      f => f.userId === userId && f.problemId === problemId
    );
    
    if (existingFavorite) {
      throw new Error('Problem already in favorites');
    }

    const id = randomUUID();
    const favorite: Favorite = {
      id,
      userId,
      problemId,
      createdAt: new Date(),
    };
    
    return this.createEntity(this.favorites, favorite);
  }

  async removeFavorite(userId: string, problemId: string): Promise<boolean> {
    const favorite = Array.from(this.favorites.values()).find(
      f => f.userId === userId && f.problemId === problemId
    );
    
    if (!favorite) {
      return false;
    }
    
    return this.deleteEntity(this.favorites, favorite.id);
  }

  async getUserFavorites(userId: string): Promise<Problem[]> {
    const userFavorites = Array.from(this.favorites.values())
      .filter(f => f.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Newest first
    
    const problemIds = userFavorites.map(f => f.problemId);
    const problems = problemIds
      .map(id => this.problems.get(id))
      .filter(Boolean) as Problem[];
    
    return problems;
  }

  async isFavorited(userId: string, problemId: string): Promise<boolean> {
    return Array.from(this.favorites.values()).some(
      f => f.userId === userId && f.problemId === problemId
    );
  }

  // GitHub code operations
  async saveGithubCode(userId: string, githubCode: GitHubCode): Promise<void> {
    const codeWithUser: GitHubCode = { ...githubCode, userId };
    this.githubCodes.set(codeWithUser.id, codeWithUser);
  }

  async getGithubCodes(userId: string, problemId?: string): Promise<GitHubCode[]> {
    let codes = Array.from(this.githubCodes.values()).filter(
      code => code.userId === userId
    );
    
    if (problemId) {
      codes = codes.filter(code => code.problemId === problemId);
    }
    
    return codes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async hasCodeChanged(userId: string, problemId: string, language: string, contentHash: string): Promise<boolean> {
    const existingCode = Array.from(this.githubCodes.values()).find(
      code => code.userId === userId && 
               code.problemId === problemId && 
               code.language === language && 
               code.contentHash === contentHash
    );
    return !existingCode; // Returns true if code has changed (no existing with same hash)
  }
}

export const storage = new MemStorage();