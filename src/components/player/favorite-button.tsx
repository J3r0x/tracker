"use client";

import { useTrackerStore } from "@/stores/tracker-store";

interface FavoriteButtonProps {
  name: string;
  tag: string;
  region?: string;
}

export function FavoriteButton({ name, tag, region }: FavoriteButtonProps) {
  const { isFavorite, addFavorite, removeFavorite } = useTrackerStore();
  const fav = isFavorite(name, tag);

  return (
    <button
      onClick={() => (fav ? removeFavorite(name, tag) : addFavorite(name, tag, region))}
      className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors shrink-0"
      style={
        fav
          ? { borderColor: "#F59E0B", color: "#F59E0B", backgroundColor: "#F59E0B22" }
          : { borderColor: "#3F3F46", color: "#A1A1AA", backgroundColor: "transparent" }
      }
    >
      <span className="text-lg">{fav ? "★" : "☆"}</span>
      <span className="text-sm font-medium hidden sm:inline">
        {fav ? "Favorited" : "Favorite"}
      </span>
    </button>
  );
}
