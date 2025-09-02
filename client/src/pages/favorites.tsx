import { useState } from "react";
import { Heart, Filter, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useFavorites } from "../hooks/useFavorites";
import { ProblemCard } from "../components/problem-card";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import ResponsiveNavbar from "../components/responsive-navbar";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function Favorites() {
  // You'll need to get the current user ID from your auth system
  const userId = "user-1"; // Replace with actual user context
  const { favorites, isLoading, error } = useFavorites(userId);
  const [tagFilter, setTagFilter] = useState<string>("all");

  // Fetch solution counts for favorite problems
  const { data: solutionCounts } = useQuery<Record<string, number>>({
    queryKey: ["/api/problems/solution-counts/favorites", userId],
    queryFn: async () => {
      if (!favorites || favorites.length === 0) return {};
      
      const counts: Record<string, number> = {};
      await Promise.all(
        favorites.map(async (problem) => {
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
    enabled: !!favorites && favorites.length > 0,
  });

  // Get unique tags from all favorite problems
  const allTags = Array.from(
    new Set(favorites.flatMap(problem => problem.tags || []))
  ).sort();

  // Filter problems by selected tag
  const filteredFavorites = tagFilter === "all" 
    ? favorites 
    : favorites.filter(problem => 
        problem.tags?.includes(tagFilter)
      );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <ResponsiveNavbar
          showSearch={false}
          title="My Favorites"
          subtitle="Your starred problems"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center min-h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <ResponsiveNavbar
          showSearch={false}
          title="My Favorites"
          subtitle="Your starred problems"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-8">
            <p className="text-red-500">Failed to load favorites</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Responsive Navigation */}
      <ResponsiveNavbar
        showSearch={false}
        title="My Favorites"
        subtitle="Your starred problems"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="text-primary hover:text-primary/80 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Topics
            </Button>
          </Link>
        </div>

        {/* Header with stats and filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">My Favorite Problems</h1>
            <p className="text-muted-foreground mt-1 sm:mt-2">
              {favorites.length} problem{favorites.length !== 1 ? 's' : ''} in your favorites
            </p>
          </div>

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {allTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Empty state */}
        {favorites.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <Heart className="h-12 sm:h-16 w-12 sm:w-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">No favorites yet</h2>
            <p className="text-muted-foreground mb-4 sm:mb-6 px-4">
              Start favoriting problems to build your revision list!
            </p>
            <Link href="/">
              <Button className="w-full sm:w-auto">Explore Problems</Button>
            </Link>
          </div>
        )}

        {/* Filtered results info */}
        {favorites.length > 0 && tagFilter !== "all" && (
          <div className="mb-4 sm:mb-6">
            <p className="text-sm text-muted-foreground">
              Showing {filteredFavorites.length} problem{filteredFavorites.length !== 1 ? 's' : ''} 
              with tag "{tagFilter}"
            </p>
          </div>
        )}

        {/* No results for filter */}
        {favorites.length > 0 && filteredFavorites.length === 0 && tagFilter !== "all" && (
          <div className="text-center py-8 sm:py-12">
            <Filter className="h-10 sm:h-12 w-10 sm:w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No problems found</h3>
            <p className="text-muted-foreground mb-4 px-4">
              No favorite problems found with tag "{tagFilter}"
            </p>
            <Button 
              variant="outline" 
              onClick={() => setTagFilter("all")}
              className="w-full sm:w-auto"
            >
              Clear Filter
            </Button>
          </div>
        )}

        {/* Problems grid */}
        {filteredFavorites.length > 0 && (
          <div className="space-y-3 sm:space-y-4">
            {filteredFavorites.map((problem) => (
              <ProblemCard 
                key={problem.id} 
                problem={{
                  ...problem,
                  solutionCount: solutionCounts?.[problem.id] || 0
                }}
                userId={userId}
                onOpenEditor={() => window.location.href = `/problems/${problem.id}/editor`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
