import { apiRequest } from "./queryClient";

export interface LeetCodeUser {
  username: string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
}

export interface LeetCodeSubmission {
  title: string;
  titleSlug: string;
  difficulty: string;
  statusDisplay: string;
  lang: string;
  timestamp: number;
  topicTags: string[];
  code?: string;
  runtime?: string;
  memory?: string;
}

export const leetCodeAPI = {
  async fetchUserProfile(username: string): Promise<LeetCodeUser> {
    const response = await fetch(`https://alfa-leetcode-api.onrender.com/userProfile/${username}`);
    if (!response.ok) {
      throw new Error("User not found");
    }
    return response.json();
  },

  async fetchUserSubmissions(username: string, limit = 100): Promise<LeetCodeSubmission[]> {
    const response = await fetch(`https://alfa-leetcode-api.onrender.com/submission/${username}?limit=${limit}`);
    if (!response.ok) {
      throw new Error("Failed to fetch submissions");
    }
    const data = await response.json();
    return data.submission || [];
  },

  async fetchAcceptedSubmissions(username: string, limit = 100): Promise<LeetCodeSubmission[]> {
    const response = await fetch(`https://alfa-leetcode-api.onrender.com/acSubmission/${username}?limit=${limit}`);
    if (!response.ok) {
      throw new Error("Failed to fetch accepted submissions");
    }
    const data = await response.json();
    return data.submission || [];
  },

  async fetchProblemDetails(titleSlug: string) {
    const response = await fetch(`https://alfa-leetcode-api.onrender.com/select?titleSlug=${titleSlug}`);
    if (!response.ok) {
      throw new Error("Problem not found");
    }
    return response.json();
  }
};

export const internalAPI = {
  async fetchLeetCodeData(username: string) {
    const response = await apiRequest("POST", "/api/fetch-leetcode-data", { username });
    return response.json();
  },

  async getTopics(userId?: string) {
    const queryParams = userId ? `?userId=${userId}` : "";
    const response = await apiRequest("GET", `/api/topics${queryParams}`);
    return response.json();
  },

  async createTopic(topicData: any) {
    const response = await apiRequest("POST", "/api/topics", topicData);
    return response.json();
  },

  async getProblems(userId?: string, topicId?: string) {
    const params = new URLSearchParams();
    if (userId) params.append("userId", userId);
    if (topicId) params.append("topicId", topicId);
    
    const queryString = params.toString();
    const response = await apiRequest("GET", `/api/problems${queryString ? `?${queryString}` : ""}`);
    return response.json();
  },

  async getProblemsByTopic(topicId: string, userId?: string) {
    const params = new URLSearchParams();
    if (userId) params.append("userId", userId);
    
    const queryString = params.toString();
    const response = await apiRequest("GET", `/api/problems/topic/${topicId}${queryString ? `?${queryString}` : ""}`);
    return response.json();
  }
};
