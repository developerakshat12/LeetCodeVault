import { topicVideos } from "../data/topicVideos";
import { smartVideoSearch, expandKeywords, VideoSearchResult } from "./videoSearch";

interface VideoData {
  keyword: string;
  videoId: string;
  title?: string;
}

/**
 * Get video ID for a keyword using fuzzy search with fallback to YouTube API
 * @param keyword - The search keyword
 * @returns Promise resolving to video ID string
 */
export async function getVideoId(keyword: string): Promise<string> {
  try {
    // First, check direct exact match in topicVideos
    if (topicVideos[keyword]) {
      console.log(`Found exact match in topicVideos for "${keyword}"`);
      return topicVideos[keyword];
    }

    // Second, try case-insensitive direct match
    const lowerKeyword = keyword.toLowerCase();
    for (const [title, videoId] of Object.entries(topicVideos)) {
      if (title.toLowerCase() === lowerKeyword) {
        console.log(`Found case-insensitive match in topicVideos for "${keyword}": ${title}`);
        return videoId;
      }
    }

    // Third, try partial matches in topicVideos
    for (const [title, videoId] of Object.entries(topicVideos)) {
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes(lowerKeyword) || lowerKeyword.split(' ').some(word => 
        word.length > 2 && lowerTitle.includes(word)
      )) {
        console.log(`Found partial match in topicVideos for "${keyword}": ${title}`);
        return videoId;
      }
    }

    // Fourth, try fuzzy search as fallback
    let localResults = smartVideoSearch(keyword, 1);
    
    // If no results, try with expanded keywords
    if (localResults.length === 0) {
      const expandedKeywords = expandKeywords([keyword]);
      for (const expandedKeyword of expandedKeywords) {
        localResults = smartVideoSearch(expandedKeyword, 1);
        if (localResults.length > 0) break;
      }
    }
    
    if (localResults.length > 0) {
      console.log(`Found fuzzy match for "${keyword}": ${localResults[0].title}`);
      return localResults[0].videoId;
    }

    // Only use YouTube API if absolutely necessary
    console.log(`No local video found for "${keyword}", using YouTube API...`);
    
    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
    if (!apiKey) {
      console.warn("YouTube API key not found, skipping API search");
      return "";
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encodeURIComponent(keyword + " data structures algorithms leetcode")}&type=video&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      console.log(`Found YouTube video for "${keyword}": ${data.items[0].snippet.title}`);
      return data.items[0].id.videoId;
    }

    return "";
  } catch (error) {
    console.error(`Error fetching video for keyword "${keyword}":`, error);
    return "";
  }
}

/**
 * Get video IDs for multiple keywords using enhanced search
 * @param keywords - Array of keywords
 * @param maxVideosPerKeyword - Maximum videos per keyword
 * @returns Promise resolving to array of video data
 */
export async function getMultipleVideoIds(
  keywords: string[], 
  maxVideosPerKeyword: number = 3
): Promise<VideoData[]> {
  const allVideos: VideoData[] = [];
  
  // Use a Set to track unique combinations of keyword + videoId to avoid duplicates
  const seenCombinations = new Set<string>();
  
  // First, try to find videos in topicVideos for all keywords
  for (const keyword of keywords) {
    let foundCount = 0;
    
    try {
      // 1. Direct exact match
      if (topicVideos[keyword] && foundCount < maxVideosPerKeyword) {
        const combination = `${keyword}-${topicVideos[keyword]}`;
        if (!seenCombinations.has(combination)) {
          seenCombinations.add(combination);
          allVideos.push({
            keyword,
            videoId: topicVideos[keyword],
            title: keyword
          });
          foundCount++;
        }
      }

      // 2. Case-insensitive and partial matches in topicVideos
      const lowerKeyword = keyword.toLowerCase();
      for (const [title, videoId] of Object.entries(topicVideos)) {
        if (foundCount >= maxVideosPerKeyword) break;
        
        const lowerTitle = title.toLowerCase();
        const combination = `${keyword}-${videoId}`;
        
        if (!seenCombinations.has(combination) && 
            (lowerTitle.includes(lowerKeyword) || 
             lowerKeyword.split(' ').some(word => word.length > 2 && lowerTitle.includes(word)))) {
          seenCombinations.add(combination);
          allVideos.push({
            keyword,
            videoId,
            title
          });
          foundCount++;
        }
      }

      // 3. If still need more, try fuzzy search
      if (foundCount < maxVideosPerKeyword) {
        const localResults = smartVideoSearch(keyword, maxVideosPerKeyword - foundCount);
        
        for (const result of localResults) {
          if (foundCount >= maxVideosPerKeyword) break;
          
          const combination = `${keyword}-${result.videoId}`;
          if (!seenCombinations.has(combination)) {
            seenCombinations.add(combination);
            allVideos.push({
              keyword,
              videoId: result.videoId,
              title: result.title
            });
            foundCount++;
          }
        }
      }
      
    } catch (error) {
      console.error(`Error processing keyword "${keyword}" locally:`, error);
    }
  }
  
  // If we still don't have enough videos after local search, then try YouTube API
  const totalNeeded = keywords.length * maxVideosPerKeyword;
  if (allVideos.length < totalNeeded) {
    console.log(`Found ${allVideos.length} local videos, need ${totalNeeded}. Searching YouTube API for remaining...`);
    
    // Only search for keywords that didn't return enough local results
    for (const keyword of keywords) {
      const keywordVideos = allVideos.filter(v => v.keyword === keyword);
      const stillNeeded = maxVideosPerKeyword - keywordVideos.length;
      
      if (stillNeeded > 0) {
        try {
          const apiVideoId = await getVideoId(keyword);
          if (apiVideoId) {
            const combination = `${keyword}-${apiVideoId}`;
            if (!seenCombinations.has(combination)) {
              seenCombinations.add(combination);
              allVideos.push({
                keyword,
                videoId: apiVideoId,
                title: keyword
              });
            }
          }
        } catch (error) {
          console.error(`Error fetching YouTube video for keyword "${keyword}":`, error);
        }
      }
    }
  } else {
    console.log(`Found enough videos locally (${allVideos.length}), skipping YouTube API.`);
  }
  
  return allVideos;
}

/**
 * Search for videos by specific topic with enhanced matching
 * @param topic - The topic to search for
 * @param maxResults - Maximum number of results
 * @returns Promise resolving to array of video data
 */
export async function searchVideosByTopic(
  topic: string, 
  maxResults: number = 5
): Promise<VideoData[]> {
  // Create variations of the topic for better matching
  const topicVariations = [
    topic,
    topic.toLowerCase(),
    topic.replace(/[^a-zA-Z0-9\s]/g, ''), // Remove special characters
    ...topic.split(' ').filter(word => word.length > 2), // Individual words
  ];
  
  return getMultipleVideoIds(topicVariations, maxResults);
}
