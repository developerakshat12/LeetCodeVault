
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProblemCard } from "@/components/problem-card";
import ResponsiveNavbar from "@/components/responsive-navbar";
import { ArrowLeft, Plus, Search, Bell, ChevronRight, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Topic, Problem, InsertProblem } from "@shared/schema";

export default function Questions() {
  const [match, params] = useRoute("/topics/:topicId/questions");
  const topicId = params?.topicId || null;
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Recently Added");
  const { toast } = useToast();

  console.log("Questions page - topicId:", topicId);

  const { data: topic } = useQuery<Topic>({
    queryKey: ["/api/topics", topicId],
    enabled: !!topicId,
  });

  const { data: problems, isLoading } = useQuery<Problem[]>({
    queryKey: ["/api/problems/topic", topicId],
    enabled: !!topicId,
  });

  // Fetch solution counts for all problems
  const { data: solutionCounts } = useQuery<Record<string, number>>({
    queryKey: ["/api/problems/solution-counts", topicId],
    queryFn: async () => {
      if (!problems || problems.length === 0) return {};
      
      const counts: Record<string, number> = {};
      await Promise.all(
        problems.map(async (problem) => {
          try {
            const response = await apiRequest("GET", `/api/problems/${problem.id}/solutions`);
            const solutions = await response.json();
            counts[problem.id] = solutions.length || 0;
          } catch (error) {
            console.error(`Error fetching solutions for problem ${problem.id}:`, error);
            counts[problem.id] = 0;
          }
        })
      );
      return counts;
    },
    enabled: !!problems && problems.length > 0,
  });

  console.log("Problems data:", problems);

  const createProblemMutation = useMutation({
    mutationFn: async (newProblem: InsertProblem) => {
      const response = await apiRequest("POST", "/api/problems", newProblem);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/problems/topic", topicId] });
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Problem created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create problem",
        variant: "destructive",
      });
    },
  });

  const handleCreateProblem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!topicId) return;

    const formData = new FormData(e.currentTarget);
    const tags = (formData.get("tags") as string).split(",").map(tag => tag.trim()).filter(Boolean);
    
    const newProblem: InsertProblem = {
      leetcodeId: Math.floor(Math.random() * 100000),
      title: formData.get("title") as string,
      titleSlug: (formData.get("title") as string).toLowerCase().replace(/\s+/g, "-"),
      difficulty: formData.get("difficulty") as "Easy" | "Medium" | "Hard",
      tags,
      submissionDate: new Date(),
      language: "cpp",
      code: `// ${formData.get("difficulty")} solution for ${formData.get("title")}
function solution() {
    // Your solution here
    return "Solution";
}`,
      userId: "current-user", // You'll need to get this from your auth system
      topicId: topicId,
    };
    createProblemMutation.mutate(newProblem);
  };

  if (!match || !topicId) {
    return <div>Topic not found</div>;
  }

  const filteredProblems = problems?.filter(problem => {
    const matchesSearch = problem.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = difficultyFilter === "All" || problem.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  }) || [];

  const sortedProblems = [...filteredProblems].sort((a, b) => {
    switch (sortBy) {
      case "Difficulty":
        const difficultyOrder = { "Easy": 1, "Medium": 2, "Hard": 3 };
        return difficultyOrder[a.difficulty as keyof typeof difficultyOrder] - difficultyOrder[b.difficulty as keyof typeof difficultyOrder];
      case "Name":
        return a.title.localeCompare(b.title);
      default: // Recently Added
        return new Date(b.submissionDate || 0).getTime() - new Date(a.submissionDate || 0).getTime();
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading problems...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Responsive Navigation */}
      <ResponsiveNavbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showSearch={true}
        title={topic?.name || "Problems"}
        subtitle={`${problems?.length || 0} problems`}
      />

      {/* Breadcrumb Navigation */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3">
          <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary">Topics</Link>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-primary">{topic?.name}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div className="flex items-start space-x-2 sm:space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mt-1">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">{topic?.name}</h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                {problems?.length || 0} problems • Last updated {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Add Problem</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Problem</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateProblem} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select name="difficulty" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Easy">Easy</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input id="tags" name="tags" placeholder="Array, Hash Table, etc." />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createProblemMutation.isPending}>
                    {createProblemMutation.isPending ? "Creating..." : "Create Problem"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter and Sort */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex flex-wrap gap-2">
            {["All", "Easy", "Medium", "Hard"].map((difficulty) => (
              <Button
                key={difficulty}
                variant={difficultyFilter === difficulty ? "default" : "outline"}
                size="sm"
                onClick={() => setDifficultyFilter(difficulty)}
                className="text-xs sm:text-sm"
              >
                {difficulty}
              </Button>
            ))}
          </div>
          <div className="flex items-center space-x-2 sm:ml-auto">
            <Filter className="w-4 h-4 text-muted-foreground sm:hidden" />
            <span className="text-xs sm:text-sm text-muted-foreground">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Recently Added">Recently Added</SelectItem>
                <SelectItem value="Difficulty">Difficulty</SelectItem>
                <SelectItem value="Name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Problems List */}
        <div className="space-y-3 sm:space-y-4">
          {sortedProblems.map((problem) => (
            <ProblemCard
              key={problem.id}
              problem={{
                ...problem,
                solutionCount: solutionCounts?.[problem.id] || 0
              }}
              onOpenEditor={() => window.location.href = `/problems/${problem.id}/editor`}
            />
          ))}
        </div>

        {sortedProblems.length === 0 && !isLoading && (
          <div className="text-center py-8 sm:py-12">
            <p className="text-muted-foreground text-base sm:text-lg mb-4 px-4">
              {searchQuery || difficultyFilter !== "All" 
                ? "No problems found matching your filters." 
                : "No problems in this topic yet."}
            </p>
            {!searchQuery && difficultyFilter === "All" && (
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add your first problem
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
