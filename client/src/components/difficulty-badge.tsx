
import React from "react";
import { Badge } from "@/components/ui/badge";

interface DifficultyBadgeProps {
  difficulty: "Easy" | "Medium" | "Hard";
}

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const getVariant = () => {
    switch (difficulty) {
      case "Easy":
        return "default";
      case "Medium":
        return "secondary";
      case "Hard":
        return "destructive";
      default:
        return "default";
    }
  };

  const getColor = () => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-900 text-green-300 hover:bg-green-500";
      case "Medium":
        return "bg-yellow-900 text-yellow-300 hover:bg-yellow-500";
      case "Hard":
        return "bg-red-900 text-red-300 hover:bg-red-500";
      default:
        return "";
    }
  };

  return (
    <Badge variant={getVariant()} className={getColor()}>
      {difficulty}
    </Badge>
  );
}
