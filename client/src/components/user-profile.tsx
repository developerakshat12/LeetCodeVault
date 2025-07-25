import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface UserProfileProps {
  onUserUpdate: (user: any) => void;
}

export default function UserProfile({ onUserUpdate }: UserProfileProps) {
  const [username, setUsername] = useState("lee215");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user, isLoading } = useQuery<any>({
    queryKey: ["/api/users/leetcode", username],
    enabled: !!username,
    retry: false,
  });

  const fetchDataMutation = useMutation({
    mutationFn: async (leetcodeUsername: string) => {
      const response = await apiRequest("POST", "/api/fetch-leetcode-data", {
        username: leetcodeUsername,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Fetched ${data.problemsProcessed} problems successfully`,
      });
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
    fetchDataMutation.mutate(username);
  };

  return (
    <section className="mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">User Profile</h2>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Connected User</div>
                <div className="text-lg font-semibold text-primary">
                  {user?.leetcodeUsername || "Not connected"}
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {user?.leetcodeUsername?.[0]?.toUpperCase() || "?"}
              </div>
            </div>
          </div>
          
          {user && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-muted rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">
                  {user.totalSolved || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Solved</div>
              </div>
              <div className="bg-muted rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-500">
                  {user.easySolved || 0}
                </div>
                <div className="text-sm text-muted-foreground">Easy</div>
              </div>
              <div className="bg-muted rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-500">
                  {user.mediumSolved || 0}
                </div>
                <div className="text-sm text-muted-foreground">Medium</div>
              </div>
              <div className="bg-muted rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-500">
                  {user.hardSolved || 0}
                </div>
                <div className="text-sm text-muted-foreground">Hard</div>
              </div>
            </div>
          )}
          
          <div className="pt-6 border-t border-border">
            <div className="flex items-center space-x-4">
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
              <Button 
                onClick={handleFetchData}
                disabled={fetchDataMutation.isPending || isLoading}
                className="mt-6"
              >
                {fetchDataMutation.isPending ? "Fetching..." : "Fetch Data"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
