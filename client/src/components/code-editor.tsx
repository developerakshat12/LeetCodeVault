
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Copy, Play, Save, Plus } from "lucide-react";

interface Solution {
  id: string;
  language: string;
  code: string;
  timeComplexity: string;
  spaceComplexity: string;
  runtime: string;
  memory: string;
}

interface CodeEditorProps {
  solutions: Solution[];
  onAddSolution?: () => void;
  onSaveSolution?: (solution: Solution) => void;
}

export function CodeEditor({ solutions, onAddSolution, onSaveSolution }: CodeEditorProps) {
  const [activeSolution, setActiveSolution] = useState(solutions[0]?.id || "");

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const currentSolution = solutions.find(s => s.id === activeSolution) || solutions[0];

  if (!currentSolution) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-4">No solutions available</p>
          {onAddSolution && (
            <Button onClick={onAddSolution}>
              <Plus className="w-4 h-4 mr-2" />
              Add Solution
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Solution Tabs */}
      <Tabs value={activeSolution} onValueChange={setActiveSolution}>
        <div className="flex items-center justify-between">
          <TabsList>
            {solutions.map((solution, index) => (
              <TabsTrigger key={solution.id} value={solution.id}>
                Solution {index + 1} ({solution.language})
              </TabsTrigger>
            ))}
          </TabsList>
          {onAddSolution && (
            <Button variant="outline" size="sm" onClick={onAddSolution}>
              <Plus className="w-4 h-4 mr-2" />
              Add Solution
            </Button>
          )}
        </div>

        {solutions.map((solution) => (
          <TabsContent key={solution.id} value={solution.id}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">
                  {solution.language} Solution
                </CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(solution.code)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Play className="w-4 h-4" />
                  </Button>
                  {onSaveSolution && (
                    <Button variant="outline" size="sm" onClick={() => onSaveSolution(solution)}>
                      <Save className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Performance Metrics */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      Time: {solution.timeComplexity}
                    </Badge>
                    <Badge variant="secondary">
                      Space: {solution.spaceComplexity}
                    </Badge>
                    <Badge variant="outline">
                      Runtime: {solution.runtime}
                    </Badge>
                    <Badge variant="outline">
                      Memory: {solution.memory}
                    </Badge>
                  </div>
                  
                  {/* Code Display */}
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{solution.code}</code>
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
