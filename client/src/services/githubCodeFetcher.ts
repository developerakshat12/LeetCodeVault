import { GitHubCode } from "@shared/schema";

export class GitHubCodeFetcher {
  private baseUrl = 'https://api.github.com';
  private token?: string;

  constructor(token?: string) {
    this.token = token;
  }

  private async makeRequest(url: string) {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
    };

    if (this.token) {
      headers['Authorization'] = `token ${this.token}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    return response.json();
  }

  // Extract problem ID from folder name (e.g., "0001-two-sum" -> "0001")
  private extractProblemId(folderName: string): string {
    const match = folderName.match(/^(\d+)-/);
    return match ? match[1] : folderName;
  }

  // Get language from file extension
  private getLanguage(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'cpp': 'cpp',
      'py': 'python',
      'java': 'java',
      'js': 'javascript',
      'ts': 'typescript',
      'c': 'c',
    };
    return langMap[ext || ''] || 'text';
  }

  // Calculate simple hash for change detection
  private calculateHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  // Main method: Fetch all code solutions
  async fetchAllCode(owner: string, repo: string): Promise<GitHubCode[]> {
    const solutions: GitHubCode[] = [];

    try {
      // Get all problem folders
      const rootContents = await this.makeRequest(`${this.baseUrl}/repos/${owner}/${repo}/contents`);
      const problemFolders = rootContents.filter((item: any) => 
        item.type === 'dir' && /^\d{4}-/.test(item.name)
      );

      console.log(`Found ${problemFolders.length} problem folders`);

      for (const folder of problemFolders) {
        const problemId = this.extractProblemId(folder.name);
        
        // Get files in problem folder
        const folderContents = await this.makeRequest(`${this.baseUrl}/repos/${owner}/${repo}/contents/${folder.path}`);
        const codeFiles = folderContents.filter((file: any) => 
          file.type === 'file' && 
          ['.cpp', '.py', '.java', '.js', '.ts', '.c'].some(ext => file.name.endsWith(ext)) &&
          !file.name.toLowerCase().includes('readme')
        );

        for (const file of codeFiles) {
          // Get file content
          const fileData = await this.makeRequest(file.url);
          const code = atob(fileData.content); // Decode base64

          solutions.push({
            id: `${problemId}-${this.getLanguage(file.name)}-${Date.now()}`,
            userId: '', // Will be set by the calling component
            problemId,
            language: this.getLanguage(file.name),
            code: code.trim(),
            fileName: file.name,
            contentHash: this.calculateHash(code),
            createdAt: new Date(),
          });
        }
      }

      return solutions;
    } catch (error) {
      console.error('Error fetching GitHub code:', error);
      throw error;
    }
  }
}
