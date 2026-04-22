"use client";

import { motion } from "framer-motion";
import type { LiveGame } from "@/lib/api/lol";

interface Props {
  game: LiveGame;
  puuid: string;
  region: string;
}

export function LolLiveBanner({ game }: Props) {
  const elapsedMin = Math.floor(game.gameLength / 60);
  const elapsedSec = game.gameLength % 60;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-red-500/10 border-b border-red-500/20 px-4 py-2"
    >
      <div className="max-w-[1400px] mx-auto flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse shrink-0" />
        <p className="text-red-400 text-xs font-bold uppercase tracking-[0.2em]">
          Live Game
        </p>
        <span className="text-zinc-500 text-xs font-mono">
          {game.gameMode} · {elapsedMin}:{String(elapsedSec).padStart(2, "0")} elapsed
        </span>
      </div>
    </motion.div>
  );
}
