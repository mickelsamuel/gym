import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_STORAGE_KEY = 'gym_track_pro_favorites';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load favorites from storage on mount
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const storedFavorites = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
        if (storedFavorites) {
          setFavorites(JSON.parse(storedFavorites));
        }
      } catch (error) {
        console.error('Failed to load favorites:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFavorites();
  }, []);

  // Save favorites to storage whenever they change
  useEffect(() => {
    const saveFavorites = async () => {
      try {
        await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
      } catch (error) {
        console.error('Failed to save favorites:', error);
      }
    };

    // Don't save during initial load
    if (!isLoading) {
      saveFavorites();
    }
  }, [favorites, isLoading]);

  // Check if an exercise is favorited
  const isFavorite = useCallback(
    (exerciseId: string) => favorites.includes(exerciseId),
    [favorites]
  );

  // Toggle favorite state for an exercise
  const toggleFavorite = useCallback(
    (exerciseId: string) => {
      if (isFavorite(exerciseId)) {
        setFavorites(favorites.filter(id => id !== exerciseId));
      } else {
        setFavorites([...favorites, exerciseId]);
      }
    },
    [favorites, isFavorite]
  );

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    isLoading,
  };
}; 