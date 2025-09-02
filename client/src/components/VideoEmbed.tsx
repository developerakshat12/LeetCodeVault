interface VideoEmbedProps {
  videoId: string;
  title?: string;
  width?: number | string;
  height?: number;
  className?: string;
}

export function VideoEmbed({ 
  videoId, 
  title = "YouTube video",
  width = 320,
  height = 180,
  className = ""
}: VideoEmbedProps) {
  if (!videoId) {
    return (
      <div 
        className={`bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 ${className}`}
        style={{ width: typeof width === 'string' ? undefined : width, height }}
      >
        No video available
      </div>
    );
  }

  // If width is a string (like "100%"), use responsive approach
  if (typeof width === 'string') {
    return (
      <div className={`relative rounded-lg overflow-hidden shadow-md ${className}`} style={{ width }}>
        <div className="relative" style={{ paddingBottom: `${(height / 320) * 100}%` }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden shadow-md ${className}`}>
      <iframe
        width={width}
        height={height}
        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
        title={title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="rounded-lg"
      />
    </div>
  );
}
