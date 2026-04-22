import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface FavoritePlayer {
  name: string;
  tag: string;
  region?: string;
  addedAt: number;
}

export const REGIONS = [
  { value: "na", label: "NA" },
  { value: "eu", label: "EU" },
  { value: "ap", label: "AP" },
  { value: "kr", label: "KR" },
  { value: "br", label: "BR" },
  { value: "latam", label: "LATAM" },
] as const;

export type Region = (typeof REGIONS)[number]["value"];

interface TrackerState {
  favorites: FavoritePlayer[];
  recentSearches: string[];
  region: Region;
  setRegion: (region: Region) => void;
  addFavorite: (name: string, tag: string, region?: string) => void;
  removeFavorite: (name: string, tag: string) => void;
  isFavorite: (name: string, tag: string) => boolean;
  addRecentSearch: (query: string) => void;
}

export const useTrackerStore = create<TrackerState>()(
  persist(
    (set, get) => ({
      favorites: [],
      recentSearches: [],
      region: "na",

      setRegion: (region) => set({ region }),

      addFavorite: (name, tag, region) => {
        const already = get().isFavorite(name, tag);
        if (already) return;
        set((state) => ({
          favorites: [
            ...state.favorites,
            { name, tag, region: region ?? get().region, addedAt: Date.now() },
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
      name: "clutchly-storage",
    }
  )
);
