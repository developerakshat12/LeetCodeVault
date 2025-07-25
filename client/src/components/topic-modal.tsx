import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Calendar, X, ArrowRight, ExternalLink, Code } from "lucide-react";
import { Link } from "wouter";
import { TOPIC_COLORS } from "@/lib/constants";

interface TopicModalProps {
  topicId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function TopicModal({ topicId, isOpen, onClose }: TopicModalProps) {
  const { data: topic } = useQuery<any>({
    queryKey: ["/api/topics", topicId],
    enabled: !!topicId,
  });

  const { data: problems = [] } = useQuery<any[]>({
    queryKey: ["/api/problems/topic", topicId],
    enabled: !!topicId,
  });

  if (!topic) return null;

  const colorClass = TOPIC_COLORS[topic.color] || TOPIC_COLORS.blue;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "bg-green-500 text-white";
      case "medium":
        return "bg-yellow-500 text-black";
      case "hard":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 ${colorClass} rounded-lg flex items-center justify-center`}>
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"></path>
              </svg>
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">{topic.name}</DialogTitle>
              <p className="text-muted-foreground">{topic.description}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-96">
          {problems.length > 0 ? (
            <div className="space-y-4">
              {problems.map((problem: any) => (
                <Card key={problem.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Badge 
                          variant="secondary" 
                          className={getDifficultyColor(problem.difficulty)}
                        >
                          {problem.difficulty}
                        </Badge>
                        <h4 className="text-lg font-semibold">{problem.title}</h4>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {problem.submissionDate ? 
                            new Date(problem.submissionDate).toLocaleDateString() : 
                            "Unknown"
                          }
                        </span>
                        {problem.language && (
                          <>
                            <span>•</span>
                            <Code className="h-4 w-4" />
                            <span>{problem.language}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {problem.tags && problem.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {problem.tags.map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {problem.description && (
                      <div className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {problem.description}
                      </div>
                    )}

                    <div className="flex items-center space-x-4">
                      <Button variant="outline" size="sm" className="flex items-center space-x-2">
                        <ExternalLink className="h-4 w-4" />
                        <span>View on LeetCode</span>
                      </Button>
                      {problem.runtime && (
                        <span className="text-xs text-muted-foreground">
                          Runtime: {problem.runtime}
                        </span>
                      )}
                      {problem.memory && (
                        <span className="text-xs text-muted-foreground">
                          Memory: {problem.memory}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-muted-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h4 className="text-lg font-semibold text-muted-foreground mb-2">No problems yet</h4>
              <p className="text-muted-foreground text-sm">
                Solve some LeetCode problems in this category to see them here.
              </p>
            </div>
          )}
        </div>

        <div className="border-t pt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {problems.length} problems in this topic
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              Export
            </Button>
            <Button>
              Refresh Data
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}