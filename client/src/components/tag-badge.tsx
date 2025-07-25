
import React from "react";
import { Badge } from "@/components/ui/badge";

interface TagBadgeProps {
  tag: string;
  variant?: "platform" | "concept";
}

export function TagBadge({ tag, variant = "concept" }: TagBadgeProps) {
  const getClassName = () => {
    if (variant === "platform") {
      return "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-200";
    }
    return "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200";
  };

  return (
    <Badge variant="secondary" className={getClassName()}>
      {tag}
    </Badge>
  );
}
