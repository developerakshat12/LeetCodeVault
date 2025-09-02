import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Info, Github, Database } from "lucide-react";

interface SyncResult {
  user: any;
  message: string;
  totalSubmissions: number;
  problemsProcessed: number;
  problemsSkipped: number;
  githubSync?: {
    totalSolutions: number;
    processed: number;
    created: number;
    updated: number;
    skipped: number;
    error?: string;
    message?: string;
  } | null;
}

interface SyncResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: SyncResult | null;
}

export default function SyncResultsModal({ isOpen, onClose, result }: SyncResultsModalProps) {
  if (!result) return null;

  const { githubSync } = result;

  // Debug logging
  console.log("🔍 Sync Results Modal Data:", {
    result,
    githubSync,
    hasGithubSync: !!githubSync,
    githubSyncKeys: githubSync ? Object.keys(githubSync) : null,
    githubSyncValues: githubSync
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Sync Complete</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* LeetCode Sync Results */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 border-b pb-2">
              <Database className="h-5 w-5 text-orange-500" />
              <h3 className="text-lg font-semibold">LeetCode Problems Sync</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg text-center border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">{result.totalSubmissions}</div>
                <div className="text-sm text-muted-foreground">Total Submissions</div>
              </div>
              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg text-center border border-green-200">
                <div className="text-2xl font-bold text-green-600">{result.problemsProcessed}</div>
                <div className="text-sm text-muted-foreground">Problems Fetched</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-950/20 p-4 rounded-lg text-center border border-gray-200">
                <div className="text-2xl font-bold text-gray-600">{result.problemsSkipped}</div>
                <div className="text-sm text-muted-foreground">Problems Skipped</div>
              </div>
            </div>
          </div>

          {/* GitHub Sync Results */}
          {githubSync ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 border-b pb-2">
                <Github className="h-5 w-5 text-purple-500" />
                <h3 className="text-lg font-semibold">GitHub Solutions Sync</h3>
              </div>
              
              {!githubSync.error && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg text-center border border-purple-200">
                    <div className="text-2xl font-bold text-purple-600">{githubSync.totalSolutions || 0}</div>
                    <div className="text-sm text-muted-foreground">Solutions Found</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg text-center border border-green-200">
                    <div className="text-2xl font-bold text-green-600">{githubSync.created || 0}</div>
                    <div className="text-sm text-muted-foreground">New Solutions</div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg text-center border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">{githubSync.updated || 0}</div>
                    <div className="text-sm text-muted-foreground">Solutions Updated</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-950/20 p-4 rounded-lg text-center border border-gray-200">
                    <div className="text-2xl font-bold text-gray-600">{githubSync.skipped || 0}</div>
                    <div className="text-sm text-muted-foreground">Solutions Skipped</div>
                  </div>
                </div>
              )}
              
              {githubSync.error && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-800 dark:text-red-200">GitHub Sync Failed</h4>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        {githubSync.error}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {githubSync.message && !githubSync.error && (
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200">Setup Required</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        {githubSync.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 border-b pb-2">
                <Github className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-semibold">GitHub Solutions Sync</h3>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200">GitHub Repository Not Configured</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      To sync your GitHub solutions, please configure your GitHub repository URL in Settings.
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                      Click the "Settings" button and enter your GitHub repository URL.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-800 dark:text-green-200">Sync Completed</h4>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  LeetCode problems have been successfully fetched and organized.
                  {githubSync && !githubSync.error && (githubSync.totalSolutions || 0) > 0 && " GitHub solutions have been imported and can be viewed in the problem editor."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t pt-4">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
