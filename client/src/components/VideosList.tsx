import { useEffect, useState } from "react";
import { getMultipleVideoIds } from "../utils/getVideoId";
import { VideoEmbed } from "./VideoEmbed";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Play, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";

interface VideoData {
  keyword: string;
  videoId: string;
  title?: string;
}

interface VideosListProps {
  problemTitle: string;
  tags: string[];
  maxVideosPerKeyword?: number;
}

export function VideosList({ 
  problemTitle, 
  tags = [], 
  maxVideosPerKeyword = 3 
}: VideosListProps) {
  const [videosByKeyword, setVideosByKeyword] = useState<Record<string, VideoData[]>>({});
  const [loading, setLoading] = useState(true);

  // Create all keywords: problem title + each tag
  const allKeywords = [problemTitle, ...tags];

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      const results: Record<string, VideoData[]> = {};
      
      try {
        for (const keyword of allKeywords) {
          const videos = await getMultipleVideoIds([keyword], maxVideosPerKeyword);
          results[keyword] = videos.filter(v => v.keyword === keyword);
        }
        setVideosByKeyword(results);
      } catch (error) {
        console.error("Error fetching videos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [problemTitle, tags.join(","), maxVideosPerKeyword]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Related Learning Videos</h3>
        {allKeywords.map((keyword, index) => (
          <div key={keyword} className="space-y-3">
            <h4 className="font-medium text-base">
              Videos related to {index === 0 ? "problem" : "tag"}: <span className="text-primary">{keyword}</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-40 w-full mb-2"></div>
                  <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Check if we have any videos at all
  const hasAnyVideos = Object.values(videosByKeyword).some(videos => videos.length > 0);

  if (!hasAnyVideos) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Related Learning Videos</h3>
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-500 dark:text-gray-400 text-center">
              No videos found for this problem and its tags.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Related Learning Videos</h3>
      
      {allKeywords.map((keyword, index) => {
        const videos = videosByKeyword[keyword] || [];
        
        if (videos.length === 0) return null;
        
        return (
          <div key={keyword} className="space-y-3">
            <h4 className="font-medium text-base">
              Videos related to {index === 0 ? "problem" : "tag"}: <span className="text-primary">{keyword}</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {videos.map((video, videoIndex) => (
                <VideoCard key={`${keyword}-${videoIndex}`} video={video} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function VideoCard({ video }: { video: VideoData }) {
  const openInYouTube = () => {
    window.open(`https://www.youtube.com/watch?v=${video.videoId}`, '_blank');
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-3 space-y-2">
        <div className="flex justify-between items-start gap-2">
          <h5 className="font-medium text-sm leading-tight line-clamp-2 min-h-[2.5rem]" title={video.title || video.keyword}>
            {video.title || video.keyword}
          </h5>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={openInYouTube}
            className="flex-shrink-0 p-1"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
        <VideoEmbed 
          videoId={video.videoId} 
          title={video.title || video.keyword}
          width="100%"
          height={180}
        />
      </CardContent>
    </Card>
  );
}
