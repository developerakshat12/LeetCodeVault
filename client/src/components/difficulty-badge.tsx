
import { Badge } from "@/components/ui/badge";

interface DifficultyBadgeProps {
  difficulty: "Easy" | "Medium" | "Hard";
}

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const getVariantAndColor = () => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "Hard":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  return (
    <Badge variant="secondary" className={`${getVariantAndColor()} font-medium`}>
      {difficulty}
    </Badge>
  );
}
