"use client";

import { useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { getChampionSquare, type LolMatch } from "@/lib/api/lol";

interface Props {
  matches: LolMatch[];
  puuid: string;
}

interface ChampStat {
  name: string;
  games: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
}

export function LolChampionStats({ matches, puuid }: Props) {
  const stats = useMemo(() => {
    const map = new Map<string, ChampStat>();

    for (const m of matches) {
      const me = m.info.participants.find((p) => p.puuid === puuid);
      if (!me) continue;

      const existing = map.get(me.championName);
      if (existing) {
        existing.games++;
        if (me.win) existing.wins++;
        existing.kills += me.kills;
        existing.deaths += me.deaths;
        existing.assists += me.assists;
      } else {
        map.set(me.championName, {
          name: me.championName,
          games: 1,
          wins: me.win ? 1 : 0,
          kills: me.kills,
          deaths: me.deaths,
          assists: me.assists,
        });
      }
    }

    return [...map.values()]
      .sort((a, b) => b.games - a.games)
      .slice(0, 8);
  }, [matches, puuid]);

  if (!stats.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="rounded-xl border border-white/[0.07] bg-[#0d0e14] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-white/[0.05]">
        <span className="w-0.5 h-4 rounded-full bg-amber-400 shrink-0" />
        <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">
          Champions
        </h2>
        <span className="text-zinc-700 text-[10px] font-mono ml-auto">
          {matches.length} games
        </span>
      </div>

      <div className="px-3 py-2 flex flex-col gap-0.5">
        {stats.map((champ, i) => {
          const wr = Math.round((champ.wins / champ.games) * 100);
          const kd = champ.deaths === 0
            ? "Perfect"
            : ((champ.kills + champ.assists) / champ.deaths).toFixed(2);
          const wrColor =
            wr >= 60 ? "#22c55e" : wr >= 50 ? "#d97706" : "#ef4444";

          return (
            <motion.div
              key={champ.name}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: 0.05 * i }}
              className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/[0.03] transition-colors"
            >
              {/* Portrait */}
              <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-white/[0.08]">
                <Image
                  src={getChampionSquare(champ.name)}
                  alt={champ.name}
                  width={36}
                  height={36}
                  className="object-cover"
                  unoptimized
                />
              </div>

              {/* Name + sub-stats */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-zinc-100 truncate leading-none">
                  {champ.name}
                </p>
                <div className="flex gap-2 mt-0.5">
                  <span className="text-zinc-500 text-[10px] font-mono">{champ.games}G</span>
                  <span className="text-zinc-500 text-[10px] font-mono">KDA {kd}</span>
                </div>
              </div>

              {/* WR */}
              <div className="text-right shrink-0">
                <p className="text-sm font-black font-mono leading-none" style={{ color: wrColor }}>
                  {wr}%
                </p>
                <p className="text-zinc-600 text-[9px] mt-0.5">
                  {champ.wins}W {champ.games - champ.wins}L
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
