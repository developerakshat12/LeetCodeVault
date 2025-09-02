
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
import { VideosList } from "@/components/VideosList";
import ResponsiveNavbar from "@/components/responsive-navbar";
import { ArrowLeft, Plus, ChevronRight, X, ExternalLink, Github, Menu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Problem, Solution, InsertSolution } from "@shared/schema";
import { debounce } from 'lodash';

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

  // Check if topicId is actually a user ID (24-char MongoDB ObjectId that doesn't match known topic pattern)
  const isUserIdAsTopicId = problem?.topicId && 
    problem.topicId.length === 24 && 
    /^[0-9a-fA-F]{24}$/.test(problem.topicId); // MongoDB ObjectId pattern

  const { data: topic } = useQuery<any>({
    queryKey: ["/api/topics", problem?.topicId],
    enabled: !!problem?.topicId && !isUserIdAsTopicId, // Only fetch if it's likely a real topic ID
  });

  // If topicId looks like a user ID, fetch all topics to find correct one by tags
  const { data: allTopics } = useQuery<any[]>({
    queryKey: ["/api/topics"],
    enabled: !!isUserIdAsTopicId, // Only fetch when topicId looks like user ID
  });

  // Determine the correct topic if we have problem tags but no topic
  const actualTopic = topic || (allTopics && problem?.tags && problem.tags.length > 0 ? 
    allTopics.find(t => 
      problem.tags!.some(tag => 
        t.name.toLowerCase().includes(tag.toLowerCase()) || 
        tag.toLowerCase().includes(t.name.toLowerCase())
      )
    ) || allTopics.find(t => t.name === "Array") // Default fallback
    : null);

  // Fetch solutions for this problem
  const { data: solutions, isLoading: solutionsLoading } = useQuery<Solution[]>({
    queryKey: ["/api/problems", problemId, "solutions"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/problems/${problemId}/solutions`);
      return response.json();
    },
    enabled: !!problemId,
  });

  // Mutations for solution management
  const createSolutionMutation = useMutation({
    mutationFn: async (newSolution: InsertSolution) => {
      const response = await apiRequest("POST", "/api/solutions", newSolution);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/problems", problemId, "solutions"] });
      toast({
        title: "Success",
        description: "Solution created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create solution",
        variant: "destructive",
      });
    },
  });

  const updateSolutionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Solution> }) => {
      const response = await apiRequest("PATCH", `/api/solutions/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/problems", problemId, "solutions"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update solution",
        variant: "destructive",
      });
    },
  });

  const deleteSolutionMutation = useMutation({
    mutationFn: async (solutionId: string) => {
      await apiRequest("DELETE", `/api/solutions/${solutionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/problems", problemId, "solutions"] });
      setActiveSolutionIndex(0);
      toast({
        title: "Success",
        description: "Solution deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to delete solution",
        variant: "destructive",
      });
    },
  });

  // Initialize local form data when solutions are loaded
  useEffect(() => {
    if (solutions && solutions.length > 0) {
      const initialFormData: Record<string, Partial<InsertSolution>> = {};
      solutions.forEach(solution => {
        initialFormData[solution.id] = {
          name: solution.name,
          timeComplexity: solution.timeComplexity,
          spaceComplexity: solution.spaceComplexity,
          explanation: solution.explanation || '',
          notes: solution.notes || '',
          code: solution.code,
          language: solution.language
        };
      });
      setLocalFormData(initialFormData);
    }
  }, [solutions]);

  // Create debounced update function with real API integration
  const debouncedUpdateRef = useRef(
    debounce((id: string, updates: Partial<InsertSolution>) => {
      updateSolutionMutation.mutate({ id, updates });
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
    if (!problemId) return;
    
    const nextSolutionNumber = (solutions?.length || 0) + 1;
    const newSolution: InsertSolution = {
      problemId,
      name: `Solution-${nextSolutionNumber}`,
      approach: "Describe your approach here",
      timeComplexity: "O(n)",
      spaceComplexity: "O(1)",
      explanation: "",
      code: "// Your solution here",
      language: "cpp",
      notes: "",
    };
    
    createSolutionMutation.mutate(newSolution);
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
    deleteSolutionMutation.mutate(solutionId);
  };

  const activeSolution = solutions && solutions.length > 0 ? solutions[activeSolutionIndex] : null;
  const activeSolutionLocalData = activeSolution ? localFormData[activeSolution.id] : null;

  if (problemLoading || solutionsLoading) {
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
      {/* Responsive Navigation */}
      <ResponsiveNavbar
        showSearch={false}
        title="Code Editor"
        subtitle="Write and analyze your solutions"
      />

      {/* Breadcrumb Navigation */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3">
          <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-muted-foreground overflow-x-auto">
            <Link href="/" className="hover:text-primary whitespace-nowrap">Topics</Link>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <Link href={`/topics/${actualTopic?.id}/questions`} className="hover:text-primary whitespace-nowrap">
              {actualTopic?.name}
            </Link>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="text-primary truncate">{problem.title}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Problem Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-4 sm:space-y-0">
          <div className="flex items-start space-x-2 sm:space-x-4">
            <Link href={`/topics/${actualTopic?.id}/questions`}>
              <Button variant="ghost" size="sm" className="mt-1">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold mb-2">{problem.title}</h2>
              <div className="flex flex-wrap items-center gap-2">
                <DifficultyBadge difficulty={problem.difficulty as "Easy" | "Medium" | "Hard"} />
                <TagBadge tag="LeetCode" variant="platform" />
                {problem.tags && problem.tags.map((tag, index) => (
                  <TagBadge key={index} tag={tag} variant="concept" />
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handleAddSolution} variant="outline" className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Add Solution</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Solution Tabs */}
        {solutions && solutions.length > 0 && (
          <Tabs value={activeSolutionIndex.toString()} onValueChange={(value) => setActiveSolutionIndex(parseInt(value))}>
            <div className="overflow-x-auto mb-4">
              <TabsList className="w-full sm:w-auto">
                {solutions.map((solution, index) => {
                  const isGitHubImport = solution.approach === "GitHub Import";
                  return (
                    <TabsTrigger 
                      key={solution.id} 
                      value={index.toString()} 
                      className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
                    >
                      <span className="truncate max-w-[80px] sm:max-w-none">
                        {localFormData[solution.id]?.name ?? solution.name}
                      </span>
                      {isGitHubImport && (
                        <Github className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      )}
                      {solutions.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-3 w-3 sm:h-4 sm:w-4 p-0 ml-1 sm:ml-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSolution(solution.id);
                          }}
                        >
                          <X className="h-2 w-2 sm:h-3 sm:w-3" />
                        </Button>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {solutions.map((solution, index) => {
              const solutionLocalData = localFormData[solution.id] || {};

              return (
                <TabsContent key={solution.id} value={index.toString()}>
                  {/* Responsive Editor Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 min-h-[400px] lg:min-h-[600px]">
                    {/* Left Panel: Explanation */}
                    <Card className="flex flex-col order-2 lg:order-1">
                      <CardHeader className="border-b border-border bg-background p-3 sm:p-4">
                        <h3 className="font-semibold text-sm sm:text-base">Explanation & Analysis</h3>
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4 h-full overflow-y-auto">
                        {/* Approach Name */}
                        <div>
                          <Label className="text-xs sm:text-sm font-medium mb-2">Approach Name</Label>
                          <Input
                            value={solutionLocalData.name ?? solution.name}
                            onChange={(e) => handleUpdateSolution(solution.id, { name: e.target.value })}
                            className="text-sm"
                          />
                        </div>

                        {/* GitHub Import Info */}
                        {solution.approach === "GitHub Import" && (
                          <div className="bg-muted p-2 sm:p-3 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <Github className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="text-xs sm:text-sm font-medium">GitHub Import</span>
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              {solution.notes && (
                                <div>Source: {solution.notes}</div>
                              )}
                              <div>Imported: {new Date(solution.createdAt).toLocaleDateString()}</div>
                            </div>
                          </div>
                        )}

                        {/* Complexity Analysis */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <Label className="text-xs sm:text-sm font-medium mb-2">Time Complexity</Label>
                            <Input
                              value={solutionLocalData.timeComplexity ?? solution.timeComplexity}
                              onChange={(e) => handleUpdateSolution(solution.id, { timeComplexity: e.target.value })}
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs sm:text-sm font-medium mb-2">Space Complexity</Label>
                            <Input
                              value={solutionLocalData.spaceComplexity ?? solution.spaceComplexity}
                              onChange={(e) => handleUpdateSolution(solution.id, { spaceComplexity: e.target.value })}
                              className="text-sm"
                            />
                          </div>
                        </div>

                        {/* Explanation */}
                        <div>
                          <Label className="text-xs sm:text-sm font-medium mb-2">Explanation</Label>
                          <Textarea
                            rows={8}
                            value={solutionLocalData.explanation ?? solution.explanation ?? ''}
                            onChange={(e) => handleUpdateSolution(solution.id, { explanation: e.target.value })}
                            placeholder="Explain your approach here..."
                            className="resize-none text-sm"
                          />
                        </div>

                        {/* Notes */}
                        <div>
                          <Label className="text-xs sm:text-sm font-medium mb-2">Additional Notes</Label>
                          <Textarea
                            rows={3}
                            value={solutionLocalData.notes ?? solution.notes ?? ''}
                            onChange={(e) => handleUpdateSolution(solution.id, { notes: e.target.value })}
                            placeholder="Any additional notes or observations..."
                            className="resize-none text-sm"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Right Panel: Code Editor */}
                    <div className="order-1 lg:order-2">
                      <CodeEditor
                        code={solutionLocalData.code ?? solution.code}
                        language={solutionLocalData.language ?? solution.language}
                        onCodeChange={(code) => handleUpdateSolution(solution.id, { code })}
                        onLanguageChange={(language) => handleUpdateSolution(solution.id, { language })}
                        titleSlug={problem.titleSlug}
                      />
                    </div>
                  </div>

                  {/* Video Learning Resources for this solution */}
                  <div className="mt-6 sm:mt-8">
                    <VideosList 
                      problemTitle={problem.title}
                      tags={problem.tags || []}
                    />
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        )}

        {/* Empty state when no solutions */}
        {(!solutions || solutions.length === 0) && !solutionsLoading && (
          <div className="text-center py-8 sm:py-12">
            <p className="text-muted-foreground text-base sm:text-lg mb-4">No solutions yet.</p>
            <Button 
              onClick={handleAddSolution} 
              disabled={createSolutionMutation.isPending}
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              {createSolutionMutation.isPending ? "Creating..." : "Add your first solution"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
