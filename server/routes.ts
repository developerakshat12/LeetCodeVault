import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./db";
import { insertUserSchema, insertTopicSchema, insertProblemSchema, insertSolutionSchema, insertFavoriteSchema, insertGithubCodeSchema, type GitHubCode } from "@shared/schema";
import { z } from "zod";
import { LeetCodeGraphQLAPI } from "./leetcode-api";
import LeetCodeQuery from "leetcode-query";
import { GitHubCodeFetcher } from "./githubCodeFetcher";

const LeetCode = LeetCodeQuery;

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
      console.log("👤 User update request:", {
        userId: req.params.id,
        updates: req.body,
        userFound: !!user
      });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // LeetCode data fetching route - now includes GitHub sync
  app.post("/api/users/:userId/fetch-data", async (req, res) => {
    try {
      const { userId } = req.params;
      const { username } = req.body;
      console.log("📡 Starting data fetch for user:", userId, "with LeetCode username:", username);

      if (!username) {
        console.log("❌ No username provided");
        return res.status(400).json({ message: "Username is required" });
      }

      // Get user to check for GitHub settings
      const currentUser = await storage.getUser(userId);
      console.log("👤 Current user lookup:", {
        requestedUserId: userId,
        userFound: !!currentUser,
        userId: currentUser?.id,
        username: currentUser?.username,
        leetcodeUsername: currentUser?.leetcodeUsername,
        githubRepoUrl: currentUser?.githubRepoUrl,
        hasGithubToken: !!currentUser?.githubToken
      });

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
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
      let leetcodeUser = await storage.getUserByLeetcodeUsername(username);

      const userStats = {
        username: username,
        leetcodeUsername: username,
        totalSolved: profileData.totalSolved,
        easySolved: profileData.easySolved,
        mediumSolved: profileData.mediumSolved,
        hardSolved: profileData.hardSolved,
        lastFetchedAt: new Date(),
        // Preserve existing GitHub fields to avoid overwriting them
        ...(leetcodeUser && {
          githubRepoUrl: leetcodeUser.githubRepoUrl || undefined,
          githubToken: leetcodeUser.githubToken || undefined
        })
      };

      if (!leetcodeUser) {
        console.log("🆕 Creating new user with stats:", userStats);
        leetcodeUser = await storage.createUser(userStats);
      } else {
        console.log("🔄 Updating existing user with stats (preserving GitHub fields):", userStats);
        leetcodeUser = await storage.updateUser(leetcodeUser.id, userStats) || leetcodeUser;
      }
      console.log("👤 User ready:", { id: leetcodeUser.id, username: leetcodeUser.username });

      // Sync GitHub data if repository is configured
      let githubSyncResult = null;
      console.log("🔍 Checking GitHub sync conditions:", {
        hasGithubRepoUrl: !!leetcodeUser.githubRepoUrl,
        githubRepoUrl: leetcodeUser.githubRepoUrl,
        hasGithubToken: !!leetcodeUser.githubToken
      });

      if (leetcodeUser.githubRepoUrl) {
        console.log("🔄 GitHub repository configured, syncing data...");
        console.log("📝 GitHub repo URL:", leetcodeUser.githubRepoUrl);
        console.log("🔐 GitHub token configured:", !!leetcodeUser.githubToken);
        try {
          // Parse GitHub URL
          const urlPattern = /github\.com\/([^\/]+)\/([^\/\?]+)/;
          const match = leetcodeUser.githubRepoUrl.match(urlPattern);

          if (match) {
            const [, owner, repo] = match;
            const cleanRepo = repo.replace(/\.git$/, '');

            console.log(`🔄 Syncing GitHub repo: ${owner}/${cleanRepo}`);

            const githubFetcher = new GitHubCodeFetcher(leetcodeUser.githubToken || undefined);
            const githubSolutions = await githubFetcher.fetchAllCode(owner, cleanRepo);
            // Function to normalize and extract first 5 meaningful lines
            const normalizeFirst5Lines = (code: string): string => {
              return code
                .replace(/\r\n/g, '\n')       // normalize line endings
                .replace(/\r/g, '\n')         // handle old Mac line endings
                .split('\n')
                .map(line => line.trim())     // remove leading/trailing spaces
                .filter(line => line.length > 0 && !line.startsWith('//') && !line.startsWith('/*') && line !== '*/' && !line.startsWith('*')) // remove empty lines and comments
                .slice(0, 5)
                .join('\n')
                .toLowerCase()                // case insensitive comparison
                .replace(/\s+/g, ' ')         // normalize multiple spaces to single space
                .trim();
            };

            console.log(`📦 Found ${githubSolutions.length} solutions in GitHub repo`);

            let githubProcessed = 0;
            let githubCreated = 0;
            let githubUpdated = 0;
            let githubSkipped = 0;

            for (const githubSolution of githubSolutions) {
              try {
                console.log(`\n🔍 Processing GitHub solution:`, {
                  problemId: githubSolution.problemId,
                  problemNumber: githubSolution.problemNumber,
                  language: githubSolution.language,
                  fileName: githubSolution.fileName,
                  folderName: githubSolution.folderName
                });

                // Try to find problem by title slug first, then by leetcode ID
                let problem = await storage.findProblemByTitleSlug(githubSolution.problemId);
                console.log(`🔍 Search by title slug "${githubSolution.problemId}":`, problem ? `Found: ${problem.title}` : 'Not found');

                if (!problem && githubSolution.problemNumber) {
                  problem = await storage.findProblemByLeetcodeId(githubSolution.problemNumber);
                  console.log(`🔍 Search by leetcode ID "${githubSolution.problemNumber}":`, problem ? `Found: ${problem.title}` : 'Not found');
                }

                if (!problem) {
                  console.log(`⚠️ Problem not found for GitHub solution: ${githubSolution.problemId} (number: ${githubSolution.problemNumber})`);
                  githubSkipped++;
                  continue;
                }

                // Get existing solutions for this problem to check for duplicates
                const existingSolutions = await storage.getSolutions(problem.id, leetcodeUser.id);

                // Normalize both sides before comparing
                const newCodeFirst5Lines = normalizeFirst5Lines(githubSolution.code);

                console.log(`🔍 Checking duplicates for ${problem.title} (${githubSolution.language})`);
                console.log(`📝 New GitHub code (first 5 lines normalized):\n"${newCodeFirst5Lines}"`);

                const isDuplicate = existingSolutions.some(existingSolution => {
                  const existingCodeFirst5Lines = normalizeFirst5Lines(existingSolution.code);
                  console.log(`📝 Existing solution "${existingSolution.name}" (first 5 lines normalized):\n"${existingCodeFirst5Lines}"`);
                  console.log(`🔍 Languages match: ${existingSolution.language === githubSolution.language}`);
                  console.log(`🔍 Code match: ${existingCodeFirst5Lines === newCodeFirst5Lines}`);
                  
                  return existingCodeFirst5Lines === newCodeFirst5Lines &&
                    existingSolution.language === githubSolution.language;
                });

                if (isDuplicate) {
                  githubSkipped++;
                  console.log(`⏭️ DUPLICATE DETECTED: Solution already exists for ${problem.title} (${githubSolution.language}) - first 5 lines match`);
                  continue;
                } else {
                  console.log(`✅ NEW SOLUTION: Adding solution for ${problem.title} (${githubSolution.language}) - no duplicates found`);
                }

                // Generate solution name based on existing solution count
                const solutionCount = existingSolutions.length + 1;
                const solutionName = `Solution-${solutionCount}`;

                // Create a new solution version
                const newSolution = await storage.createSolution({
                  problemId: problem.id,
                  userId: leetcodeUser.id,
                  code: githubSolution.code,
                  language: githubSolution.language,
                  name: solutionName,
                  approach: "GitHub Import",
                  timeComplexity: "O(?)",
                  spaceComplexity: "O(?)",
                  explanation: "",
                  isFromGitHub: true,
                  githubFileName: githubSolution.fileName,
                  githubFolderName: githubSolution.folderName,
                  submissionDate: new Date(),
                });

                githubCreated++;
                console.log(`✅ Created new solution for ${problem.title} (${githubSolution.language}) - ${solutionName} - Solution ID: ${newSolution.id}`);

                githubProcessed++;
              } catch (error) {
                console.error(`❌ Error processing GitHub solution:`, error);
                githubSkipped++;
              }
            }

            githubSyncResult = {
              totalSolutions: githubSolutions.length,
              processed: githubProcessed,
              created: githubCreated,
              updated: githubUpdated,
              skipped: githubSkipped,
            };

            console.log("✅ GitHub sync completed:", githubSyncResult);
          }
        } catch (error) {
          console.error("❌ GitHub sync error:", error);
          githubSyncResult = { error: error instanceof Error ? error.message : String(error) };
        }
      } else {
        console.log("ℹ️ No GitHub repository configured for this user");
        githubSyncResult = {
          message: "No GitHub repository configured. Please set up your GitHub repo URL in Settings.",
          totalSolutions: 0,
          processed: 0,
          created: 0,
          updated: 0,
          skipped: 0,
        };
        console.log("✅ Set default GitHub sync result:", githubSyncResult);
      }

      // Get topics for categorization
      console.log("📂 Fetching topics for categorization...");
      const topics = await storage.getTopics();
      console.log("📂 Available topics:", topics.map(t => ({ id: t.id, name: t.name })));

      if (topics.length === 0) {
        console.log("⚠️ No topics found! Creating default topics...");
        // This shouldn't happen as default topics are created in storage initialization
        // But let's log it in case there's an issue
      }

      // Process real submissions
      console.log("🔄 Processing submissions...");
      const existingProblems = await storage.getProblems(leetcodeUser.id);
      console.log("📋 Existing problems count:", existingProblems.length);

      let processedCount = 0;
      let skippedCount = 0;

      if (!submissions || submissions.length === 0) {
        console.log("⚠️ No submissions found for user");
        return res.json({
          user: leetcodeUser,
          message: "User found but no submissions available",
          totalSubmissions: 0,
          problemsProcessed: 0,
          problemsSkipped: 0,
          githubSync: githubSyncResult
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
        console.log("🏷️  Categorizing problem with topicTags:", submission.topicTags);
        console.log("🏷️  Problem title:", submission.title);
        console.log("🏷️  Available topics for matching:", topics.map(t => t.name));
        let topic = categorizeSubmission(problemData, topics);

        if (topic) {
          console.log("✅ Assigned to topic:", { id: topic.id, name: topic.name });

          // Safeguard: Ensure we're not accidentally using user ID as topic ID
          if (topic.id === leetcodeUser.id) {
            console.log("⚠️ WARNING: Topic ID matches user ID! This shouldn't happen. Using default Array topic.");
            const defaultTopic = topics.find(t => t.name === "Array");
            if (defaultTopic) {
              topic = defaultTopic;
              console.log("✅ Using default topic:", { id: topic.id, name: topic.name });
            }
          }

          try {
            const newProblem = await storage.createProblem({
              leetcodeId: submission.leetcodeId || parseInt(submission.id) || Math.floor(Math.random() * 100000),
              title: submission.title,
              titleSlug: submission.titleSlug,
              difficulty: submission.difficulty || "Medium",
              tags: submission.topicTags || [],
              submissionDate: submission.timestamp ? new Date(parseInt(submission.timestamp) * 1000) : new Date(),
              language: submission.lang,
              code: submission.code || `// ${submission.lang} solution for ${submission.title}`,
              userId: leetcodeUser.id,
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
        user: leetcodeUser,
        message: "Data fetched successfully",
        totalSubmissions: submissions.length,
        problemsProcessed: processedCount,
        problemsSkipped: skippedCount,
        githubSync: githubSyncResult
      });
      console.log("📤 Final response includes githubSync:", !!githubSyncResult);
    } catch (error) {
      console.error("💥 Error fetching LeetCode data:", error);
      if (error instanceof Error) {
        console.error("Stack trace:", error.stack);
      }
      res.status(500).json({ message: "Failed to fetch LeetCode data", error: error instanceof Error ? error.message : String(error) });
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
          const problems = await storage.getProblemsByTopicName(topic.name, userId as string);
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
      // First get the topic to get its name
      const topic = await storage.getTopic(req.params.topicId);
      if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
      }

      // Get problems by topic name using tags
      const { userId } = req.query;
      const problems = await storage.getProblemsByTopicName(topic.name, userId as string);
      res.json(problems);
    } catch (error) {
      console.error('Error getting problems by topic:', error);
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

  app.post("/api/problems", async (req, res) => {
    try {
      const problemData = insertProblemSchema.parse(req.body);
      const problem = await storage.createProblem(problemData);
      res.status(201).json(problem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid problem data", errors: error.errors });
      }
      console.error("Create problem error:", error);
      res.status(500).json({ message: "Failed to create problem" });
    }
  });

  app.patch("/api/problems/:problemId", async (req, res) => {
    try {
      const { problemId } = req.params;
      const problem = await storage.updateProblem(problemId, req.body);

      if (!problem) {
        return res.status(404).json({ message: "Problem not found" });
      }

      res.json(problem);
    } catch (error) {
      console.error("Update problem error:", error);
      res.status(500).json({ message: "Failed to update problem" });
    }
  });

  app.delete("/api/problems/:problemId", async (req, res) => {
    try {
      const { problemId } = req.params;
      const success = await storage.deleteProblem(problemId);

      if (!success) {
        return res.status(404).json({ message: "Problem not found" });
      }

      res.json({ message: "Problem deleted successfully" });
    } catch (error) {
      console.error("Delete problem error:", error);
      res.status(500).json({ message: "Failed to delete problem" });
    }
  });

  // Get specific topic
  app.get("/api/topics/:topicId", async (req, res) => {
    try {
      const { topicId } = req.params;
      const topic = await storage.getTopic(topicId);

      if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
      }

      res.json(topic);
    } catch (error) {
      console.error("Get topic error:", error);
      res.status(500).json({ message: "Failed to get topic" });
    }
  });

  // Get enhanced problem details using leetcode-query
  app.get("/api/problems/:problemId/enhanced", async (req, res) => {
    try {
      const { problemId } = req.params;
      const problem = await storage.getProblem(problemId);

      if (!problem) {
        return res.status(404).json({ message: "Problem not found" });
      }

      // Fetch enhanced details using leetcode-query
      try {
        const leetcode = new LeetCode();
        const problemDetails = await leetcode.problem(problem.titleSlug);

        // Merge our stored data with enhanced details
        const enhancedProblem = {
          ...problem,
          description: problemDetails?.content || problem.description,
          hints: problemDetails?.hints || [],
          similarQuestions: problemDetails?.similarQuestions || [],
          topicTags: problemDetails?.topicTags || problem.tags,
        };

        res.json(enhancedProblem);
      } catch (leetcodeError) {
        console.warn("Failed to fetch enhanced details:", leetcodeError);
        // Fallback to stored problem data
        res.json(problem);
      }
    } catch (error) {
      console.error("Get enhanced problem error:", error);
      res.status(500).json({ message: "Failed to get problem details" });
    }
  });

  // Solution routes
  app.get("/api/problems/:problemId/solutions", async (req, res) => {
    try {
      const { problemId } = req.params;
      const { userId } = req.query;
      const solutions = await storage.getSolutions(problemId, userId as string);
      res.json(solutions);
    } catch (error) {
      console.error("Get solutions error:", error);
      res.status(500).json({ message: "Failed to get solutions" });
    }
  });

  // Favorite routes
  app.post("/api/favorites", async (req, res) => {
    try {
      const { userId, problemId } = req.body;

      if (!userId || !problemId) {
        return res.status(400).json({ message: "UserId and problemId are required" });
      }

      // Verify problem exists
      const problem = await storage.getProblem(problemId);
      if (!problem) {
        return res.status(404).json({ message: "Problem not found" });
      }

      const favorite = await storage.addFavorite(userId, problemId);
      res.status(201).json(favorite);
    } catch (error) {
      if (error instanceof Error && error.message === 'Problem already in favorites') {
        return res.status(409).json({ message: error.message });
      }
      console.error("Add favorite error:", error);
      res.status(500).json({ message: "Failed to add favorite" });
    }
  });

  app.delete("/api/favorites/:userId/:problemId", async (req, res) => {
    try {
      const { userId, problemId } = req.params;
      const removed = await storage.removeFavorite(userId, problemId);

      if (!removed) {
        return res.status(404).json({ message: "Favorite not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Remove favorite error:", error);
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });

  app.get("/api/users/:userId/favorites", async (req, res) => {
    try {
      const { userId } = req.params;
      const favorites = await storage.getUserFavorites(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Get favorites error:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.get("/api/favorites/:userId/:problemId/status", async (req, res) => {
    try {
      const { userId, problemId } = req.params;
      const isFavorited = await storage.isFavorited(userId, problemId);
      res.json({ isFavorited });
    } catch (error) {
      console.error("Check favorite status error:", error);
      res.status(500).json({ message: "Failed to check favorite status" });
    }
  });

  app.get("/api/solutions/:solutionId", async (req, res) => {
    try {
      const { solutionId } = req.params;
      const solution = await storage.getSolution(solutionId);

      if (!solution) {
        return res.status(404).json({ message: "Solution not found" });
      }

      res.json(solution);
    } catch (error) {
      console.error("Get solution error:", error);
      res.status(500).json({ message: "Failed to get solution" });
    }
  });

  app.post("/api/solutions", async (req, res) => {
    try {
      const solutionData = insertSolutionSchema.parse(req.body);
      const solution = await storage.createSolution(solutionData);
      res.status(201).json(solution);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid solution data", errors: error.errors });
      }
      console.error("Create solution error:", error);
      res.status(500).json({ message: "Failed to create solution" });
    }
  });

  app.patch("/api/solutions/:solutionId", async (req, res) => {
    try {
      const { solutionId } = req.params;
      const solution = await storage.updateSolution(solutionId, req.body);

      if (!solution) {
        return res.status(404).json({ message: "Solution not found" });
      }

      res.json(solution);
    } catch (error) {
      console.error("Update solution error:", error);
      res.status(500).json({ message: "Failed to update solution" });
    }
  });

  app.delete("/api/solutions/:solutionId", async (req, res) => {
    try {
      const { solutionId } = req.params;
      const success = await storage.deleteSolution(solutionId);

      if (!success) {
        return res.status(404).json({ message: "Solution not found" });
      }

      res.json({ message: "Solution deleted successfully" });
    } catch (error) {
      console.error("Delete solution error:", error);
      res.status(500).json({ message: "Failed to delete solution" });
    }
  });

  // GitHub Settings API route
  app.post("/api/users/:userId/github-settings", async (req, res) => {
    try {
      console.log("🔧 GitHub settings update request:", {
        userId: req.params.userId,
        body: req.body,
        hasGithubRepoUrl: !!req.body.githubRepoUrl,
        hasGithubToken: !!req.body.githubToken
      });

      const { userId } = req.params;
      const { githubRepoUrl, githubToken } = req.body;

      if (!githubRepoUrl) {
        console.log("❌ Missing GitHub repository URL");
        return res.status(400).json({ message: "GitHub repository URL is required" });
      }

      // Validate GitHub URL format
      const urlPattern = /github\.com\/([^\/]+)\/([^\/\?]+)/;
      const match = githubRepoUrl.match(urlPattern);

      if (!match) {
        console.log("❌ Invalid GitHub URL format:", githubRepoUrl);
        return res.status(400).json({ message: "Invalid GitHub repository URL format" });
      }

      console.log("✅ Valid GitHub URL:", githubRepoUrl);

      // Debug: Check user before update
      const userBeforeUpdate = await storage.getUser(userId);
      console.log("👤 User before GitHub settings update:", {
        userExists: !!userBeforeUpdate,
        userId: userBeforeUpdate?.id,
        currentGithubRepoUrl: userBeforeUpdate?.githubRepoUrl,
        currentGithubToken: userBeforeUpdate?.githubToken
      });

      // Update user with GitHub settings
      const updatedUser = await storage.updateUser(userId, {
        githubRepoUrl,
        githubToken: githubToken || null,
      });

      console.log("🔄 User update result:", {
        userFound: !!updatedUser,
        userId: updatedUser?.id,
        githubRepoUrl: updatedUser?.githubRepoUrl,
        hasGithubToken: !!updatedUser?.githubToken,
        githubTokenValue: updatedUser?.githubToken
      });

      // Debug: Verify user after update
      const userAfterUpdate = await storage.getUser(userId);
      console.log("👤 User after GitHub settings update (re-fetched):", {
        userExists: !!userAfterUpdate,
        userId: userAfterUpdate?.id,
        githubRepoUrl: userAfterUpdate?.githubRepoUrl,
        githubToken: userAfterUpdate?.githubToken,
        allFields: userAfterUpdate
      });

      if (!updatedUser) {
        console.log("❌ User not found for ID:", userId);
        return res.status(404).json({ message: "User not found" });
      }

      console.log("✅ GitHub settings saved successfully");
      res.json({
        message: "GitHub settings saved successfully",
        githubRepoUrl: updatedUser.githubRepoUrl,
        hasToken: !!updatedUser.githubToken,
      });

    } catch (error) {
      console.error('❌ GitHub settings error:', error);
      res.status(500).json({
        message: "Failed to save GitHub settings",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get GitHub settings for a user
  app.get("/api/users/:userId/github-settings", async (req, res) => {
    try {
      console.log("📥 GitHub settings fetch request for user:", req.params.userId);

      const { userId } = req.params;
      const user = await storage.getUser(userId);

      console.log("👤 User fetch result:", {
        userFound: !!user,
        userId: user?.id,
        githubRepoUrl: user?.githubRepoUrl,
        hasGithubToken: !!user?.githubToken
      });

      if (!user) {
        console.log("❌ User not found for GitHub settings fetch");
        return res.status(404).json({ message: "User not found" });
      }

      const response = {
        githubRepoUrl: user.githubRepoUrl,
        hasToken: !!user.githubToken,
      };

      console.log("📤 GitHub settings response:", response);
      res.json(response);
    } catch (error) {
      console.error('❌ Get GitHub settings error:', error);
      res.status(500).json({ message: "Failed to fetch GitHub settings" });
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

  // Enhanced tag mapping
  const tagMappings = {
    'Array': ['array', 'arrays'],
    'String': ['string', 'strings', 'palindrome', 'substring'],
    'Hash Table': ['hash', 'map', 'hashmap', 'hash-table', 'hashtable'],
    'Tree': ['tree', 'trees', 'binary-tree', 'binary tree'],
    'Dynamic Programming': ['dynamic-programming', 'dp', 'dynamic programming'],
    'Graph': ['graph', 'graphs'],
    'Linked List': ['linked-list', 'linked list', 'linkedlist'],
    'Stack & Queue': ['stack', 'queue', 'stacks', 'queues'],
  };

  // Try to match by LeetCode tags first (most accurate)
  for (const tag of tags) {
    const tagLower = tag.toLowerCase().replace(/\s+/g, '-');
    console.log("🔍 Checking tag:", tagLower);

    // Check against all topic mappings
    for (const [topicName, variations] of Object.entries(tagMappings)) {
      if (variations.some(variation =>
        tagLower.includes(variation) || variation.includes(tagLower)
      )) {
        const matchedTopic = topics.find(t => t.name === topicName);
        if (matchedTopic) {
          console.log(`✅ Matched by tag: ${tag} -> ${topicName}`);
          return matchedTopic;
        }
      }
    }
  }

  // Try to match by title keywords
  console.log("🔍 Checking title keywords for:", title);

  // Title-based mapping
  const titleMappings = [
    { keywords: ['array', 'sum', 'target', 'duplicate'], topic: 'Array' },
    { keywords: ['string', 'palindrome', 'substring', 'anagram'], topic: 'String' },
    { keywords: ['tree', 'binary', 'traverse'], topic: 'Tree' },
    { keywords: ['hash', 'map', 'frequency'], topic: 'Hash Table' },
    { keywords: ['dynamic', 'dp', 'fibonacci', 'climb'], topic: 'Dynamic Programming' },
    { keywords: ['linked', 'list', 'node'], topic: 'Linked List' },
    { keywords: ['stack', 'queue', 'parentheses'], topic: 'Stack & Queue' },
    { keywords: ['graph', 'bfs', 'dfs'], topic: 'Graph' },
  ];

  for (const mapping of titleMappings) {
    if (mapping.keywords.some(keyword => title.includes(keyword))) {
      const matchedTopic = topics.find(t => t.name === mapping.topic);
      if (matchedTopic) {
        console.log(`✅ Matched by title: ${mapping.topic}`);
        return matchedTopic;
      }
    }
  }

  // Default to Array if no match found
  const defaultTopic = topics.find(t => t.name === "Array");
  console.log("⚠️ No specific match found, defaulting to:", defaultTopic?.name || "Array");
  return defaultTopic;
}