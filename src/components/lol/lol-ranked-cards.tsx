"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { getTierColor, formatRank, getRankEmblemUrl, type LeagueEntry } from "@/lib/api/lol";

interface LolRankedCardsProps {
  soloEntry: LeagueEntry | null;
  flexEntry: LeagueEntry | null;
}

function RankedCard({
  entry,
  label,
  delay,
}: {
  entry: LeagueEntry | null;
  label: string;
  delay: number;
}) {
  const tierColor = entry ? getTierColor(entry.tier) : "#71717a";
  const wr = entry
    ? Math.round((entry.wins / (entry.wins + entry.losses)) * 100)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.4, 0, 0.2, 1] }}
      className="flex-1 rounded-xl border border-white/[0.07] bg-[#111318] px-5 py-4"
    >
      <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500 mb-3">
        {label}
      </p>

      {entry ? (
        <div className="flex items-center gap-4">
          {/* Rank emblem */}
          <div className="shrink-0 opacity-90">
            <Image
              src={getRankEmblemUrl(entry.tier)}
              alt={entry.tier}
              width={72}
              height={72}
              unoptimized
              className="drop-shadow-lg"
            />
          </div>

          <div className="flex-1 min-w-0">
            <p
              className="text-xl font-black font-mono leading-none truncate"
              style={{ color: tierColor }}
            >
              {formatRank(entry.tier, entry.rank, entry.leaguePoints)}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <p className="text-zinc-500 text-xs font-mono">
                {entry.wins}W {entry.losses}L
              </p>
              <p className="text-sm font-black font-mono text-white">
                {wr}% WR
              </p>
            </div>
            {/* LP progress bar */}
            <div className="mt-2 w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[#C8AA6E]"
                initial={{ width: 0 }}
                animate={{ width: `${entry.leaguePoints}%` }}
                transition={{ duration: 0.9, delay: delay + 0.2, ease: [0.4, 0, 0.2, 1] }}
              />
            </div>
            <div className="flex justify-between mt-0.5">
              <span className="text-zinc-700 text-[9px] font-mono">0 LP</span>
              <span className="text-zinc-600 text-[9px] font-mono">{entry.leaguePoints} / 100 LP</span>
            </div>
            {/* Badges */}
            <div className="flex gap-1 mt-1.5">
              {entry.hotStreak && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-white/[0.1] text-zinc-400">
                  Hot Streak
                </span>
              )}
              {entry.veteran && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-white/[0.1] text-zinc-400">
                  Veteran
                </span>
              )}
              {entry.freshBlood && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-white/[0.1] text-zinc-400">
                  Rising
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-zinc-600 text-sm font-mono">Unranked</p>
      )}
    </motion.div>
  );
}

export function LolRankedCards({ soloEntry, flexEntry }: LolRankedCardsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <RankedCard entry={soloEntry} label="Ranked Solo / Duo" delay={0.05} />
      <RankedCard entry={flexEntry} label="Ranked Flex 5v5" delay={0.1} />
    </div>
  );
}
