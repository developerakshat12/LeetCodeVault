import Fuse from 'fuse.js';
import { topicVideos } from '../data/topicVideos';

// Transform the topicVideos object into an array for Fuse.js
const videoData = Object.entries(topicVideos).map(([title, videoId]) => ({
  title,
  videoId,
  // Create searchable keywords from the title
  keywords: title.toLowerCase().split(/[\s|,.-]+/).filter(word => word.length > 2),
}));

// Fuse.js configuration for optimal searching
const fuseOptions = {
  keys: [
    { name: 'title', weight: 0.7 },
    { name: 'keywords', weight: 0.3 }
  ],
  threshold: 0.4, // Lower = more strict matching
  distance: 100,
  minMatchCharLength: 2,
  includeScore: true,
  includeMatches: true,
};

// Create the Fuse instance
const fuse = new Fuse(videoData, fuseOptions);

export interface VideoSearchResult {
  title: string;
  videoId: string;
  keywords: string[];
  score?: number;
  matches?: readonly any[];
}

/**
 * Search for videos using fuzzy search
 * @param query - The search query
 * @param limit - Maximum number of results to return
 * @returns Array of matching videos
 */
export function searchVideos(query: string, limit: number = 10): VideoSearchResult[] {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const results = fuse.search(query.trim(), { limit });
  
  return results.map(result => ({
    ...result.item,
    score: result.score,
    matches: result.matches,
  }));
}

/**
 * Search for videos by multiple keywords
 * @param keywords - Array of keywords to search for
 * @param maxPerKeyword - Maximum results per keyword
 * @returns Object with keyword as key and matching videos as value
 */
export function searchVideosByKeywords(
  keywords: string[], 
  maxPerKeyword: number = 3
): Record<string, VideoSearchResult[]> {
  const results: Record<string, VideoSearchResult[]> = {};
  
  for (const keyword of keywords) {
    const videos = searchVideos(keyword, maxPerKeyword);
    if (videos.length > 0) {
      results[keyword] = videos;
    }
  }
  
  return results;
}

/**
 * Get exact matches for a keyword (fallback for when fuzzy search doesn't work)
 * @param keyword - The keyword to search for
 * @param limit - Maximum number of results
 * @returns Array of matching videos
 */
export function getExactMatches(keyword: string, limit: number = 3): VideoSearchResult[] {
  const lowerKeyword = keyword.toLowerCase();
  const matches: VideoSearchResult[] = [];
  
  for (const [title, videoId] of Object.entries(topicVideos)) {
    if (matches.length >= limit) break;
    
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes(lowerKeyword) || 
        lowerKeyword.split(' ').some(word => lowerTitle.includes(word))) {
      matches.push({
        title,
        videoId,
        keywords: title.toLowerCase().split(/[\s|,.-]+/).filter(word => word.length > 2),
      });
    }
  }
  
  return matches;
}

/**
 * Smart search that combines fuzzy search with exact matching
 * @param keyword - The keyword to search for
 * @param limit - Maximum number of results
 * @returns Array of matching videos
 */
export function smartVideoSearch(keyword: string, limit: number = 3): VideoSearchResult[] {
  // First try fuzzy search
  let results = searchVideos(keyword, limit);
  
  // If fuzzy search doesn't return enough results, try exact matching
  if (results.length < limit) {
    const exactMatches = getExactMatches(keyword, limit - results.length);
    
    // Avoid duplicates
    const existingVideoIds = new Set(results.map(r => r.videoId));
    const newMatches = exactMatches.filter(match => !existingVideoIds.has(match.videoId));
    
    results = [...results, ...newMatches];
  }
  
  return results.slice(0, limit);
}

// Common DSA keywords for enhanced searching
export const commonDSAKeywords = {
  'Array': ['array', 'arrays', 'list', 'sequence'],
  'String': ['string', 'strings', 'text', 'char', 'character'],
  'Linked List': ['linked list', 'linkedlist', 'node', 'pointer'],
  'Tree': ['tree', 'binary tree', 'bst', 'binary search tree'],
  'Graph': ['graph', 'node', 'edge', 'vertex', 'dfs', 'bfs'],
  'Dynamic Programming': ['dp', 'dynamic programming', 'memoization', 'tabulation'],
  'Recursion': ['recursion', 'recursive', 'backtrack', 'backtracking'],
  'Sorting': ['sort', 'sorting', 'merge sort', 'quick sort', 'bubble sort'],
  'Binary Search': ['binary search', 'search', 'binary'],
  'Stack': ['stack', 'lifo', 'push', 'pop'],
  'Queue': ['queue', 'fifo', 'enqueue', 'dequeue'],
  'Hash': ['hash', 'hashmap', 'hashtable', 'map'],
  'Greedy': ['greedy', 'greedy algorithm'],
  'Sliding Window': ['sliding window', 'two pointer', 'window'],
  'Math': ['math', 'mathematics', 'number', 'digit']
};

/**
 * Expand keywords using common DSA terms
 * @param keywords - Original keywords
 * @returns Expanded keywords array
 */
export function expandKeywords(keywords: string[]): string[] {
  const expanded = new Set(keywords);
  
  for (const keyword of keywords) {
    const lowerKeyword = keyword.toLowerCase();
    
    // Check if this keyword matches any common DSA terms
    for (const [category, terms] of Object.entries(commonDSAKeywords)) {
      if (terms.some(term => lowerKeyword.includes(term) || term.includes(lowerKeyword))) {
        expanded.add(category);
        terms.forEach(term => expanded.add(term));
      }
    }
  }
  
  return Array.from(expanded);
}
