
import React from "react";
import { Badge } from "@/components/ui/badge";

interface TagBadgeProps {
  tag: string;
  variant?: "platform" | "concept";
}

export function TagBadge({ tag, variant = "concept" }: TagBadgeProps) {
  const getClassName = () => {
    switch (variant) {
      case "platform":
        return "bg-blue-100 bg-blue-900 text-blue-700 text-blue-300 hover:bg-blue-200 hover:bg-blue-800";
      case "concept":
        return "bg-purple-100 bg-purple-900 text-purple-700 text-purple-300 hover:bg-purple-200 hover:bg-purple-800";
      default:
        return "bg-gray-100 bg-gray-900 text-gray-700 text-gray-300";
    }
  };

  return (
    <Badge variant="secondary" className={getClassName()}>
      {tag}
    </Badge>
  );
}
