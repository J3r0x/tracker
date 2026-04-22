"use client";

import { useState } from "react";
import { SearchBar } from "@/components/search-bar";
import { FavoritesPanel } from "@/components/favorites-panel";
import { cn } from "@/lib/utils";
import { useTrackerStore } from "@/stores/tracker-store";

import { LOL_REGIONS, type LolRegion } from "@/lib/api/lol";

const VALORANT_FEATURES = [
  "Match History", "MMR Tracking", "Agent Stats",
  "Map Winrates", "Performance Insights", "Best Duo", "Damage Delta", "Scoreboard",
];

const LOL_FEATURES = [
  "Match History", "LP History", "Champion Stats",
  "Ranked Solo & Flex", "Live Game", "KDA Tracking", "CS/min", "Scoreboard",
];

type Game = "valorant" | "lol";

export default function HomePage() {
  const [game, setGame] = useState<Game>("valorant");
  const [lolRegion, setLolRegion] = useState<LolRegion>("lan");
  const { region: valRegion } = useTrackerStore();
  void valRegion; // kept for Valorant region selector (passed via store to SearchBar)

  const isValorant = game === "valorant";
  const features = isValorant ? VALORANT_FEATURES : LOL_FEATURES;

  return (
    <main className="min-h-[calc(100vh-3.5rem)] flex flex-col justify-center px-8 md:px-16">
      <div className="max-w-xl py-16">
        {/* Game selector */}
        <div className="flex items-center gap-1 mb-10 p-1 bg-white/[0.03] border border-white/[0.07] rounded-lg w-fit">
          {(["valorant", "lol"] as Game[]).map((g) => (
            <button
              key={g}
              onClick={() => setGame(g)}
              className={cn(
                "px-4 py-1.5 rounded-md text-xs font-black uppercase tracking-[0.15em] transition-all duration-150",
                game === g
                  ? "bg-white/[0.08] text-white border border-white/[0.12]"
                  : "text-zinc-600 hover:text-zinc-400 border border-transparent"
              )}
            >
              {g === "valorant" ? "Valorant" : "League of Legends"}
            </button>
          ))}
        </div>

        {/* Headline */}
        <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-[0.88] mb-8 select-none">
          TRACK.<br />
          GRIND.<br />
          <span className="text-[#C8AA6E]">IMPROVE.</span>
        </h1>

        <p className="text-zinc-500 text-base leading-relaxed mb-10 max-w-sm">
          {isValorant
            ? "Stats, rank history, and performance analytics for Valorant — built for players who actually care."
            : "LP history, champion stats, and match insights for League of Legends — know your numbers."}
        </p>

        {/* Search */}
        <SearchBar game={game} lolRegion={lolRegion} />

        {/* LoL region selector */}
        {!isValorant && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-zinc-600 text-[10px] uppercase tracking-widest font-bold">Server</span>
            <div className="flex flex-wrap gap-1">
              {LOL_REGIONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setLolRegion(r.value)}
                  className={cn(
                    "px-2.5 py-0.5 rounded text-[10px] font-bold uppercase transition-all",
                    lolRegion === r.value
                      ? "bg-white/[0.07] text-white border border-white/[0.14]"
                      : "text-zinc-600 hover:text-zinc-400 border border-transparent"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-zinc-700 text-xs mt-3 font-mono">
          e.g.{" "}
          <span className="text-zinc-500">
            PlayerName
            <span className="text-[#C8AA6E]/50">#</span>
            {isValorant ? "TAG" : LOL_REGIONS.find(r => r.value === lolRegion)?.label ?? lolRegion.toUpperCase()}
          </span>
        </p>

        {/* Favorites quick-access */}
        <FavoritesPanel />

        {/* Features */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-8">
          {features.map((feat) => (
            <span key={feat} className="flex items-center gap-2 text-[11px] text-zinc-600">
              <span className="w-1 h-1 rounded-full shrink-0 bg-zinc-700" />
              {feat}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
