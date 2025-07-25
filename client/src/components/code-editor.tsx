
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';

// VS Code themes
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { vscodeLight } from '@uiw/codemirror-theme-vscode';

interface CodeEditorProps {
  code: string;
  language: string;
  onCodeChange: (code: string) => void;
  onLanguageChange: (language: string) => void;
  titleSlug?: string;
}

export function CodeEditor({ code, language, onCodeChange, onLanguageChange, titleSlug }: CodeEditorProps) {
  const { toast } = useToast();
  const [isDark, setIsDark] = useState(true);

  // Get language extensions
  const getLanguageExtensions = (lang: string) => {
    switch (lang) {
      case "javascript":
        return [javascript()];
      case "python":
        return [python()];
      case "java":
        return [java()];
      case "cpp":
        return [cpp()];
      default:
        return [javascript()];
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "Copied!",
        description: "Code copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy code",
        variant: "destructive",
      });
    }
  };

  const handleOpenInLeetCode = () => {
    if (titleSlug) {
      window.open(`https://leetcode.com/problems/${titleSlug}/`, '_blank');
    } else {
      toast({
        title: "Error",
        description: "Problem URL not available",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="h-[620px]">
      <CardHeader className="border-b border-border px-4 py-3 flex flex-row items-center justify-between">
        <h3 className="font-semibold">Code</h3>
        <div className="flex items-center space-x-2">
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="java">Java</SelectItem>
              <SelectItem value="cpp">C++</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleOpenInLeetCode}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in LeetCode
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 h-full overflow-y-auto bg-[#f5f5f5] dark:bg-[#1e1e1e]">
        <CodeMirror
          value={code}
          height="100%"
          theme={isDark ? vscodeDark : vscodeLight}
          extensions={getLanguageExtensions(language)}
          onChange={(value) => onCodeChange(value)}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            dropCursor: false,
            allowMultipleSelections: false,
            indentOnInput: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            highlightSelectionMatches: false,
            searchKeymap: true,
          }}
          style={{
            fontSize: '14px',
            fontFamily: 'JetBrains Mono, Monaco, Cascadia Code, Roboto Mono, monospace',
          }}
        />
      </CardContent>
    </Card>
  );
}
