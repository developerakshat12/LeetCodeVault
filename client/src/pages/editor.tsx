
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeEditor } from "@/components/code-editor";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { TagBadge } from "@/components/tag-badge";
import { ArrowLeft, ExternalLink, Clock, Database } from "lucide-react";
import type { Problem } from "@shared/schema";

interface Solution {
  id: string;
  language: string;
  code: string;
  timeComplexity: string;
  spaceComplexity: string;
  runtime: string;
  memory: string;
}

export default function Editor() {
  const [match, params] = useRoute("/problems/:problemId/editor");
  const problemId = params?.problemId || null;

  const { data: problem, isLoading } = useQuery<Problem>({
    queryKey: ["/api/problems", problemId],
    enabled: !!problemId,
  });

  const [solutions, setSolutions] = useState<Solution[]>([]);

  useEffect(() => {
    if (problem) {
      // Convert the fetched problem to a solution format
      const solution: Solution = {
        id: "1",
        language: problem.language || "cpp",
        code: problem.code || "// No code available",
        timeComplexity: "O(n)", // Default value since LeetCode API doesn't provide this
        spaceComplexity: "O(1)", // Default value since LeetCode API doesn't provide this
        runtime: problem.runtime || "N/A",
        memory: problem.memory || "N/A",
      };
      setSolutions([solution]);
    }
  }, [problem]);

  const handleAddSolution = () => {
    const newSolution: Solution = {
      id: (solutions.length + 1).toString(),
      language: "cpp",
      code: `// New ${problem?.language || "cpp"} solution for ${problem?.title}
function solution() {
    // Your solution here
    return "Solution";
}`,
      timeComplexity: "O(n)",
      spaceComplexity: "O(1)",
      runtime: "N/A",
      memory: "N/A",
    };
    setSolutions([...solutions, newSolution]);
  };

  const handleSaveSolution = (solution: Solution) => {
    console.log("Saving solution:", solution);
    // Here you would implement saving logic to your backend
  };

  if (!match || !problemId) {
    return <div>Problem not found</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading problem...</p>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground text-lg mb-4">Problem not found</p>
          <Link href="/">
            <Button>Go back to topics</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link href={`/topics/${problem.topicId}/questions`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{problem.title}</h1>
            <DifficultyBadge difficulty={problem.difficulty as "Easy" | "Medium" | "Hard"} />
            <Button variant="outline" size="sm" asChild>
              <a 
                href={`https://leetcode.com/problems/${problem.titleSlug}/`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open on LeetCode
              </a>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Problem Description */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Problem Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <TagBadge tag="LeetCode" variant="platform" />
                    {problem.tags && problem.tags.map((tag, index) => (
                      <TagBadge key={index} tag={tag} variant="concept" />
                    ))}
                  </div>
                  
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p>{problem.description || "No description available for this problem."}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-muted rounded-lg p-4">
                      <div className="flex items-center text-sm text-muted-foreground mb-1">
                        <Clock className="w-4 h-4 mr-1" />
                        Runtime
                      </div>
                      <div className="font-semibold">{problem.runtime}</div>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <div className="flex items-center text-sm text-muted-foreground mb-1">
                        <Database className="w-4 h-4 mr-1" />
                        Memory
                      </div>
                      <div className="font-semibold">{problem.memory}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Code Editor */}
          <div className="space-y-6">
            <CodeEditor
              solutions={solutions}
              onAddSolution={handleAddSolution}
              onSaveSolution={handleSaveSolution}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
