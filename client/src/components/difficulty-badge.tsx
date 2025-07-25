
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
        return "bg-green-500 text-black hover:bg-green-500";
      case "Medium":
        return "bg-yellow-500 text-black hover:bg-yellow-500";
      case "Hard":
        return "bg-red-500 text-black hover:bg-red-500";
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
