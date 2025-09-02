import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import SyncResultsModal from "@/components/sync-results-modal";
import { Loader2, Database, Github } from "lucide-react";

interface UserProfileProps {
  onUserUpdate: (user: any) => void;
}

export default function UserProfile({ onUserUpdate }: UserProfileProps) {
  const [username, setUsername] = useState("akshatcancode");
  const [syncResult, setSyncResult] = useState<any>(null);
  const [isSyncResultsOpen, setIsSyncResultsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user, isLoading } = useQuery<any>({
    queryKey: ["/api/users/leetcode", username],
    enabled: !!username,
    retry: false,
  });

  // Update parent component when user data changes
  useEffect(() => {
    if (user) {
      onUserUpdate(user);
    }
  }, [user, onUserUpdate]);

  const fetchDataMutation = useMutation({
    mutationFn: async (leetcodeUsername: string) => {
      console.log("🚀 UserProfile - Starting fetch data:", {
        leetcodeUsername,
        userId: user?.id,
        userGithubRepoUrl: user?.githubRepoUrl,
        userHasGithubToken: !!user?.githubToken
      });
      
      if (!user?.id) {
        throw new Error("User ID not found");
      }
      const response = await apiRequest("POST", `/api/users/${user.id}/fetch-data`, {
        username: leetcodeUsername,
      });
      return response.json();
    },
    onSuccess: (data) => {
      // First toast for LeetCode problems
      toast({
        title: "✅ LeetCode Problems Fetched",
        description: `Problems fetched: ${data.problemsProcessed}, Problems skipped: ${data.problemsSkipped}`,
      });

      // Second toast for GitHub solutions if GitHub sync occurred
      if (data.githubSync && !data.githubSync.error) {
        setTimeout(() => {
          toast({
            title: "🔄 GitHub Solutions Synced",
            description: `New solutions: ${data.githubSync.created}, Updated: ${data.githubSync.updated}, Skipped: ${data.githubSync.skipped}`,
          });
        }, 1000);
      } else if (data.githubSync && data.githubSync.error) {
        setTimeout(() => {
          toast({
            title: "❌ GitHub Sync Error",
            description: data.githubSync.error,
            variant: "destructive",
          });
        }, 1000);
      } else if (data.githubSync && data.githubSync.message) {
        setTimeout(() => {
          toast({
            title: "ℹ️ GitHub Setup Required",
            description: data.githubSync.message,
          });
        }, 1000);
      }

      setSyncResult(data);
      setIsSyncResultsOpen(true);
      onUserUpdate(data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/users/leetcode"] });
      queryClient.invalidateQueries({ queryKey: ["/api/topics"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch LeetCode data",
        variant: "destructive",
      });
    },
  });

  const handleFetchData = () => {
    if (!username.trim()) {
      toast({
        title: "Error",
        description: "Please enter a LeetCode username",
        variant: "destructive",
      });
      return;
    }
    
    // Show loading toast
    toast({
      title: "🔄 Starting Sync",
      description: "Fetching LeetCode problems and GitHub solutions...",
    });
    
    fetchDataMutation.mutate(username);
  };

  return (
    <section className="mb-6 sm:mb-8">
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-4 sm:space-y-0">
            <h2 className="text-lg sm:text-xl font-semibold">User Profile</h2>
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="text-right">
                <div className="text-xs sm:text-sm text-muted-foreground">Connected User</div>
                <div className="text-base sm:text-lg font-semibold text-primary">
                  {user?.leetcodeUsername || "Not connected"}
                </div>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg">
                {user?.leetcodeUsername?.[0]?.toUpperCase() || "?"}
              </div>
            </div>
          </div>
          
          {user && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-muted rounded-lg p-3 sm:p-4 text-center">
                <div className="text-lg sm:text-2xl font-bold text-green-400">
                  {Array.isArray(user.totalSolved) ? 
                    user.totalSolved.find((s: any) => s.difficulty === "All")?.count || 0 : 
                    user.totalSolved || 0}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Total Solved</div>
              </div>
              <div className="bg-muted rounded-lg p-3 sm:p-4 text-center">
                <div className="text-lg sm:text-2xl font-bold text-green-500">
                  {typeof user.easySolved === 'number' ? user.easySolved : 0}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Easy</div>
              </div>
              <div className="bg-muted rounded-lg p-3 sm:p-4 text-center">
                <div className="text-lg sm:text-2xl font-bold text-yellow-500">
                  {typeof user.mediumSolved === 'number' ? user.mediumSolved : 0}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Medium</div>
              </div>
              <div className="bg-muted rounded-lg p-3 sm:p-4 text-center">
                <div className="text-lg sm:text-2xl font-bold text-red-500">
                  {typeof user.hardSolved === 'number' ? user.hardSolved : 0}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Hard</div>
              </div>
            </div>
          )}
          
          <div className="pt-4 sm:pt-6 border-t border-border">
            <div className="flex flex-col lg:flex-row lg:items-end space-y-4 lg:space-y-0 lg:space-x-4">
              <div className="flex-1">
                <Label htmlFor="username" className="block text-sm font-medium mb-2">
                  LeetCode Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your LeetCode username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="flex-shrink-0">
                <Button 
                  onClick={handleFetchData}
                  disabled={fetchDataMutation.isPending || isLoading}
                  className="flex items-center space-x-2 w-full lg:w-auto"
                >
                  {fetchDataMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="hidden sm:inline">Fetching & Syncing...</span>
                      <span className="sm:hidden">Syncing...</span>
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4" />
                      <Github className="h-4 w-4" />
                      <span className="hidden sm:inline">Fetch Data & Sync GitHub</span>
                      <span className="sm:hidden">Sync</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <SyncResultsModal
        isOpen={isSyncResultsOpen}
        onClose={() => setIsSyncResultsOpen(false)}
        result={syncResult}
      />
    </section>
  );
}
