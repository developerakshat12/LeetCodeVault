
import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CodeEditor } from "@/components/code-editor";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { TagBadge } from "@/components/tag-badge";
import { ArrowLeft, Plus, ChevronRight, X, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Problem } from "@shared/schema";
import { debounce } from 'lodash';

interface Solution {
  id: string;
  name: string;
  approach: string;
  timeComplexity: string;
  spaceComplexity: string;
  explanation: string;
  code: string;
  language: string;
  notes: string;
  problemId: string;
}

interface InsertSolution {
  problemId: string;
  name: string;
  approach: string;
  timeComplexity: string;
  spaceComplexity: string;
  explanation: string;
  code: string;
  language: string;
  notes: string;
}

export default function Editor() {
  const [match, params] = useRoute("/problems/:problemId/editor");
  const problemId = params?.problemId || null;
  const [activeSolutionIndex, setActiveSolutionIndex] = useState(0);
  const { toast } = useToast();

  // Local state for form inputs to prevent UI lag
  const [localFormData, setLocalFormData] = useState<Record<string, Partial<InsertSolution>>>({});

  const { data: problem, isLoading: problemLoading } = useQuery<Problem>({
    queryKey: ["/api/problems", problemId],
    enabled: !!problemId,
  });

  const { data: topic } = useQuery<any>({
    queryKey: ["/api/topics", problem?.topicId],
    enabled: !!problem?.topicId,
  });

  // For now, we'll create a mock solution from the problem data until backend is updated
  const solutions: Solution[] = problem ? [{
    id: "1",
    name: "LeetCode Solution",
    approach: "Imported from LeetCode",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    explanation: "", // Empty for user to fill
    code: problem.code || "// No code available",
    language: problem.language || "cpp",
    notes: "", // Empty for user to fill
    problemId: problemId!
  }] : [];

  // Initialize local form data when problem is loaded
  useEffect(() => {
    if (problem && solutions.length > 0) {
      const initialFormData: Record<string, Partial<InsertSolution>> = {};
      solutions.forEach(solution => {
        initialFormData[solution.id] = {
          name: solution.name,
          timeComplexity: solution.timeComplexity,
          spaceComplexity: solution.spaceComplexity,
          explanation: solution.explanation,
          notes: solution.notes,
          code: solution.code,
          language: solution.language
        };
      });
      setLocalFormData(initialFormData);
    }
  }, [problem]);

  // Create debounced update function with cleanup
  const debouncedUpdateRef = useRef(
    debounce((id: string, updates: Partial<InsertSolution>) => {
      // For now, just update local state. Backend integration can be added later
      console.log("Would update solution:", id, updates);
    }, 1000)
  );

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedUpdateRef.current.cancel();
    };
  }, []);

  if (!match || !problemId) {
    return <div>Problem not found</div>;
  }

  const handleAddSolution = () => {
    // Mock adding a new solution
    const nextSolutionNumber = solutions.length + 1;
    toast({
      title: "Info",
      description: "Solution management will be available in a future update",
    });
  };

  // Updated handler to use local state and debounced updates
  const handleUpdateSolution = (id: string, updates: Partial<InsertSolution>) => {
    // Update local state immediately for responsive UI
    setLocalFormData(prev => ({
      ...prev,
      [id]: { ...prev[id], ...updates }
    }));

    // Debounce the API call
    debouncedUpdateRef.current(id, updates);
  };

  const handleDeleteSolution = (solutionId: string) => {
    toast({
      title: "Info",
      description: "Solution management will be available in a future update",
    });
  };

  const activeSolution = solutions[activeSolutionIndex];
  const activeSolutionLocalData = activeSolution ? localFormData[activeSolution.id] : null;

  if (problemLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading editor...</p>
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
      {/* Navigation Bar */}
      <nav className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-primary">DSA Journal</h1>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-primary">Topics</Link>
              <ChevronRight className="w-4 h-4" />
              <Link href={`/topics/${topic?.id}/questions`} className="hover:text-primary">{topic?.name}</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-primary">{problem.title}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link href={`/topics/${topic?.id}/questions`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold">{problem.title}</h2>
              <div className="flex items-center space-x-2 mt-1">
                <DifficultyBadge difficulty={problem.difficulty as "Easy" | "Medium" | "Hard"} />
                <TagBadge tag="LeetCode" variant="platform" />
                {problem.tags && problem.tags.map((tag, index) => (
                  <TagBadge key={index} tag={tag} variant="concept" />
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handleAddSolution} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Solution
            </Button>
            <Button variant="outline" asChild>
              <a 
                href={`https://leetcode.com/problems/${problem.titleSlug}/`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in LeetCode
              </a>
            </Button>
          </div>
        </div>

        {/* Solution Tabs */}
        {solutions && solutions.length > 0 && (
          <Tabs value={activeSolutionIndex.toString()} onValueChange={(value) => setActiveSolutionIndex(parseInt(value))}>
            <TabsList className="mb-4">
              {solutions.map((solution, index) => (
                <TabsTrigger key={solution.id} value={index.toString()} className="flex items-center space-x-2">
                  <span>{localFormData[solution.id]?.name ?? solution.name}</span>
                  {solutions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSolution(solution.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {solutions.map((solution, index) => {
              const solutionLocalData = localFormData[solution.id] || {};

              return (
                <TabsContent key={solution.id} value={index.toString()}>
                  {/* Editor Layout */}
                  <div className="grid grid-cols-2 gap-6 min-h-[600px]">
                    {/* Left Panel: Explanation */}
                    <Card className="flex flex-col">
                      <CardHeader className="border-b border-border sticky top-0 bg-background">
                        <h3 className="font-semibold">Explanation & Analysis</h3>
                      </CardHeader>
                      <CardContent className="p-4 space-y-4 h-full overflow-y-auto">
                        {/* Approach Name */}
                        <div>
                          <Label className="text-sm font-medium mb-2">Approach Name</Label>
                          <Input
                            value={solutionLocalData.name ?? solution.name}
                            onChange={(e) => handleUpdateSolution(solution.id, { name: e.target.value })}
                          />
                        </div>

                        {/* Complexity Analysis */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium mb-2">Time Complexity</Label>
                            <Input
                              value={solutionLocalData.timeComplexity ?? solution.timeComplexity}
                              onChange={(e) => handleUpdateSolution(solution.id, { timeComplexity: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2">Space Complexity</Label>
                            <Input
                              value={solutionLocalData.spaceComplexity ?? solution.spaceComplexity}
                              onChange={(e) => handleUpdateSolution(solution.id, { spaceComplexity: e.target.value })}
                            />
                          </div>
                        </div>

                        {/* Explanation */}
                        <div>
                          <Label className="text-sm font-medium mb-2">Explanation</Label>
                          <Textarea
                            rows={12}
                            value={solutionLocalData.explanation ?? solution.explanation}
                            onChange={(e) => handleUpdateSolution(solution.id, { explanation: e.target.value })}
                            placeholder="Explain your approach here..."
                            className="resize-none"
                          />
                        </div>

                        {/* Notes */}
                        <div>
                          <Label className="text-sm font-medium mb-2">Additional Notes</Label>
                          <Textarea
                            rows={4}
                            value={solutionLocalData.notes ?? solution.notes}
                            onChange={(e) => handleUpdateSolution(solution.id, { notes: e.target.value })}
                            placeholder="Any additional notes or observations..."
                            className="resize-none"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Right Panel: Code Editor */}
                    <CodeEditor
                      code={solutionLocalData.code ?? solution.code}
                      language={solutionLocalData.language ?? solution.language}
                      onCodeChange={(code) => handleUpdateSolution(solution.id, { code })}
                      onLanguageChange={(language) => handleUpdateSolution(solution.id, { language })}
                      titleSlug={problem.titleSlug}
                    />
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        )}

        {(!solutions || solutions.length === 0) && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-4">No solutions yet.</p>
            <Button onClick={handleAddSolution}>
              <Plus className="w-4 h-4 mr-2" />
              Add your first solution
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
