
<old_str>import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProblemCard } from "@/components/problem-card";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { TagBadge } from "@/components/tag-badge";
import { ArrowLeft, Plus, Filter, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Problem, Topic } from "@shared/schema";

export default function Questions() {
  const [match, params] = useRoute("/topics/:topicId/questions");
  const topicId = params?.topicId || null;
  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const { toast } = useToast();

  // Fetch topic details
  const { data: topic } = useQuery({
    queryKey: ["/api/topics", topicId],
    queryFn: () => apiRequest(`/api/topics/${topicId}`),
    enabled: !!topicId,
  });

  // Fetch problems for this topic
  const { data: problems = [], isLoading } = useQuery({
    queryKey: ["/api/problems/topic", topicId],
    queryFn: () => apiRequest(`/api/problems/topic/${topicId}`),
    enabled: !!topicId,
  });

  const filteredProblems = problems.filter((problem: Problem & { solutionCount: number }) => {
    const matchesSearch = problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         problem.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDifficulty = difficultyFilter === "all" || problem.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  if (!topicId) {
    return <div>Invalid topic</div>;
  }

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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Topics
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{topic?.name || "Loading..."}</h1>
              <p className="text-muted-foreground">
                {filteredProblems.length} problem{filteredProblems.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search problems by title or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              <SelectItem value="Easy">Easy</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Problems Grid */}
        {filteredProblems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No problems found</p>
            {searchTerm || difficultyFilter !== "all" ? (
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your search or filter criteria
              </p>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredProblems.map((problem: Problem & { solutionCount: number }) => (
              <ProblemCard
                key={problem.id}
                problem={problem}
                onOpenEditor={() => {
                  window.location.href = `/problems/${problem.id}/editor`;
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}</old_str>
<new_str>import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProblemCard } from "@/components/problem-card";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { TagBadge } from "@/components/tag-badge";
import { ArrowLeft, Plus, Filter, Search, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Problem, Topic } from "@shared/schema";

export default function Questions() {
  const [match, params] = useRoute("/topics/:topicId/questions");
  const topicId = params?.topicId || null;
  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const { toast } = useToast();

  // Fetch topic details
  const { data: topic } = useQuery({
    queryKey: ["/api/topics", topicId],
    queryFn: () => apiRequest(`/api/topics/${topicId}`),
    enabled: !!topicId,
  });

  // Fetch problems for this topic
  const { data: problems = [], isLoading } = useQuery({
    queryKey: ["/api/problems/topic", topicId],
    queryFn: () => apiRequest(`/api/problems/topic/${topicId}`),
    enabled: !!topicId,
  });

  const filteredProblems = problems.filter((problem: Problem & { solutionCount: number }) => {
    const matchesSearch = problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         problem.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDifficulty = difficultyFilter === "all" || problem.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  if (!topicId) {
    return <div>Invalid topic</div>;
  }

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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Topics
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{topic?.name || "Loading..."}</h1>
              <p className="text-muted-foreground">
                {filteredProblems.length} problem{filteredProblems.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search problems by title or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              <SelectItem value="Easy">Easy</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Problems Grid */}
        {filteredProblems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No problems found</p>
            {searchTerm || difficultyFilter !== "all" ? (
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your search or filter criteria
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">
                Fetch LeetCode data from the home page to see problems here
              </p>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredProblems.map((problem: Problem & { solutionCount: number }) => (
              <Card key={problem.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedProblem(problem)}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold">{problem.title}</h3>
                        <DifficultyBadge difficulty={problem.difficulty} />
                        <Badge variant="outline" className="text-xs">
                          {problem.solutionCount} solution{problem.solutionCount !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {problem.tags.map((tag) => (
                          <TagBadge key={tag} tag={tag} />
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center space-x-4">
                          <span>Language: {problem.language}</span>
                          <span>Runtime: {problem.runtime}</span>
                          <span>Memory: {problem.memory}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={(e) => {
                            e.stopPropagation();
                            window.open(`https://leetcode.com/problems/${problem.titleSlug}/`, '_blank');
                          }}>
                            <ExternalLink className="w-4 h-4 mr-1" />
                            LeetCode
                          </Button>
                          <Button onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/problems/${problem.id}/editor`;
                          }}>
                            Open Editor
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Problem Detail Modal */}
        <Dialog open={!!selectedProblem} onOpenChange={() => setSelectedProblem(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-3">
                <span>{selectedProblem?.title}</span>
                <DifficultyBadge difficulty={selectedProblem?.difficulty || "Medium"} />
              </DialogTitle>
            </DialogHeader>
            
            {selectedProblem && (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {selectedProblem.tags.map((tag) => (
                    <TagBadge key={tag} tag={tag} />
                  ))}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Language:</span>
                    <p className="text-muted-foreground">{selectedProblem.language}</p>
                  </div>
                  <div>
                    <span className="font-medium">Runtime:</span>
                    <p className="text-muted-foreground">{selectedProblem.runtime}</p>
                  </div>
                  <div>
                    <span className="font-medium">Memory:</span>
                    <p className="text-muted-foreground">{selectedProblem.memory}</p>
                  </div>
                  <div>
                    <span className="font-medium">Submitted:</span>
                    <p className="text-muted-foreground">
                      {new Date(selectedProblem.submissionDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Your Solution:</h4>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{selectedProblem.code}</code>
                  </pre>
                </div>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => {
                    window.open(`https://leetcode.com/problems/${selectedProblem.titleSlug}/`, '_blank');
                  }}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open on LeetCode
                  </Button>
                  <Button onClick={() => {
                    window.location.href = `/problems/${selectedProblem.id}/editor`;
                  }}>
                    Open in Editor
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}</new_str>
