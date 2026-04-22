"use client";

import { motion } from "framer-motion";
import { MatchCard } from "@/components/player/match-card";
import {
  calcACS,
  calcHSPercent,
  calcKD,
  getPlayerFromMatch,
  getRoundsPlayed,
} from "@/lib/utils/valorant";
import type { HenrikMatch } from "@/lib/api/henrik";

interface MatchHistoryProps {
  matches: HenrikMatch[];
  name: string;
  tag: string;
}

export interface PlayerAvg {
  acs: number;
  kd: number;
  hs: number;
  dmgDelta: number;
}

function computePlayerAvg(
  matches: HenrikMatch[],
  name: string,
  tag: string
): PlayerAvg {
  let totalACS = 0, totalKills = 0, totalDeaths = 0;
  let totalHS = 0, totalBS = 0, totalLS = 0;
  let totalDmgDelta = 0, count = 0;

  for (const match of matches) {
    const player = getPlayerFromMatch(match, name, tag);
    if (!player) continue;
    const rounds = getRoundsPlayed(match);
    totalACS += calcACS(player.stats.score, rounds);
    totalKills += player.stats.kills;
    totalDeaths += player.stats.deaths;
    totalHS += player.stats.headshots;
    totalBS += player.stats.bodyshots;
    totalLS += player.stats.legshots;
    totalDmgDelta +=
      rounds > 0
        ? Math.round((player.damage_made - player.damage_received) / rounds)
        : 0;
    count++;
  }

  if (count === 0) return { acs: 0, kd: 0, hs: 0, dmgDelta: 0 };
  return {
    acs: Math.round(totalACS / count),
    kd: parseFloat((totalKills / Math.max(totalDeaths, 1)).toFixed(2)),
    hs: calcHSPercent(totalHS, totalBS, totalLS),
    dmgDelta: Math.round(totalDmgDelta / count),
  };
}

export function MatchHistory({ matches, name, tag }: MatchHistoryProps) {
  if (matches.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-[#0d0e14] p-12 flex flex-col items-center gap-4 text-center">
        <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
          <svg className="w-6 h-6 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <div>
          <p className="text-zinc-400 font-bold text-sm">No competitive matches found</p>
          <p className="text-zinc-700 text-xs mt-1">This player hasn&apos;t played any ranked games recently, or data is unavailable for this region.</p>
        </div>
      </div>
    );
  }

  const playerAvg = computePlayerAvg(matches, name, tag);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="w-0.5 h-4 rounded-full bg-cyan-400 shrink-0" />
        <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
          Match History
        </h2>
      </div>
      <div className="flex flex-col gap-1.5">
        {matches.map((match, i) => (
          <motion.div
            key={match.metadata.matchid}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: i * 0.045,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            <MatchCard
              match={match}
              name={name}
              tag={tag}
              playerAvg={playerAvg}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
