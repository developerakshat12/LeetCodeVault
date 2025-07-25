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
      console.log("📡 Starting LeetCode data fetch for username:", username);
      
      if (!username) {
        console.log("❌ No username provided");
        return res.status(400).json({ message: "Username is required" });
      }

      // Fetch user profile from alfa-leetcode-api
      console.log("🔍 Fetching user profile from alfa-leetcode-api...");
      const profileResponse = await fetch(`https://alfa-leetcode-api.onrender.com/userProfile/${username}`);
      
      if (!profileResponse.ok) {
        console.log("❌ Profile fetch failed:", profileResponse.status, profileResponse.statusText);
        return res.status(404).json({ message: "LeetCode user not found" });
      }
      
      const profileData = await profileResponse.json();
      console.log("✅ Profile data fetched:", JSON.stringify(profileData, null, 2));

      // Fetch accepted submissions
      console.log("🔍 Fetching accepted submissions...");
      const submissionsResponse = await fetch(`https://alfa-leetcode-api.onrender.com/acSubmission/${username}?limit=100`);
      
      if (!submissionsResponse.ok) {
        console.log("❌ Submissions fetch failed:", submissionsResponse.status, submissionsResponse.statusText);
        return res.status(404).json({ message: "Failed to fetch submissions" });
      }
      
      const submissionsData = await submissionsResponse.json();
      console.log("✅ Submissions data fetched. Total submissions:", submissionsData.submission?.length || 0);
      
      const submissions = submissionsData.submission || [];
      console.log("📊 First few submissions:", JSON.stringify(submissions.slice(0, 3), null, 2));

      // Find or create user
      console.log("👤 Finding or creating user...");
      let user = await storage.getUserByLeetcodeUsername(username);
      
      const userStats = {
        username: username,
        leetcodeUsername: username,
        totalSolved: profileData.totalSolved || 0,
        easySolved: profileData.easySolved || 0,
        mediumSolved: profileData.mediumSolved || 0,
        hardSolved: profileData.hardSolved || 0,
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
      
      for (let i = 0; i < submissions.length; i++) {
        const submission = submissions[i];
        console.log(`\n🔍 Processing submission ${i + 1}/${submissions.length}:`, {
          title: submission.title,
          titleSlug: submission.titleSlug,
          difficulty: submission.difficulty,
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

        // Fetch additional problem details if needed
        let problemDetails = null;
        try {
          console.log("🔍 Fetching problem details for:", submission.titleSlug);
          const detailsResponse = await fetch(`https://alfa-leetcode-api.onrender.com/select?titleSlug=${submission.titleSlug}`);
          if (detailsResponse.ok) {
            problemDetails = await detailsResponse.json();
            console.log("✅ Problem details fetched:", {
              topicTags: problemDetails.topicTags?.map(tag => tag.name) || [],
              difficulty: problemDetails.difficulty
            });
          } else {
            console.log("⚠️ Failed to fetch problem details, using submission data only");
          }
        } catch (detailError) {
          console.log("⚠️ Error fetching problem details:", detailError.message);
        }

        // Prepare problem data
        const problemData = {
          title: submission.title,
          titleSlug: submission.titleSlug,
          difficulty: submission.difficulty || problemDetails?.difficulty || "Unknown",
          language: submission.lang,
          topicTags: problemDetails?.topicTags?.map(tag => tag.name) || [],
        };

        // Determine topic based on problem tags or title
        console.log("🏷️  Categorizing problem:", problemData.topicTags);
        const topic = categorizeSubmission(problemData, topics);
        
        if (topic) {
          console.log("✅ Assigned to topic:", topic.name);
          
          try {
            const newProblem = await storage.createProblem({
              leetcodeId: parseInt(submission.id) || Math.floor(Math.random() * 100000),
              title: submission.title,
              titleSlug: submission.titleSlug,
              difficulty: problemData.difficulty,
              tags: problemData.topicTags,
              submissionDate: submission.timestamp ? new Date(submission.timestamp * 1000).toISOString() : new Date().toISOString(),
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

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to categorize submissions into topics
function categorizeSubmission(submission: any, topics: any[]) {
  const title = submission.title?.toLowerCase() || "";
  const tags = submission.topicTags || [];
  
  console.log("🏷️  Categorizing submission:", { title, tags });
  
  // Define topic keywords with more comprehensive matching
  const topicKeywords = {
    "Arrays": ["array", "two sum", "sorted array", "subarray", "matrix", "grid"],
    "Strings": ["string", "substring", "palindrome", "anagram", "character", "word"],
    "Dynamic Programming": ["dp", "dynamic", "fibonacci", "knapsack", "coin", "subsequence", "subarray"],
    "Trees": ["tree", "binary tree", "bst", "traversal", "node", "root", "leaf"],
    "Graphs": ["graph", "dfs", "bfs", "shortest path", "cycle", "connected", "component"],
    "Linked Lists": ["linked list", "node", "pointer", "list node"],
    "Hash Tables": ["hash", "map", "set", "frequency", "count", "dictionary"],
    "Stack & Queue": ["stack", "queue", "parentheses", "bracket", "monotonic", "deque"],
    "Math": ["math", "number", "digit", "prime", "factorial", "gcd", "lcm"],
    "Binary Search": ["binary search", "search", "sorted", "target", "find"],
    "Two Pointers": ["two pointer", "left", "right", "slow", "fast"],
    "Sliding Window": ["sliding window", "window", "subarray", "substring"],
    "Backtracking": ["backtrack", "permutation", "combination", "generate", "all possible"],
    "Greedy": ["greedy", "maximum", "minimum", "optimal", "interval"]
  };
  
  // Try to match by LeetCode tags first (most accurate)
  for (const tag of tags) {
    const tagLower = tag.toLowerCase();
    console.log("🔍 Checking tag:", tagLower);
    
    for (const [topicName, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => tagLower.includes(keyword) || keyword.includes(tagLower))) {
        const matchedTopic = topics.find(t => t.name === topicName);
        if (matchedTopic) {
          console.log("✅ Matched by tag:", tag, "->", topicName);
          return matchedTopic;
        }
      }
    }
    
    // Direct topic name matching
    const directMatch = topics.find(t => t.name.toLowerCase() === tagLower || tagLower.includes(t.name.toLowerCase()));
    if (directMatch) {
      console.log("✅ Direct tag match:", tag, "->", directMatch.name);
      return directMatch;
    }
  }
  
  // Try to match by title keywords
  console.log("🔍 Checking title keywords for:", title);
  for (const [topicName, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(keyword => title.includes(keyword))) {
      const matchedTopic = topics.find(t => t.name === topicName);
      if (matchedTopic) {
        console.log("✅ Matched by title keyword:", keyword, "->", topicName);
        return matchedTopic;
      }
    }
  }
  
  // Default to Arrays if no match found
  const defaultTopic = topics.find(t => t.name === "Arrays");
  console.log("⚠️ No specific match found, defaulting to:", defaultTopic?.name || "Arrays");
  return defaultTopic;
}
