"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { getTierColor, formatRank, type LeagueEntry } from "@/lib/api/lol";

interface LolHeaderProps {
  gameName: string;
  tagLine: string;
  summonerLevel: number;
  iconUrl: string;
  soloEntry: LeagueEntry | null;
  region: string;
}

export function LolHeader({
  gameName,
  tagLine,
  summonerLevel,
  iconUrl,
  soloEntry,
  region,
}: LolHeaderProps) {
  const tierColor = soloEntry ? getTierColor(soloEntry.tier) : "#71717a";
  const rankStr = soloEntry
    ? formatRank(soloEntry.tier, soloEntry.rank, soloEntry.leaguePoints)
    : "Unranked";
  const wr = soloEntry
    ? Math.round((soloEntry.wins / (soloEntry.wins + soloEntry.losses)) * 100)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="rounded-xl border border-white/[0.07] bg-[#111318] overflow-hidden mb-5"
    >
      <div className="flex items-center gap-7 px-8 sm:px-10 py-8">
        {/* Summoner icon */}
        <div className="relative shrink-0">
          <div className="w-24 h-24 rounded-full overflow-hidden border border-white/[0.1]">
            <Image
              src={iconUrl}
              alt="Summoner icon"
              width={96}
              height={96}
              className="object-cover"
              unoptimized
            />
          </div>
          {/* Level badge */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#111318] border border-white/[0.1] rounded-full px-2 py-0.5 text-[10px] font-black font-mono text-zinc-400 whitespace-nowrap">
            {summonerLevel}
          </div>
        </div>

        {/* Identity */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-zinc-500 border border-white/[0.08] rounded px-2 py-0.5">
              LoL · {region.toUpperCase()}
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-none text-white truncate">
            {gameName}
            <span className="text-zinc-600 text-2xl font-bold ml-1">#{tagLine}</span>
          </h1>

          {soloEntry && (
            <div className="flex items-center gap-3 mt-3">
              <p
                className="text-lg font-black font-mono leading-none"
                style={{ color: tierColor }}
              >
                {rankStr}
              </p>
              {wr !== null && (
                <span className="text-xs text-zinc-500 font-mono">
                  {soloEntry.wins}W {soloEntry.losses}L · {wr}% WR
                </span>
              )}
              {soloEntry.hotStreak && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-white/[0.1] text-zinc-400">
                  Hot Streak
                </span>
              )}
              {soloEntry.veteran && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-white/[0.1] text-zinc-400">
                  Veteran
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
