
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Problem } from "@shared/schema";
import { DifficultyBadge } from "./difficulty-badge";
import { TagBadge } from "./tag-badge";
import { Clock, Code, Calendar } from "lucide-react";

interface ProblemCardProps {
  problem: Problem & { solutionCount?: number };
  onOpenEditor: () => void;
}

export function ProblemCard({ problem, onOpenEditor }: ProblemCardProps) {
  const formatDate = (dateInput: string | Date) => {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-md border border-gray-100 dark:border-gray-800">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold">{problem.title}</h3>
              <DifficultyBadge difficulty={problem.difficulty as "Easy" | "Medium" | "Hard"} />
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              <TagBadge tag="LeetCode" variant="platform" />
              {problem.tags && problem.tags.map((tag, index) => (
                <TagBadge key={index} tag={tag} variant="concept" />
              ))}
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
              <span className="flex items-center">
                <Code className="w-4 h-4 mr-1" />
                {problem.language}
              </span>
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Solved {formatDate(problem.submissionDate || new Date())}
              </span>
              {problem.runtime && (
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {problem.runtime}
                </span>
              )}
            </div>
          </div>
          <Button 
            onClick={onOpenEditor}
            className="ml-4 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            View Solution
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
