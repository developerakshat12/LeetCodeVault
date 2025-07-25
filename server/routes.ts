import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertTopicSchema, insertProblemSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/leetcode/:username", async (req, res) => {
    try {
      const user = await storage.getUserByLeetcodeUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // LeetCode data fetching route
  app.post("/api/fetch-leetcode-data", async (req, res) => {
    try {
      const { username } = req.body;
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }

      // Fetch user profile from LeetCode Stats API
      const profileResponse = await fetch(`https://leetcode-stats-api.herokuapp.com/${username}`);
      if (!profileResponse.ok) {
        return res.status(404).json({ message: "LeetCode user not found" });
      }
      const profileData = await profileResponse.json();
      
      if (profileData.status !== "success") {
        return res.status(404).json({ message: "LeetCode user not found" });
      }

      // For now, we'll create sample problems since we don't have submission details from this API
      // In a real app, you'd want to use LeetCode's GraphQL API with authentication for submission details
      const sampleProblems = [
        { title: "Two Sum", titleSlug: "two-sum", difficulty: "Easy", language: "JavaScript", topicTags: ["Array", "Hash Table"] },
        { title: "Add Two Numbers", titleSlug: "add-two-numbers", difficulty: "Medium", language: "Python", topicTags: ["Linked List", "Math"] },
        { title: "Longest Substring", titleSlug: "longest-substring-without-repeating-characters", difficulty: "Medium", language: "Java", topicTags: ["Hash Table", "String"] },
        { title: "Median of Two Sorted Arrays", titleSlug: "median-of-two-sorted-arrays", difficulty: "Hard", language: "C++", topicTags: ["Array", "Binary Search"] },
        { title: "Valid Parentheses", titleSlug: "valid-parentheses", difficulty: "Easy", language: "Python", topicTags: ["String", "Stack"] }
      ];

      // Find or create user
      let user = await storage.getUserByLeetcodeUsername(username);
      if (!user) {
        user = await storage.createUser({
          username: username,
          leetcodeUsername: username,
          totalSolved: profileData.totalSolved || 0,
          easySolved: profileData.easySolved || 0,
          mediumSolved: profileData.mediumSolved || 0,
          hardSolved: profileData.hardSolved || 0,
          lastFetchedAt: new Date().toISOString(),
        });
      } else {
        user = await storage.updateUser(user.id, {
          totalSolved: profileData.totalSolved || 0,
          easySolved: profileData.easySolved || 0,
          mediumSolved: profileData.mediumSolved || 0,
          hardSolved: profileData.hardSolved || 0,
          lastFetchedAt: new Date().toISOString(),
        }) || user;
      }

      // Process sample problems and categorize by topics
      const topics = await storage.getTopics();

      for (const problem of sampleProblems) {
        // Determine topic based on problem tags or title
        const topic = categorizeSubmission(problem, topics);
        
        if (topic) {
          // Check if problem already exists
          const existingProblems = await storage.getProblems(user.id);
          const existingProblem = existingProblems.find(p => p.titleSlug === problem.titleSlug);
          
          if (!existingProblem) {
            await storage.createProblem({
              leetcodeId: Math.floor(Math.random() * 1000),
              title: problem.title,
              titleSlug: problem.titleSlug,
              difficulty: problem.difficulty,
              tags: problem.topicTags || [],
              submissionDate: new Date().toISOString(),
              language: problem.language,
              code: `// Sample ${problem.language} solution for ${problem.title}`,
              runtime: "100ms",
              memory: "40MB",
              userId: user.id,
              topicId: topic.id,
            });
          }
        }
      }

      res.json({ 
        user, 
        message: "LeetCode data fetched successfully",
        problemsProcessed: sampleProblems.length 
      });
    } catch (error) {
      console.error("Error fetching LeetCode data:", error);
      res.status(500).json({ message: "Failed to fetch LeetCode data" });
    }
  });

  // Topic routes
  app.get("/api/topics", async (req, res) => {
    try {
      const { userId } = req.query;
      const topics = await storage.getTopics(userId as string);
      
      // Get problem counts for each topic
      const topicsWithCounts = await Promise.all(
        topics.map(async (topic) => {
          const problems = await storage.getProblemsByTopic(topic.id);
          const easy = problems.filter(p => p.difficulty === "Easy").length;
          const medium = problems.filter(p => p.difficulty === "Medium").length;
          const hard = problems.filter(p => p.difficulty === "Hard").length;
          
          return {
            ...topic,
            totalProblems: problems.length,
            easy,
            medium,
            hard,
          };
        })
      );
      
      res.json(topicsWithCounts);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/topics", async (req, res) => {
    try {
      const topicData = insertTopicSchema.parse(req.body);
      const topic = await storage.createTopic(topicData);
      res.status(201).json(topic);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid topic data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/topics/:id", async (req, res) => {
    try {
      const success = await storage.deleteTopic(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Topic not found" });
      }
      res.json({ message: "Topic deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Problem routes
  app.get("/api/problems", async (req, res) => {
    try {
      const { userId, topicId } = req.query;
      const problems = await storage.getProblems(userId as string, topicId as string);
      res.json(problems);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/problems/topic/:topicId", async (req, res) => {
    try {
      const problems = await storage.getProblemsByTopic(req.params.topicId);
      res.json(problems);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to categorize submissions into topics
function categorizeSubmission(submission: any, topics: any[]) {
  const title = submission.title?.toLowerCase() || "";
  const tags = submission.topicTags || [];
  
  // Define topic keywords
  const topicKeywords = {
    "Arrays": ["array", "two sum", "sorted array"],
    "Strings": ["string", "substring", "palindrome", "anagram"],
    "Dynamic Programming": ["dp", "dynamic", "fibonacci", "knapsack", "coin"],
    "Trees": ["tree", "binary tree", "bst", "traversal"],
    "Graphs": ["graph", "dfs", "bfs", "shortest path", "cycle"],
    "Linked Lists": ["linked list", "node", "pointer"],
    "Hash Tables": ["hash", "map", "set", "frequency"],
    "Stack & Queue": ["stack", "queue", "parentheses", "bracket"]
  };
  
  // Try to match by tags first
  for (const tag of tags) {
    for (const [topicName, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => tag.toLowerCase().includes(keyword))) {
        return topics.find(t => t.name === topicName);
      }
    }
  }
  
  // Try to match by title
  for (const [topicName, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(keyword => title.includes(keyword))) {
      return topics.find(t => t.name === topicName);
    }
  }
  
  // Default to Arrays if no match found
  return topics.find(t => t.name === "Arrays");
}
