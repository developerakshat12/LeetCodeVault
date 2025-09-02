import { useEffect, useState } from "react";
import { getVideoId } from "../utils/getVideoId";
import { VideoEmbed } from "./VideoEmbed";

interface VideoByKeywordProps {
  keyword: string;
  showTitle?: boolean;
}

export function VideoByKeyword({ keyword, showTitle = true }: VideoByKeywordProps) {
  const [videoId, setVideoId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getVideoId(keyword)
      .then(setVideoId)
      .finally(() => setLoading(false));
  }, [keyword]);

  if (loading) {
    return (
      <div className="mb-6">
        {showTitle && <h3 className="text-lg font-bold mb-2">{keyword}</h3>}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse w-80 h-45">
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            Loading video...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {showTitle && <h3 className="text-lg font-bold mb-2">{keyword}</h3>}
      {videoId ? (
        <VideoEmbed videoId={videoId} title={`${keyword} tutorial`} />
      ) : (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 w-80 h-45 flex items-center justify-center text-gray-500 dark:text-gray-400">
          No video found for "{keyword}"
        </div>
      )}
    </div>
  );
}

