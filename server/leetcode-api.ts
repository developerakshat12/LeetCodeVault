// Using built-in fetch (Node 18+) instead of node-fetch

export interface LeetCodeSubmission {
  id: string;
  title: string;
  titleSlug: string;
  timestamp: string;
  statusDisplay: string;
  lang: string;
  code?: string;
  difficulty?: string;
  topicTags?: string[];
}

export interface LeetCodeUser {
  username: string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
}

export class LeetCodeGraphQLAPI {
  private baseUrl = 'https://leetcode.com/graphql/';
  
  private async makeGraphQLRequest(query: string, variables: any = {}) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; LeetCode-API)',
        'Referer': 'https://leetcode.com',
        'Origin': 'https://leetcode.com'
      },
      body: JSON.stringify({
        query,
        variables
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getUserProfile(username: string): Promise<LeetCodeUser | null> {
    const query = `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          username
          submitStats: submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
              submissions
            }
          }
        }
      }
    `;

    try {
      const result = await this.makeGraphQLRequest(query, { username });
      console.log(`📊 User profile result:`, JSON.stringify(result, null, 2));

      if (!result.data?.matchedUser) {
        return null;
      }

      const user = result.data.matchedUser;
      const stats = user.submitStats?.acSubmissionNum || [];
      
      return {
        username: user.username,
        totalSolved: stats.find(s => s.difficulty === 'All')?.count || 0,
        easySolved: stats.find(s => s.difficulty === 'Easy')?.count || 0,
        mediumSolved: stats.find(s => s.difficulty === 'Medium')?.count || 0,
        hardSolved: stats.find(s => s.difficulty === 'Hard')?.count || 0,
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  async getRecentSubmissions(username: string, limit: number = 20): Promise<LeetCodeSubmission[]> {
    const query = `
      query recentAcSubmissions($username: String!, $limit: Int!) {
        recentAcSubmissionList(username: $username, limit: $limit) {
          id
          title
          titleSlug
          timestamp
          statusDisplay
          lang
        }
      }
    `;

    try {
      const result = await this.makeGraphQLRequest(query, { username, limit });
      console.log(`📝 Recent submissions result:`, JSON.stringify(result, null, 2));

      if (!result.data?.recentAcSubmissionList) {
        return [];
      }

      const submissions = result.data.recentAcSubmissionList;
      
      // For each submission, fetch problem details and try to get more info
      const enrichedSubmissions = await Promise.all(
        submissions.map(async (submission: any) => {
          const problemDetails = await this.getProblemDetails(submission.titleSlug);
          
          return {
            id: submission.id,
            title: submission.title,
            titleSlug: submission.titleSlug,
            timestamp: submission.timestamp,
            statusDisplay: submission.statusDisplay,
            lang: submission.lang,
            difficulty: problemDetails?.difficulty || 'Medium',
            topicTags: problemDetails?.topicTags || [],
            code: `// ${submission.lang} solution for ${submission.title}
// This would contain the actual submitted code
// Note: LeetCode's public GraphQL API doesn't expose submission code
// You would need authentication cookies to access private submission details

function solution() {
    // Your ${submission.lang} solution here
    return "Solution for ${submission.title}";
}`,
          };
        })
      );

      return enrichedSubmissions;
    } catch (error) {
      console.error('Error fetching recent submissions:', error);
      return [];
    }
  }

  async getProblemDetails(titleSlug: string) {
    const query = `
      query getProblemDetails($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          title
          titleSlug
          difficulty
          topicTags {
            name
            slug
          }
          content
        }
      }
    `;

    try {
      const result = await this.makeGraphQLRequest(query, { titleSlug });
      
      if (!result.data?.question) {
        return null;
      }

      const question = result.data.question;
      
      return {
        title: question.title,
        titleSlug: question.titleSlug,
        difficulty: question.difficulty,
        topicTags: question.topicTags?.map((tag: any) => tag.name) || [],
        content: question.content
      };
    } catch (error) {
      console.error(`Error fetching problem details for ${titleSlug}:`, error);
      return null;
    }
  }

  // Alternative method to get submission details with authentication (would need cookies)
  async getSubmissionDetails(submissionId: string) {
    // This would require authentication cookies to work
    const query = `
      query submissionDetails($submissionId: ID!) {
        submissionDetails(submissionId: $submissionId) {
          code
          lang
          question {
            title
            titleSlug
          }
          statusDisplay
        }
      }
    `;

    try {
      const result = await this.makeGraphQLRequest(query, { submissionId });
      console.log(`🔍 Submission details result:`, JSON.stringify(result, null, 2));
      return result.data?.submissionDetails || null;
    } catch (error) {
      console.error(`Error fetching submission details for ${submissionId}:`, error);
      return null;
    }
  }
}