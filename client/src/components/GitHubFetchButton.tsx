import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Download, Loader2, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GitHubSettings } from './GitHubSettings';

interface GitHubFetchButtonProps {
  userId: string;
  githubUsername?: string;
  githubRepo?: string;
  githubToken?: string;
}

interface GitHubSettings {
  githubUsername: string;
  githubRepo: string;
  githubToken?: string;
}

export function GitHubFetchButton({ 
  userId, 
  githubUsername: propGithubUsername,
  githubRepo: propGithubRepo,
  githubToken: propGithubToken
}: GitHubFetchButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<GitHubSettings>({
    githubUsername: propGithubUsername || import.meta.env.VITE_GITHUB_USERNAME || '',
    githubRepo: propGithubRepo || import.meta.env.VITE_GITHUB_REPO || '',
    githubToken: propGithubToken || import.meta.env.VITE_GITHUB_TOKEN || '',
  });
  const { toast } = useToast();

  useEffect(() => {
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem(`github-settings-${userId}`);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Error loading GitHub settings:', error);
      }
    }
  }, [userId]);

  const handleSettingsUpdate = (newSettings: GitHubSettings) => {
    setSettings(newSettings);
    setIsSettingsOpen(false);
  };

  const handleFetchCode = async () => {
    if (!settings.githubUsername || !settings.githubRepo) {
      toast({
        title: "Configuration Missing",
        description: "Please configure GitHub username and repository in settings",
        variant: "destructive",
      });
      setIsSettingsOpen(true);
      return;
    }

    if (!userId) {
      toast({
        title: "User Required",
        description: "Please fetch your LeetCode data first to set up your profile",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/fetch-github-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          githubUsername: settings.githubUsername,
          githubRepo: settings.githubRepo,
          githubToken: settings.githubToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fetch failed');
      }

      const data = await response.json();
      toast({
        title: "Code Fetched Successfully!",
        description: `Found ${data.totalFound} solutions, saved ${data.newCodeSaved} new ones`,
      });
    } catch (error) {
      console.error('GitHub fetch error:', error);
      toast({
        title: "Fetch Failed",
        description: error instanceof Error ? error.message : "Could not fetch code from GitHub",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Button 
        onClick={handleFetchCode} 
        disabled={isLoading}
        variant="outline"
        className="flex items-center space-x-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Fetching...</span>
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            <span>Fetch Data</span>
          </>
        )}
      </Button>
      
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>GitHub Repository Settings</DialogTitle>
          </DialogHeader>
          <GitHubSettings 
            userId={userId} 
            onSettingsUpdate={handleSettingsUpdate}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
