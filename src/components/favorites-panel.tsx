"use client";

import { useRouter } from "next/navigation";
import { useTrackerStore } from "@/stores/tracker-store";

export function FavoritesPanel() {
  const { favorites, removeFavorite, region } = useTrackerStore();
  const router = useRouter();

  if (!favorites.length) return null;

  return (
    <div className="mt-10">
      <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-600 mb-3 flex items-center gap-2">
        <span className="text-amber-400">★</span> Favorites
      </p>
      <div className="flex flex-wrap gap-2">
        {favorites.map((f) => (
          <div
            key={`${f.name}#${f.tag}`}
            className="group flex items-center gap-2 bg-white/[0.03] border border-white/[0.07] hover:border-amber-400/30 hover:bg-white/[0.05] rounded-lg pl-3 pr-1 py-1.5 transition-all cursor-pointer"
            onClick={() =>
              router.push(
                `/player/${encodeURIComponent(f.name)}/${encodeURIComponent(f.tag)}?region=${f.region ?? region}`
              )
            }
          >
            <span className="text-zinc-300 text-sm font-medium font-mono">
              {f.name}
              <span className="text-zinc-600">#{f.tag}</span>
            </span>
            {/* Remove button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeFavorite(f.name, f.tag);
              }}
              className="w-5 h-5 flex items-center justify-center rounded text-zinc-700 hover:text-red-400 hover:bg-white/[0.06] transition-colors shrink-0 opacity-0 group-hover:opacity-100"
              title="Remove from favorites"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
