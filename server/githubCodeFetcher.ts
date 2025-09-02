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

  // Extract title slug from folder name by removing numbers and normalizing
  private extractTitleSlug(folderName: string): string {
    // Remove leading numbers and hyphens: "0001-two-sum" -> "two-sum"
    // Remove trailing numbers: "two-sum-1" -> "two-sum"
    let slug = folderName
      .replace(/^\d+[-_]?/, '') // Remove leading digits with optional separator
      .replace(/[-_]\d+$/, '') // Remove trailing digits with separator
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-') // Replace non-alphanumeric chars with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    
    return slug;
  }

  // Extract problem number from folder name if it exists
  private extractProblemNumber(folderName: string): number | null {
    // Try multiple patterns:
    // 1. "0001-two-sum" -> 1
    // 2. "1-two-sum" -> 1 
    // 3. "two-sum-1" -> 1
    
    // Pattern 1: Leading digits with optional zeros
    let match = folderName.match(/^0*(\d+)[-_]/);
    if (match) {
      return parseInt(match[1]);
    }
    
    // Pattern 2: Digits at the end
    match = folderName.match(/[-_](\d+)$/);
    if (match) {
      return parseInt(match[1]);
    }
    
    // Pattern 3: Any standalone digits
    match = folderName.match(/\d+/);
    if (match) {
      return parseInt(match[0]);
    }
    
    return null;
  }

  // Get language from file extension
  private getLanguage(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'cpp': 'cpp',
      'cc': 'cpp',
      'cxx': 'cpp',
      'c++': 'cpp',
      'py': 'python',
      'py3': 'python',
      'java': 'java',
      'js': 'javascript',
      'ts': 'typescript',
      'c': 'c',
      'cs': 'csharp',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'rb': 'ruby',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
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
      
      // Look for folders that might contain LeetCode problems
      // More flexible pattern matching for different naming conventions
      const problemFolders = rootContents.filter((item: any) => {
        if (item.type !== 'dir') return false;
        
        const name = item.name.toLowerCase();
        // Skip common non-problem folders
        if (['readme', 'doc', 'docs', '.git', 'node_modules', 'test', 'tests'].includes(name)) {
          return false;
        }
        
        // Include folders that have numbers (likely problem folders)
        return /\d+/.test(name) || 
               // Or common problem patterns
               /^(easy|medium|hard)/.test(name) ||
               // Or specific LeetCode patterns
               /(leetcode|problem|solution)/i.test(name);
      });

      console.log(`Found ${problemFolders.length} potential problem folders`);

      for (const folder of problemFolders) {
        try {
          const titleSlug = this.extractTitleSlug(folder.name);
          const problemNumber = this.extractProblemNumber(folder.name);
          
          console.log(`Processing folder: ${folder.name} -> Title Slug: ${titleSlug}, Number: ${problemNumber}`);
          
          // Get files in problem folder
          const folderContents = await this.makeRequest(`${this.baseUrl}/repos/${owner}/${repo}/contents/${folder.path}`);
          const codeFiles = folderContents.filter((file: any) => 
            file.type === 'file' && 
            ['.cpp', '.py', '.java', '.js', '.ts', '.c', '.cs', '.go', '.rs'].some(ext => file.name.endsWith(ext)) &&
            !file.name.toLowerCase().includes('readme') &&
            !file.name.toLowerCase().includes('test')
          );

          for (const file of codeFiles) {
            // Get file content
            const fileData = await this.makeRequest(file.url);
            const code = Buffer.from(fileData.content, 'base64').toString('utf-8');

            solutions.push({
              id: `${titleSlug}-${this.getLanguage(file.name)}-${Date.now()}`,
              userId: '', // Will be set by the calling component
              problemId: titleSlug, // Use title slug instead of number for matching
              problemNumber: problemNumber || undefined, // Keep the number for reference
              language: this.getLanguage(file.name),
              code: code.trim(),
              fileName: file.name,
              folderName: folder.name,
              contentHash: this.calculateHash(code),
              createdAt: new Date(),
            });
          }
        } catch (folderError) {
          console.warn(`Error processing folder ${folder.name}:`, folderError);
          // Continue with other folders
        }
      }

      console.log(`Successfully extracted ${solutions.length} solutions from ${problemFolders.length} folders`);
      return solutions;
    } catch (error) {
      console.error('Error fetching GitHub code:', error);
      throw error;
    }
  }
}
