import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface FavoritePlayer {
  name: string;
  tag: string;
  addedAt: number;
}

interface TrackerState {
  favorites: FavoritePlayer[];
  recentSearches: string[]; // "name#tag"
  addFavorite: (name: string, tag: string) => void;
  removeFavorite: (name: string, tag: string) => void;
  isFavorite: (name: string, tag: string) => boolean;
  addRecentSearch: (query: string) => void;
}

export const useTrackerStore = create<TrackerState>()(
  persist(
    (set, get) => ({
      favorites: [],
      recentSearches: [],

      addFavorite: (name, tag) => {
        const already = get().isFavorite(name, tag);
        if (already) return;
        set((state) => ({
          favorites: [
            ...state.favorites,
            { name, tag, addedAt: Date.now() },
          ],
        }));
      },

      removeFavorite: (name, tag) => {
        set((state) => ({
          favorites: state.favorites.filter(
            (f) => !(f.name === name && f.tag === tag)
          ),
        }));
      },

      isFavorite: (name, tag) => {
        return get().favorites.some((f) => f.name === name && f.tag === tag);
      },

      addRecentSearch: (query) => {
        set((state) => ({
          recentSearches: [
            query,
            ...state.recentSearches.filter((s) => s !== query),
          ].slice(0, 10),
        }));
      },
    }),
    {
      name: "valorant-tracker-storage",
    }
  )
);
