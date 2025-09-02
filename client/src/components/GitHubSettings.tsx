import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Settings, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GitHubSettingsProps {
  userId: string;
  onSettingsUpdate?: (settings: GitHubSettings) => void;
}

interface GitHubSettings {
  githubUsername: string;
  githubRepo: string;
  githubToken?: string;
}

export function GitHubSettings({ userId, onSettingsUpdate }: GitHubSettingsProps) {
  const [settings, setSettings] = useState<GitHubSettings>({
    githubUsername: import.meta.env.VITE_GITHUB_USERNAME || '',
    githubRepo: import.meta.env.VITE_GITHUB_REPO || '',
    githubToken: import.meta.env.VITE_GITHUB_TOKEN || '',
  });
  const [isLoading, setIsLoading] = useState(false);
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

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Save to localStorage
      localStorage.setItem(`github-settings-${userId}`, JSON.stringify(settings));
      
      // Notify parent component
      onSettingsUpdate?.(settings);
      
      toast({
        title: "Settings Saved",
        description: "GitHub repository settings have been updated",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Could not save GitHub settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof GitHubSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>GitHub Repository Settings</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="githubUsername">GitHub Username</Label>
          <Input
            id="githubUsername"
            type="text"
            placeholder="e.g., developerakshat12"
            value={settings.githubUsername}
            onChange={(e) => handleInputChange('githubUsername', e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="githubRepo">Repository Name</Label>
          <Input
            id="githubRepo"
            type="text"
            placeholder="e.g., LeetCode"
            value={settings.githubRepo}
            onChange={(e) => handleInputChange('githubRepo', e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="githubToken">GitHub Token (Optional)</Label>
          <Input
            id="githubToken"
            type="password"
            placeholder="For private repositories"
            value={settings.githubToken}
            onChange={(e) => handleInputChange('githubToken', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Only needed for private repositories. Get one from GitHub Settings → Developer settings → Personal access tokens
          </p>
        </div>
        
        <div className="text-sm text-muted-foreground p-3 bg-muted rounded">
          <p><strong>Repository URL:</strong></p>
          <p className="font-mono">
            {settings.githubUsername && settings.githubRepo 
              ? `https://github.com/${settings.githubUsername}/${settings.githubRepo}`
              : 'Configure username and repo above'
            }
          </p>
        </div>
        
        <Button 
          onClick={handleSave} 
          disabled={isLoading || !settings.githubUsername || !settings.githubRepo}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Save className="mr-2 h-4 w-4 animate-pulse" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
