
import { Badge } from "@/components/ui/badge";

interface TagBadgeProps {
  tag: string;
  variant?: "platform" | "concept";
}

export function TagBadge({ tag, variant = "concept" }: TagBadgeProps) {
  const getVariantClass = () => {
    if (variant === "platform") {
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
    }
    return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
  };

  return (
    <Badge variant="outline" className={`${getVariantClass()} text-xs`}>
      {tag}
    </Badge>
  );
}
