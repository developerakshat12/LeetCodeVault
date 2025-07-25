import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertTopicSchema, insertProblemSchema } from "@shared/schema";
import { z } from "zod";
import { LeetCodeGraphQLAPI } from "./leetcode-api";

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
      console.log("📡 Starting LeetCode data fetch for username:", username);
      
      if (!username) {
        console.log("❌ No username provided");
        return res.status(400).json({ message: "Username is required" });
      }

      // Initialize LeetCode GraphQL API client
      console.log("🔍 Initializing LeetCode GraphQL API client...");
      const leetcodeAPI = new LeetCodeGraphQLAPI();
      
      // Fetch user profile
      console.log("🔍 Fetching user profile...");
      const profileData = await leetcodeAPI.getUserProfile(username);
      
      if (!profileData) {
        console.log("❌ User not found");
        return res.status(404).json({ message: "LeetCode user not found" });
      }
      
      console.log("✅ Profile data fetched:", JSON.stringify(profileData, null, 2));

      // Fetch recent accepted submissions with code
      console.log("🔍 Fetching recent accepted submissions...");
      const submissions = await leetcodeAPI.getRecentSubmissions(username, 20);
      console.log("✅ Submissions data fetched. Total submissions:", submissions?.length || 0);
      
      // Log complete submission data with code for debugging
      console.log("📊 Complete submission data with code:", JSON.stringify(submissions, null, 2));

      // Find or create user
      console.log("👤 Finding or creating user...");
      let user = await storage.getUserByLeetcodeUsername(username);
      
      const userStats = {
        username: username,
        leetcodeUsername: username,
        totalSolved: profileData.totalSolved,
        easySolved: profileData.easySolved,
        mediumSolved: profileData.mediumSolved,
        hardSolved: profileData.hardSolved,
        lastFetchedAt: new Date().toISOString(),
      };
      
      if (!user) {
        console.log("🆕 Creating new user with stats:", userStats);
        user = await storage.createUser(userStats);
      } else {
        console.log("🔄 Updating existing user with stats:", userStats);
        user = await storage.updateUser(user.id, userStats) || user;
      }
      console.log("👤 User ready:", { id: user.id, username: user.username });

      // Get topics for categorization
      console.log("📂 Fetching topics for categorization...");
      const topics = await storage.getTopics();
      console.log("📂 Available topics:", topics.map(t => ({ id: t.id, name: t.name })));

      // Process real submissions
      console.log("🔄 Processing submissions...");
      const existingProblems = await storage.getProblems(user.id);
      console.log("📋 Existing problems count:", existingProblems.length);
      
      let processedCount = 0;
      let skippedCount = 0;
      
      if (!submissions || submissions.length === 0) {
        console.log("⚠️ No submissions found for user");
        return res.json({ 
          user, 
          message: "User found but no submissions available",
          totalSubmissions: 0,
          problemsProcessed: 0,
          problemsSkipped: 0
        });
      }
      
      for (let i = 0; i < submissions.length; i++) {
        const submission = submissions[i];
        
        // Only process accepted submissions
        if (submission.statusDisplay !== "Accepted") {
          continue;
        }
        
        console.log(`\n🔍 Processing submission ${i + 1}/${submissions.length}:`, {
          title: submission.title,
          titleSlug: submission.titleSlug,
          statusDisplay: submission.statusDisplay,
          lang: submission.lang,
          timestamp: submission.timestamp
        });

        // Check if problem already exists
        const existingProblem = existingProblems.find(p => p.titleSlug === submission.titleSlug);
        
        if (existingProblem) {
          console.log("⏭️  Problem already exists, skipping:", submission.titleSlug);
          skippedCount++;
          continue;
        }

        // Use the data we already have from our GraphQL API
        const problemData = {
          title: submission.title.toLowerCase(),
          tags: submission.topicTags || []
        };

        // Determine topic based on problem tags or title
        console.log("🏷️  Categorizing problem:", submission.topicTags);
        const topic = categorizeSubmission(problemData, topics);
        
        if (topic) {
          console.log("✅ Assigned to topic:", topic.name);
          
          try {
            const newProblem = await storage.createProblem({
              leetcodeId: parseInt(submission.id) || Math.floor(Math.random() * 100000),
              title: submission.title,
              titleSlug: submission.titleSlug,
              difficulty: submission.difficulty || "Medium",
              tags: submission.topicTags || [],
              submissionDate: submission.timestamp ? new Date(parseInt(submission.timestamp) * 1000).toISOString() : new Date().toISOString(),
              language: submission.lang,
              code: submission.code || `// ${submission.lang} solution for ${submission.title}`,
              runtime: submission.runtime || "N/A",
              memory: submission.memory || "N/A",
              userId: user.id,
              topicId: topic.id,
            });
            
            console.log("✅ Problem created successfully:", newProblem.id);
            processedCount++;
          } catch (createError) {
            console.log("❌ Error creating problem:", createError);
          }
        } else {
          console.log("⚠️ No suitable topic found, skipping problem");
          skippedCount++;
        }
      }
      
      console.log(`\n📊 Processing complete:
        - Total submissions: ${submissions.length}
        - New problems created: ${processedCount}
        - Skipped (duplicates/no topic): ${skippedCount}`);
      
      res.json({ 
        user, 
        message: "LeetCode data fetched successfully",
        totalSubmissions: submissions.length,
        problemsProcessed: processedCount,
        problemsSkipped: skippedCount
      });
    } catch (error) {
      console.error("💥 Error fetching LeetCode data:", error);
      console.error("Stack trace:", error.stack);
      res.status(500).json({ message: "Failed to fetch LeetCode data", error: error.message });
    }
  });

  // Topic routes
  app.get("/api/topics", async (req, res) => {
    try {
      const { userId } = req.query;
      const topics = await storage.getTopics(userId as string || undefined);
      
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

  app.get("/api/problems/:problemId", async (req, res) => {
    try {
      const problem = await storage.getProblem(req.params.problemId);
      if (!problem) {
        return res.status(404).json({ message: "Problem not found" });
      }
      res.json(problem);
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
  const tags = submission.tags || [];
  
  console.log("🏷️  Categorizing submission:", { title, tags });
  
  // Try to match by LeetCode tags first (most accurate)
  for (const tag of tags) {
    const tagLower = tag.toLowerCase();
    console.log("🔍 Checking tag:", tagLower);
    
    // Direct topic name matching
    if (tagLower.includes('array')) {
      const arraysTopic = topics.find(t => t.name === "Arrays");
      if (arraysTopic) {
        console.log("✅ Matched by tag: Array ->", arraysTopic.name);
        return arraysTopic;
      }
    }
    
    if (tagLower.includes('string')) {
      const stringsTopic = topics.find(t => t.name === "Strings");
      if (stringsTopic) {
        console.log("✅ Matched by tag: String ->", stringsTopic.name);
        return stringsTopic;
      }
    }
    
    if (tagLower.includes('hash') || tagLower.includes('map')) {
      const hashTopic = topics.find(t => t.name === "Hash Tables");
      if (hashTopic) {
        console.log("✅ Matched by tag: Hash ->", hashTopic.name);
        return hashTopic;
      }
    }
    
    if (tagLower.includes('tree')) {
      const treeTopic = topics.find(t => t.name === "Trees");
      if (treeTopic) {
        console.log("✅ Matched by tag: Tree ->", treeTopic.name);
        return treeTopic;
      }
    }
    
    if (tagLower.includes('dynamic') || tagLower.includes('dp')) {
      const dpTopic = topics.find(t => t.name === "Dynamic Programming");
      if (dpTopic) {
        console.log("✅ Matched by tag: DP ->", dpTopic.name);
        return dpTopic;
      }
    }
    
    if (tagLower.includes('pointer')) {
      const stringsTopic = topics.find(t => t.name === "Strings");
      if (stringsTopic) {
        console.log("✅ Matched by tag: Two Pointers -> Strings");
        return stringsTopic;
      }
    }
    
    if (tagLower.includes('window')) {
      const arraysTopic = topics.find(t => t.name === "Arrays");
      if (arraysTopic) {
        console.log("✅ Matched by tag: Sliding Window -> Arrays");
        return arraysTopic;
      }
    }
  }
  
  // Try to match by title keywords
  console.log("🔍 Checking title keywords for:", title);
  if (title.includes('array') || title.includes('sum')) {
    const arraysTopic = topics.find(t => t.name === "Arrays");
    if (arraysTopic) {
      console.log("✅ Matched by title: Arrays");
      return arraysTopic;
    }
  }
  
  if (title.includes('string') || title.includes('palindrome')) {
    const stringsTopic = topics.find(t => t.name === "Strings");
    if (stringsTopic) {
      console.log("✅ Matched by title: Strings");
      return stringsTopic;
    }
  }
  
  // Default to Arrays if no match found
  const defaultTopic = topics.find(t => t.name === "Arrays");
  console.log("⚠️ No specific match found, defaulting to:", defaultTopic?.name || "Arrays");
  return defaultTopic;
}
