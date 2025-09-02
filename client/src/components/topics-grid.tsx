import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TOPIC_COLORS } from "@/lib/constants";
import { useLocation } from "wouter";

interface TopicsGridProps {
  searchQuery: string;
  userId?: string;
  onTopicClick: (topicId: string) => void;
}

export default function TopicsGrid({ searchQuery, userId }: TopicsGridProps) {
  const [, setLocation] = useLocation();
  const { data: topics = [], isLoading } = useQuery<any[]>({
    queryKey: userId ? [`/api/topics?userId=${userId}`] : ["/api/topics"],
  });

  const filteredTopics = topics.filter((topic: any) =>
    topic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Topics</h2>
          <div className="text-sm text-muted-foreground">
            Loading topics...
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded mb-4"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded mb-4"></div>
                <div className="flex space-x-2">
                  <div className="h-5 w-12 bg-muted rounded"></div>
                  <div className="h-5 w-12 bg-muted rounded"></div>
                  <div className="h-5 w-12 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Topics</h2>
        <div className="text-sm text-muted-foreground">
          Organize your DSA practice by topic
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTopics.map((topic: any) => {
          const colorClass = TOPIC_COLORS[topic.color] || TOPIC_COLORS.blue;
          
          return (
            <Card
              key={topic.id}
              className={`${colorClass} cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg`}
              onClick={() => setLocation(`/topics/${topic.id}/questions`)}
            >
              <CardContent className="p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"></path>
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{topic.totalProblems || 0}</div>
                    <div className="text-sm opacity-80">problems</div>
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold mb-2">{topic.name}</h3>
                <p className="text-sm opacity-80 mb-4">{topic.description}</p>
                
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-green-500 text-white hover:bg-green-500">
                    {topic.easy || 0} Easy
                  </Badge>
                  <Badge variant="secondary" className="bg-yellow-500 text-black hover:bg-yellow-500">
                    {topic.medium || 0} Medium
                  </Badge>
                  <Badge variant="secondary" className="bg-red-500 text-white hover:bg-red-500">
                    {topic.hard || 0} Hard
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
