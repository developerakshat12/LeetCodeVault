
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
import { ArrowLeft, Plus, Save, ChevronRight, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Problem, Solution, InsertSolution, Topic } from "@shared/schema";
import { debounce } from 'lodash';

export default function Editor() {
  const [match, params] = useRoute("/problems/:problemId/editor");
  const problemId = params?.problemId || null;
  const [activeSolutionIndex, setActiveSolutionIndex] = useState(0);
  const { toast } = useToast();

  // Local state for form inputs to prevent UI lag
  const [localFormData, setLocalFormData] = useState<Record<string, Partial<InsertSolution>>>({});

  const { data: problem } = useQuery<Problem>({
    queryKey: ["/api/problems", problemId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/problems/${problemId}`);
      return response.json();
    },
    enabled: !!problemId,
  });

  const { data: topic } = useQuery<Topic>({
    queryKey: ["/api/topics", problem?.topicId],
    enabled: !!problem?.topicId,
  });

  const { data: solutions, isLoading } = useQuery<Solution[]>({
    queryKey: ["/api/problems", problemId, "solutions"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/problems/${problemId}/solutions`);
      return response.json();
    },
    enabled: !!problemId,
  });

  // Initialize local form data when solutions are loaded
  useEffect(() => {
    if (solutions) {
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
  }, [solutions]);

  const updateSolutionMutation = useMutation({
    mutationFn: async ({ id, solution }: { id: string; solution: Partial<InsertSolution> }) => {
      const response = await apiRequest("PUT", `/api/solutions/${id}`, solution);
      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      // Silently update - no toast for auto-saves
      queryClient.invalidateQueries({ queryKey: ["/api/problems", problemId, "solutions"] });
    },
    onError: (error) => {
      console.error("Update solution error:", error);
      toast({
        title: "Error",
        description: "Failed to update solution",
        variant: "destructive",
      });
    },
  });

  // Create debounced update function with cleanup
  const debouncedUpdateRef = useRef(
    debounce((id: string, updates: Partial<InsertSolution>) => {
      updateSolutionMutation.mutate({ id, solution: updates });
    }, 1000)
  );

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedUpdateRef.current.cancel();
    };
  }, []);

  const createSolutionMutation = useMutation({
    mutationFn: async (newSolution: InsertSolution) => {
      const response = await apiRequest("POST", "/api/solutions", newSolution);
      const result = await response.json();
      return result;
    },
    onSuccess: (newSolution) => {
      queryClient.invalidateQueries({ queryKey: ["/api/problems", problemId, "solutions"] });

      // Only initialize local form data if we have an ID
      if (newSolution?.id) {
        setLocalFormData(prev => ({
          ...prev,
          [newSolution.id]: {
            name: newSolution.name,
            timeComplexity: newSolution.timeComplexity,
            spaceComplexity: newSolution.spaceComplexity,
            explanation: newSolution.explanation,
            notes: newSolution.notes,
            code: newSolution.code,
            language: newSolution.language
          }
        }));

        // Set the active solution to the newly created one
        if (solutions) {
          setActiveSolutionIndex(solutions.length);
        }
      }

      toast({
        title: "Success",
        description: "Solution created successfully",
      });
    },
    onError: (error) => {
      console.error("Create solution error:", error);
      toast({
        title: "Error",
        description: "Failed to create solution",
        variant: "destructive",
      });
    },
  });

  const deleteSolutionMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/solutions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/problems", problemId, "solutions"] });
      toast({
        title: "Success",
        description: "Solution deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Delete solution error:", error);
      toast({
        title: "Error",
        description: "Failed to delete solution",
        variant: "destructive",
      });
    },
  });

  if (!match || !problemId) {
    return <div>Problem not found</div>;
  }

  const handleAddSolution = () => {
    if (!problemId) return;

    const nextSolutionNumber = (solutions?.length || 0) + 1;
    const newSolutionName = `Solution ${nextSolutionNumber}`;

    const newSolution: InsertSolution = {
      problemId: problemId,
      name: newSolutionName,
      approach: "New Approach",
      timeComplexity: "O()",
      spaceComplexity: "O()",
      explanation: "",
      code: "// Write your solution here\nfunction solution() {\n  // Your code here\n}",
      language: "javascript",
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
    if (solutions && solutions.length <= 1) {
      toast({
        title: "Cannot delete",
        description: "You must have at least one solution",
        variant: "destructive",
      });
      return;
    }

    // Clean up local form data
    setLocalFormData(prev => {
      const newData = { ...prev };
      delete newData[solutionId];
      return newData;
    });

    deleteSolutionMutation.mutate(solutionId);
    if (activeSolutionIndex >= (solutions?.length || 1) - 1) {
      setActiveSolutionIndex(Math.max(0, activeSolutionIndex - 1));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading editor...</p>
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
              <Link href={`/topics/${topic?.id}`} className="hover:text-primary">{topic?.name}</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-primary">{problem?.title}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link href={`/topics/${topic?.id}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold">{problem?.title}</h2>
              <div className="flex items-center space-x-2 mt-1">
                <DifficultyBadge difficulty={problem?.difficulty as "Easy" | "Medium" | "Hard"} />
                <TagBadge tag={problem?.platform || "LeetCode"} variant="platform" />
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handleAddSolution} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Solution
            </Button>
            <Button variant="ghost" size="sm">
              <Save className="w-4 h-4" />
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
