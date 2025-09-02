import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import type { Problem, Favorite } from '../../../shared/schema';
import { useToast } from './use-toast';

export function useFavorites(userId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get user's favorites
  const favoritesQuery = useQuery({
    queryKey: ['favorites', userId],
    queryFn: async (): Promise<Problem[]> => {
      const response = await apiRequest('GET', `/api/users/${userId}/favorites`);
      return response.json();
    },
    enabled: !!userId,
  });

  // Add favorite mutation
  const addFavoriteMutation = useMutation({
    mutationFn: async (problemId: string) => {
      const response = await apiRequest('POST', '/api/favorites', {
        userId,
        problemId,
      });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch favorites
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] });
      // Also invalidate the favorite status for this problem
      queryClient.invalidateQueries({ queryKey: ['favorite-status'] });
      
      toast({
        title: "Added to favorites",
        description: "Problem added to your favorites list",
      });
    },
    onError: (error: any) => {
      const message = error.message === 'Problem already in favorites' 
        ? 'Problem is already in your favorites'
        : 'Failed to add to favorites';
      
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  // Remove favorite mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: async (problemId: string) => {
      await apiRequest('DELETE', `/api/favorites/${userId}/${problemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] });
      queryClient.invalidateQueries({ queryKey: ['favorite-status'] });
      
      toast({
        title: "Removed from favorites",
        description: "Problem removed from your favorites list",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove from favorites",
        variant: "destructive",
      });
    },
  });

  return {
    favorites: favoritesQuery.data || [],
    isLoading: favoritesQuery.isLoading,
    error: favoritesQuery.error,
    addFavorite: addFavoriteMutation.mutateAsync,
    removeFavorite: removeFavoriteMutation.mutateAsync,
    isAddingFavorite: addFavoriteMutation.isPending,
    isRemovingFavorite: removeFavoriteMutation.isPending,
  };
}

// Hook for checking if a specific problem is favorited
export function useFavoriteStatus(userId: string, problemId: string) {
  return useQuery({
    queryKey: ['favorite-status', userId, problemId],
    queryFn: async (): Promise<boolean> => {
      const response = await apiRequest('GET', `/api/favorites/${userId}/${problemId}/status`);
      const data = await response.json();
      return data.isFavorited;
    },
    enabled: !!userId && !!problemId,
  });
}
