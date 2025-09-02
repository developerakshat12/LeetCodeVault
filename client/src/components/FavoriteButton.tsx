import { Heart } from 'lucide-react';
import { Button } from './ui/button';
import { useFavorites, useFavoriteStatus } from '../hooks/useFavorites';

interface FavoriteButtonProps {
  problemId: string;
  userId: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'outline' | 'ghost' | 'default';
}

export function FavoriteButton({ 
  problemId, 
  userId, 
  size = 'sm',
  variant = 'ghost' 
}: FavoriteButtonProps) {
  const { addFavorite, removeFavorite, isAddingFavorite, isRemovingFavorite } = useFavorites(userId);
  const { data: isFavorited, isLoading } = useFavoriteStatus(userId, problemId);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (isFavorited) {
        await removeFavorite(problemId);
      } else {
        await addFavorite(problemId);
      }
    } catch (error) {
      // Error handling is done in the hook with toast
      console.error('Error toggling favorite:', error);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleFavorite}
      disabled={isLoading || isAddingFavorite || isRemovingFavorite}
      className="group p-2"
    >
      <Heart 
        className={`h-4 w-4 transition-colors ${
          isFavorited 
            ? 'fill-red-500 text-red-500' 
            : 'text-gray-400 group-hover:text-red-500'
        }`} 
      />
      <span className="sr-only">
        {isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      </span>
    </Button>
  );
}
