import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Github, Loader2, Settings } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export default function SettingsModal({ isOpen, onClose, userId }: SettingsModalProps) {
  const [githubRepoUrl, setGithubRepoUrl] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: githubSettings, isLoading } = useQuery<any>({
    queryKey: ["/api/users", userId, "github-settings"],
    enabled: !!userId && isOpen,
    retry: false,
  });

  // Load GitHub settings when they become available
  useEffect(() => {
    console.log("🔍 Settings Modal - Loading GitHub settings:", {
      userId,
      githubSettings,
      hasGithubSettings: !!githubSettings,
      githubRepoUrl: githubSettings?.githubRepoUrl
    });
    
    if (githubSettings) {
      setGithubRepoUrl(githubSettings.githubRepoUrl || "");
      // Don't load the token for security reasons - just show it's configured
    }
  }, [githubSettings, userId]);

  const saveGithubSettingsMutation = useMutation({
    mutationFn: async ({ githubRepoUrl, githubToken }: { githubRepoUrl: string; githubToken?: string }) => {
      console.log("🔧 Settings Modal - Saving GitHub settings:", {
        userId,
        githubRepoUrl,
        hasGithubToken: !!githubToken
      });
      
      if (!userId) {
        throw new Error("User ID not found");
      }
      const response = await apiRequest("POST", `/api/users/${userId}/github-settings`, {
        githubRepoUrl,
        githubToken,
      });
      return response.json();
    },
    onSuccess: (data) => {
      console.log("✅ Settings Modal - GitHub settings saved successfully:", data);
      toast({
        title: "Success",
        description: "GitHub settings saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "github-settings"] });
      // Also invalidate ALL user leetcode queries to refresh the user data
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          return query.queryKey[0] === "/api/users/leetcode";
        }
      });
      onClose();
    },
    onError: (error: any) => {
      console.error("❌ Settings Modal - GitHub settings save failed:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save GitHub settings",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    console.log("🔧 Settings Modal - Save button clicked:", {
      githubRepoUrl: githubRepoUrl.trim(),
      hasGithubToken: !!githubToken.trim()
    });
    
    if (!githubRepoUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a GitHub repository URL",
        variant: "destructive",
      });
      return;
    }
    saveGithubSettingsMutation.mutate({ githubRepoUrl, githubToken });
  };

  const handleClose = () => {
    setGithubToken(""); // Clear token input for security
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </DialogTitle>
          <DialogDescription>
            Configure your GitHub repository for automatic code synchronization.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* GitHub Settings Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b pb-2">
              <Github className="h-5 w-5" />
              <h3 className="text-lg font-semibold">GitHub Integration</h3>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading settings...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="githubRepoUrl" className="block text-sm font-medium mb-2">
                    GitHub Repository URL *
                  </Label>
                  <Input
                    id="githubRepoUrl"
                    type="url"
                    placeholder="https://github.com/username/repository"
                    value={githubRepoUrl}
                    onChange={(e) => setGithubRepoUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    The repository containing your LeetCode solutions
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="githubToken" className="block text-sm font-medium mb-2">
                    GitHub Personal Access Token (optional)
                  </Label>
                  <Input
                    id="githubToken"
                    type="password"
                    placeholder={
                      githubSettings?.hasToken 
                        ? "Token configured (enter new token to update)" 
                        : "Enter token for private repositories"
                    }
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Required only for private repositories. Create one at GitHub Settings → Developer settings → Personal access tokens
                  </p>
                </div>

                {githubSettings?.githubRepoUrl && (
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm font-medium text-green-600">✓ GitHub Repository Configured</p>
                    <p className="text-xs text-muted-foreground">
                      Current: {githubSettings.githubRepoUrl}
                    </p>
                    {githubSettings.hasToken && (
                      <p className="text-xs text-muted-foreground">
                        ✓ Personal access token configured
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 border-t pt-4">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveSettings}
            disabled={saveGithubSettingsMutation.isPending || !userId}
          >
            {saveGithubSettingsMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
