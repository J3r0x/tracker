"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import {
  calcACS,
  calcHSPercent,
  calcKD,
  formatGameLength,
  formatMatchDate,
  getMatchResult,
  getMatchScore,
  getPlayerFromMatch,
  getRoundsPlayed,
  getRankIconUrl,
  getMapSplashUrl,
} from "@/lib/utils/valorant";
import type { HenrikMatch, HenrikPlayer } from "@/lib/api/henrik";
import type { PlayerAvg } from "@/components/player/match-history";
import { cn } from "@/lib/utils";

interface MatchCardProps {
  match: HenrikMatch;
  name: string;
  tag: string;
  playerAvg?: PlayerAvg;
}

const RESULT_CONFIG = {
  win: {
    bar: "bg-green-500",
    glow: "from-green-500/[0.06]",
    badge: "bg-green-500/15 text-green-400 border-green-500/20",
    label: "WIN",
    color: "#22c55e",
  },
  loss: {
    bar: "bg-red-500",
    glow: "from-red-500/[0.06]",
    badge: "bg-red-500/15 text-red-400 border-red-500/20",
    label: "LOSS",
    color: "#ef4444",
  },
  draw: {
    bar: "bg-zinc-500",
    glow: "from-zinc-500/[0.06]",
    badge: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
    label: "DRAW",
    color: "#71717a",
  },
};

// ─── Scoreboard row ─────────────────────────────────────────────────────────

function ScoreboardRow({
  player,
  rounds,
  isMain,
  rank,
}: {
  player: HenrikPlayer;
  rounds: number;
  isMain: boolean;
  rank: number;
}) {
  const kd = calcKD(player.stats.kills, player.stats.deaths);
  const kdNum = parseFloat(kd);
  const acs = calcACS(player.stats.score, rounds);
  const hs = calcHSPercent(
    player.stats.headshots,
    player.stats.bodyshots,
    player.stats.legshots
  );
  const dmgPerRound = rounds > 0 ? Math.round(player.damage_made / rounds) : 0;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors",
        isMain
          ? "bg-cyan-400/[0.07] border border-cyan-400/20"
          : rank % 2 === 0
          ? "bg-white/[0.02] hover:bg-white/[0.04]"
          : "hover:bg-white/[0.03]"
      )}
    >
      {/* Position number */}
      <span className="w-4 shrink-0 text-center text-xs font-black font-mono text-zinc-700">
        {rank}
      </span>
      <div className="relative w-5 h-5 shrink-0">
        <Image
          src={getRankIconUrl(player.currenttier)}
          alt={player.currenttier_patched ?? "rank"}
          fill
          sizes="20px"
          className="object-contain"
        />
      </div>

      {/* Agent icon */}
      <div className="relative w-6 h-6 rounded overflow-hidden bg-zinc-800 shrink-0">
        {player.assets?.agent?.small ? (
          <Image
            src={player.assets.agent.small}
            alt={player.character}
            fill
            sizes="24px"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-[9px] font-bold text-zinc-500">
            {player.character[0]}
          </span>
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0 flex items-center gap-1.5">
        <span
          className={cn(
            "truncate font-medium",
            isMain ? "text-cyan-300" : "text-zinc-300"
          )}
        >
          {player.name}
        </span>
        {isMain && (
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-cyan-400/20 text-cyan-400 shrink-0 tracking-widest">
            YOU
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 shrink-0 text-right">
        <span className="font-mono text-zinc-300 w-16 text-center">
          {player.stats.kills}/{player.stats.deaths}/{player.stats.assists}
        </span>
        <span className="font-mono font-bold w-10 text-center text-zinc-100">{acs}</span>
        <span
          className="font-mono font-bold w-9 text-center"
          style={{
            color:
              kdNum >= 1.5 ? "#22c55e" : kdNum >= 1 ? "#a1a1aa" : "#ef4444",
          }}
        >
          {kd}
        </span>
        <span className="font-mono w-9 text-center text-zinc-500">{hs}%</span>
        <span className="font-mono w-10 text-right text-zinc-600">{dmgPerRound}</span>
      </div>
    </div>
  );
}

// ─── Match achievements ─────────────────────────────────────────────────────

interface Achievement {
  id: string;
  label: string;
  color: string;
}

function computeAchievements(
  match: HenrikMatch,
  player: HenrikPlayer,
  rounds: number
): Achievement[] {
  const all = match.players.all_players ?? [];
  const myTeam = player.team.toLowerCase() as "red" | "blue";
  const team = match.players[myTeam] ?? [];
  const earned: Achievement[] = [];

  const myACS = calcACS(player.stats.score, rounds);
  const myKD = parseFloat(calcKD(player.stats.kills, player.stats.deaths));
  const myHS = calcHSPercent(
    player.stats.headshots,
    player.stats.bodyshots,
    player.stats.legshots
  );
  const myDmgDelta =
    rounds > 0 ? (player.damage_made - player.damage_received) / rounds : 0;

  // MVP — highest ACS in whole match
  const topMatchACS = all.reduce(
    (b, p) => Math.max(b, calcACS(p.stats.score, rounds)),
    0
  );
  if (myACS >= topMatchACS && all.length > 1)
    earned.push({ id: "mvp", label: "MVP", color: "#fbbf24" });

  // Top Fragger — most kills on team
  const topTeamKills = team.reduce((b, p) => Math.max(b, p.stats.kills), 0);
  if (player.stats.kills >= topTeamKills && player.stats.kills > 0)
    earned.push({ id: "top_fragger", label: "Top Fragger", color: "#f97316" });

  // Sharpshooter — highest HS% on team (≥25%)
  const topTeamHS = team.reduce(
    (b, p) =>
      Math.max(
        b,
        calcHSPercent(p.stats.headshots, p.stats.bodyshots, p.stats.legshots)
      ),
    0
  );
  if (myHS >= topTeamHS && myHS >= 25)
    earned.push({ id: "sharp", label: "Sharpshooter", color: "#22d3ee" });

  // On Fire — K/D ≥ 2.0
  if (myKD >= 2.0)
    earned.push({ id: "fire", label: "On Fire", color: "#f97316" });

  // Carry — ACS ≥ 1.3× team average
  const teamAvgACS =
    team.length > 0
      ? team.reduce((s, p) => s + calcACS(p.stats.score, rounds), 0) /
        team.length
      : myACS;
  if (teamAvgACS > 0 && myACS / teamAvgACS >= 1.3)
    earned.push({ id: "carry", label: "Carry", color: "#a78bfa" });

  // Survivor — fewest deaths on team (≤10)
  const minTeamDeaths = team.reduce(
    (b, p) => Math.min(b, p.stats.deaths),
    Infinity
  );
  if (player.stats.deaths <= minTeamDeaths && player.stats.deaths <= 10)
    earned.push({ id: "survivor", label: "Survivor", color: "#34d399" });

  // Playmaker — most assists on team (≥5)
  const topTeamAssists = team.reduce(
    (b, p) => Math.max(b, p.stats.assists),
    0
  );
  if (player.stats.assists >= topTeamAssists && player.stats.assists >= 5)
    earned.push({ id: "playmaker", label: "Playmaker", color: "#60a5fa" });

  // Trade King — best damage delta on team
  const topTeamDelta = team.reduce(
    (b, p) =>
      Math.max(
        b,
        rounds > 0 ? (p.damage_made - p.damage_received) / rounds : 0
      ),
    -Infinity
  );
  if (myDmgDelta >= topTeamDelta && myDmgDelta > 20)
    earned.push({ id: "trade", label: "Trade King", color: "#fb923c" });

  return earned;
}

function MatchAchievements({
  achievements,
}: {
  achievements: Achievement[];
}) {
  if (!achievements.length) return null;
  return (
    <div className="px-4 py-2.5 flex flex-wrap items-center gap-2">
      <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-600 mr-0.5">
        Achievements
      </p>
      {achievements.map((a) => (
        <span
          key={a.id}
          className="text-xs font-black px-2.5 py-1 rounded-full border tracking-wide"
          style={{
            color: a.color,
            borderColor: `${a.color}30`,
            backgroundColor: `${a.color}12`,
          }}
        >
          {a.label}
        </span>
      ))}
    </div>
  );
}

// ─── Match leaders ────────────────────────────────────────────────────────────

function TopPerformers({
  match,
  name,
  tag,
  rounds,
}: {
  match: HenrikMatch;
  name: string;
  tag: string;
  rounds: number;
}) {
  const all = match.players.all_players ?? [];
  if (!all.length) return null;

  const leader = (
    compareFn: (a: HenrikPlayer, b: HenrikPlayer) => number
  ): HenrikPlayer => all.slice().sort(compareFn)[0];

  const byACS = leader(
    (a, b) => calcACS(b.stats.score, rounds) - calcACS(a.stats.score, rounds)
  );
  const byHS = leader((a, b) => {
    const ha = calcHSPercent(
      a.stats.headshots,
      a.stats.bodyshots,
      a.stats.legshots
    );
    const hb = calcHSPercent(
      b.stats.headshots,
      b.stats.bodyshots,
      b.stats.legshots
    );
    return hb - ha;
  });
  const byKD = leader(
    (a, b) =>
      parseFloat(calcKD(b.stats.kills, b.stats.deaths)) -
      parseFloat(calcKD(a.stats.kills, a.stats.deaths))
  );
  const byDmg = leader((a, b) => b.damage_made - a.damage_made);
  const byDmgR = leader(
    (a, b) =>
      (rounds > 0 ? b.damage_made / rounds : 0) -
      (rounds > 0 ? a.damage_made / rounds : 0)
  );
  const byKills = leader((a, b) => b.stats.kills - a.stats.kills);

  const leaders = [
    {
      label: "Combat Score",
      value: String(calcACS(byACS.stats.score, rounds)),
      player: byACS,
    },
    {
      label: "Best HS%",
      value: `${calcHSPercent(
        byHS.stats.headshots,
        byHS.stats.bodyshots,
        byHS.stats.legshots
      )}%`,
      player: byHS,
    },
    {
      label: "Top K/D",
      value: calcKD(byKD.stats.kills, byKD.stats.deaths),
      player: byKD,
    },
    {
      label: "Most Dmg",
      value: byDmg.damage_made.toLocaleString(),
      player: byDmg,
    },
    {
      label: "Dmg / Round",
      value:
        rounds > 0 ? String(Math.round(byDmgR.damage_made / rounds)) : "—",
      player: byDmgR,
    },
    {
      label: "Top Fragger",
      value: String(byKills.stats.kills),
      player: byKills,
    },
  ];

  return (
    <div className="px-3 py-3">
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className="w-0.5 h-3 rounded-full bg-zinc-600 shrink-0" />
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-600">
          Match Leaders
        </p>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {leaders.map(({ label, value, player: p }) => {
          const isYou =
            p.name.toLowerCase() === name.toLowerCase() &&
            p.tag.toLowerCase() === tag.toLowerCase();
          return (
            <div
              key={label}
              className={cn(
                "relative rounded-lg overflow-hidden border min-h-[72px]",
                isYou ? "border-cyan-400/25" : "border-white/[0.05]"
              )}
              style={{ background: "#080910" }}
            >
              {/* Agent bust art — anchored bottom-right */}
              {p.assets?.agent?.bust && (
                <div className="absolute inset-0 pointer-events-none">
                  <Image
                    src={p.assets.agent.bust}
                    alt=""
                    fill
                    sizes="160px"
                    className="object-contain object-right-bottom opacity-30"
                  />
                </div>
              )}
              <div className="relative px-2 pt-2 pb-2 flex flex-col gap-0.5">
                <p className="text-[9px] uppercase tracking-[0.12em] font-bold text-zinc-600 leading-none">
                  {label}
                </p>
                <p
                  className="text-xl font-black font-mono leading-tight"
                  style={{ color: isYou ? "#22d3ee" : "#f4f4f5" }}
                >
                  {value}
                </p>
                <div className="flex items-center gap-1">
                  {p.assets?.agent?.small && (
                    <div className="relative w-4 h-4 rounded-sm overflow-hidden bg-zinc-800 shrink-0">
                      <Image
                        src={p.assets.agent.small}
                        alt={p.character}
                        fill
                        sizes="16px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <p
                    className="text-[10px] truncate"
                    style={{ color: isYou ? "#22d3ee" : "#71717a" }}
                  >
                    {isYou ? "You" : p.name}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Per-match insights ──────────────────────────────────────────────────────

function PerMatchInsights({
  match,
  player,
  rounds,
  playerAvg,
}: {
  match: HenrikMatch;
  player: HenrikPlayer;
  rounds: number;
  playerAvg: PlayerAvg;
}) {
  const acs = calcACS(player.stats.score, rounds);
  const kd = parseFloat(calcKD(player.stats.kills, player.stats.deaths));
  const hs = calcHSPercent(
    player.stats.headshots,
    player.stats.bodyshots,
    player.stats.legshots
  );
  const dmgDelta =
    rounds > 0
      ? Math.round((player.damage_made - player.damage_received) / rounds)
      : 0;

  // Team contribution
  const myTeam = player.team.toLowerCase() as "red" | "blue";
  const teamPlayers = match.players[myTeam] ?? [];
  const teamKills = teamPlayers.reduce((s, p) => s + p.stats.kills, 0);
  const teamDmg = teamPlayers.reduce((s, p) => s + p.damage_made, 0);
  const killContrib =
    teamKills > 0 ? Math.round((player.stats.kills / teamKills) * 100) : 0;
  const dmgContrib =
    teamDmg > 0 ? Math.round((player.damage_made / teamDmg) * 100) : 0;

  // MVP (highest ACS in whole match)
  const allPlayers = match.players.all_players ?? [];
  const mvpPlayer = allPlayers.reduce((best, p) =>
    calcACS(p.stats.score, rounds) > calcACS(best.stats.score, rounds) ? p : best
  );
  const isMVP =
    mvpPlayer.name.toLowerCase() === player.name.toLowerCase() &&
    mvpPlayer.tag.toLowerCase() === player.tag.toLowerCase();

  // Performance rating (0–100)
  const acsScore = Math.min(acs / 250, 1) * 40;
  const kdScore = Math.min(kd / 1.5, 1) * 30;
  const hsScore = Math.min(hs / 30, 1) * 15;
  const dmgScore = Math.min(Math.max((dmgDelta + 100) / 200, 0), 1) * 15;
  const rating = Math.round(acsScore + kdScore + hsScore + dmgScore);
  const ratingColor =
    rating >= 75 ? "#22c55e" : rating >= 50 ? "#d97706" : "#ef4444";
  const ratingLabel =
    rating >= 85
      ? "Outstanding"
      : rating >= 70
      ? "Strong"
      : rating >= 55
      ? "Average"
      : rating >= 40
      ? "Below Avg"
      : "Weak";

  // vs avg deltas
  const acsDelta = acs - playerAvg.acs;
  const kdDelta = parseFloat((kd - playerAvg.kd).toFixed(2));
  const hsDelta = hs - playerAvg.hs;

  // ── Unique metrics ──────────────────────────────────────────────────────────
  const teamAvgACS =
    teamPlayers.length > 0
      ? teamPlayers.reduce(
          (s, p) => s + calcACS(p.stats.score, rounds),
          0
        ) / teamPlayers.length
      : acs;
  const carryIndex = teamAvgACS > 0 ? acs / teamAvgACS : 1;
  const carryLabel =
    carryIndex >= 1.5
      ? "Hard Carry"
      : carryIndex >= 1.2
      ? "Carrying"
      : carryIndex >= 0.8
      ? "On par"
      : "Dragged";
  const carryColor =
    carryIndex >= 1.5
      ? "#22c55e"
      : carryIndex >= 1.2
      ? "#86efac"
      : carryIndex >= 0.8
      ? "#71717a"
      : "#ef4444";

  const tradeEffRaw =
    player.damage_made / Math.max(player.damage_received, 1);
  const tradeEff = tradeEffRaw.toFixed(2);
  const tradeEffColor =
    tradeEffRaw >= 1.5 ? "#22c55e" : tradeEffRaw >= 1.0 ? "#a1a1aa" : "#ef4444";

  const allPlayersSorted = allPlayers
    .slice()
    .sort(
      (a, b) => calcACS(b.stats.score, rounds) - calcACS(a.stats.score, rounds)
    );
  const peerRank =
    allPlayersSorted.findIndex(
      (p) =>
        p.name.toLowerCase() === player.name.toLowerCase() &&
        p.tag.toLowerCase() === player.tag.toLowerCase()
    ) + 1;

  function StatDelta({
    label,
    value,
    avg,
    delta,
    unit = "",
  }: {
    label: string;
    value: string | number;
    avg: string | number;
    delta: number;
    unit?: string;
  }) {
    const up = delta > 0;
    const neutral = Math.abs(delta) < 0.01;
    const color = neutral ? "#71717a" : up ? "#22c55e" : "#ef4444";
    return (
      <div className="flex flex-col items-center gap-0.5">
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-600">
          {label}
        </p>
        <p className="text-base font-black font-mono text-zinc-100">
          {value}{unit}
        </p>
        <p className="text-xs font-mono font-bold" style={{ color }}>
          {neutral ? "—" : `${up ? "+" : ""}${delta}${unit} vs avg`}
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-3">
      <div className="flex items-center gap-3 mb-3">
        <span className="w-0.5 h-3 rounded-full bg-cyan-400/50 shrink-0" />
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-600">
          Match Insights
        </p>
        {isMVP && (
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 tracking-widest">
            MVP
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
        {/* Performance rating */}
        <div className="flex flex-col items-center gap-0.5">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-600">Rating</p>
          <p className="text-base font-black font-mono" style={{ color: ratingColor }}>
            {rating}
          </p>
          <p className="text-xs font-mono" style={{ color: ratingColor }}>
            {ratingLabel}
          </p>
        </div>

        <div className="w-px h-10 bg-white/[0.06] self-center" />

        {/* vs avg stats */}
        <StatDelta label="ACS" value={acs} avg={playerAvg.acs} delta={acsDelta} />
        <StatDelta label="K/D" value={kd.toFixed(2)} avg={playerAvg.kd.toFixed(2)} delta={kdDelta} />
        <StatDelta label="HS%" value={hs} avg={playerAvg.hs} delta={hsDelta} unit="%" />

        <div className="w-px h-10 bg-white/[0.06] self-center" />

        {/* Team contribution */}
        <div className="flex flex-col items-center gap-0.5">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-600">Kill Share</p>
          <p className="text-base font-black font-mono text-zinc-100">{killContrib}%</p>
          <p className="text-xs font-mono text-zinc-600">of team kills</p>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-600">Dmg Share</p>
          <p className="text-base font-black font-mono text-zinc-100">{dmgContrib}%</p>
          <p className="text-xs font-mono text-zinc-600">of team damage</p>
        </div>

        <div className="w-px h-10 bg-white/[0.06] self-center" />

        {/* Unique metrics — not shown in most trackers */}
        <div className="flex flex-col items-center gap-0.5">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-600">Carry Index</p>
          <p className="text-base font-black font-mono" style={{ color: carryColor }}>
            {carryIndex.toFixed(2)}×
          </p>
          <p className="text-xs font-mono" style={{ color: carryColor }}>
            {carryLabel}
          </p>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-600">Trade Eff</p>
          <p className="text-base font-black font-mono" style={{ color: tradeEffColor }}>
            {tradeEff}
          </p>
          <p className="text-xs font-mono text-zinc-600">dealt/received</p>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-600">Match Rank</p>
          <p className="text-base font-black font-mono text-zinc-100">
            {peerRank > 0 ? `#${peerRank}` : "—"}
          </p>
          <p className="text-xs font-mono text-zinc-600">of {allPlayers.length}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Scoreboard panel ────────────────────────────────────────────────────────

function Scoreboard({
  match,
  name,
  tag,
  player,
}: {
  match: HenrikMatch;
  name: string;
  tag: string;
  player: HenrikPlayer;
}) {
  const rounds = getRoundsPlayed(match);
  const myTeam = player.team.toLowerCase() as "red" | "blue";
  const enemyTeam = myTeam === "red" ? "blue" : "red";

  const myPlayers = (match.players[myTeam] ?? [])
    .slice()
    .sort(
      (a, b) =>
        calcACS(b.stats.score, rounds) - calcACS(a.stats.score, rounds)
    );
  const enemyPlayers = (match.players[enemyTeam] ?? [])
    .slice()
    .sort(
      (a, b) =>
        calcACS(b.stats.score, rounds) - calcACS(a.stats.score, rounds)
    );

  const myScore = match.teams[myTeam]?.rounds_won ?? 0;
  const enemyScore = match.teams[enemyTeam]?.rounds_won ?? 0;

  return (
    <div className="mt-2 px-1 pb-3 space-y-3">
      {/* Column headers */}
      <div className="flex items-center gap-2 px-3 text-xs uppercase tracking-[0.15em] text-zinc-700 font-bold">
        <div className="w-4" />
        <div className="w-5" />
        <div className="w-6" />
        <div className="flex-1">Player</div>
        <div className="flex items-center gap-4 shrink-0">
          <span className="w-16 text-center">KDA</span>
          <span className="w-10 text-center">ACS</span>
          <span className="w-9 text-center">K/D</span>
          <span className="w-9 text-center">HS%</span>
          <span className="w-10 text-right">DMG/R</span>
        </div>
      </div>

      {/* Your team */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-green-500/60 px-3 mb-1">
          Your Team — {myScore}
        </p>
        <div className="space-y-0.5">
          {myPlayers.map((p, i) => (
            <ScoreboardRow
              key={`${p.name}#${p.tag}`}
              player={p}
              rounds={rounds}
              rank={i + 1}
              isMain={
                p.name.toLowerCase() === name.toLowerCase() &&
                p.tag.toLowerCase() === tag.toLowerCase()
              }
            />
          ))}
        </div>
      </div>

      <div className="border-t border-white/[0.05]" />

      {/* Enemy team */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-red-500/60 px-3 mb-1">
          Enemy Team — {enemyScore}
        </p>
        <div className="space-y-0.5">
          {enemyPlayers.map((p, i) => (
            <ScoreboardRow
              key={`${p.name}#${p.tag}`}
              player={p}
              rounds={rounds}
              rank={i + 1}
              isMain={false}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main card ───────────────────────────────────────────────────────────────

export function MatchCard({ match, name, tag, playerAvg }: MatchCardProps) {
  const [expanded, setExpanded] = useState(false);

  const player = getPlayerFromMatch(match, name, tag);
  if (!player) return null;

  const result = getMatchResult(match, player);
  const score = getMatchScore(match, player);
  const cfg = RESULT_CONFIG[result];
  const rounds = getRoundsPlayed(match);

  const kd = calcKD(player.stats.kills, player.stats.deaths);
  const acs = calcACS(player.stats.score, rounds);
  const hs = calcHSPercent(
    player.stats.headshots,
    player.stats.bodyshots,
    player.stats.legshots
  );
  const kdNum = parseFloat(kd);
  const dmgDelta =
    rounds > 0
      ? Math.round((player.damage_made - player.damage_received) / rounds)
      : 0;

  const mapSplash = getMapSplashUrl(match.metadata.map);
  const achievements = computeAchievements(match, player, rounds);

  return (
    <motion.div
      whileHover={{ y: -1 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className={cn(
        "group relative bg-[#0d0e14] border rounded-xl overflow-hidden transition-colors duration-150",
        expanded
          ? "border-white/[0.12]"
          : "border-white/[0.06] hover:border-white/[0.10]"
      )}
    >
      {/* Map splash background */}
      {mapSplash && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.07] pointer-events-none"
          style={{ backgroundImage: `url(${mapSplash})` }}
        />
      )}
      {/* Clickable summary row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left cursor-pointer"
        aria-expanded={expanded}
      >
        <div className="relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
          {/* Result color bar */}
          <div
            className={cn(
              "absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full",
              cfg.bar
            )}
          />

          {/* Subtle glow */}
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-r to-transparent transition-opacity",
              cfg.glow,
              expanded ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
          />

          {/* Agent portrait */}
          <div className="relative w-11 h-11 shrink-0 rounded-lg overflow-hidden bg-zinc-800 ml-2">
            {player.assets?.agent?.small ? (
              <Image
                src={player.assets.agent.small}
                alt={player.character}
                fill
                sizes="44px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-bold text-zinc-500">
                {player.character[0]}
              </div>
            )}
          </div>

          {/* Agent name + result badge */}
            <div className="flex flex-col gap-1.5 w-24 shrink-0">
            <p className="text-sm font-bold truncate">{player.character}</p>
            <span
              className={cn(
                "text-xs font-black tracking-widest px-2 py-0.5 rounded border w-fit",
                cfg.badge
              )}
            >
              {cfg.label}
            </span>
          </div>

          {/* Score + map */}
          <div className="text-center w-16 shrink-0">
            <p className="text-base font-black font-mono">
              <span style={{ color: cfg.color }}>{score.own}</span>
              <span className="text-zinc-700 mx-0.5">:</span>
              <span className="text-zinc-400">{score.enemy}</span>
            </p>
            <p className="text-zinc-600 text-xs mt-0.5 truncate">
              {match.metadata.map}
            </p>
          </div>

          <div className="hidden sm:block w-px h-8 bg-white/5 shrink-0" />

          {/* Stats */}
          <div className="hidden sm:flex items-center gap-5 flex-1">
            <div className="text-center">
              <p className="text-white font-bold text-sm leading-none font-mono">
                {player.stats.kills}/{player.stats.deaths}/{player.stats.assists}
              </p>
              <p className="text-zinc-500 text-xs mt-0.5 uppercase tracking-[0.15em]">
                K/D/A
              </p>
            </div>
            <div className="text-center">
              <p
                className="font-bold text-sm leading-none font-mono"
                style={{
                  color:
                    kdNum >= 1.5
                      ? "#22c55e"
                      : kdNum >= 1
                      ? "#a1a1aa"
                      : "#ef4444",
                }}
              >
                {kd}
              </p>
              <p className="text-zinc-500 text-[9px] mt-0.5 uppercase tracking-[0.15em]">
                K/D
              </p>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-sm leading-none font-mono">
                {acs}
              </p>
              <p className="text-zinc-500 text-[9px] mt-0.5 uppercase tracking-[0.15em]">
                ACS
              </p>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-sm leading-none font-mono">
                {hs}%
              </p>
              <p className="text-zinc-500 text-[9px] mt-0.5 uppercase tracking-[0.15em]">
                HS%
              </p>
            </div>
            <div className="text-center">
              <p
                className="font-bold text-sm leading-none font-mono"
                style={{
                  color:
                    dmgDelta >= 50
                      ? "#22c55e"
                      : dmgDelta >= 0
                      ? "#a1a1aa"
                      : "#ef4444",
                }}
              >
                {dmgDelta >= 0 ? "+" : ""}
                {dmgDelta}
              </p>
              <p className="text-zinc-500 text-[9px] mt-0.5 uppercase tracking-[0.15em]">
                DMG±
              </p>
            </div>
          </div>

          {/* Right: time + chevron */}
          <div className="ml-auto flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-zinc-500 text-xs font-medium">
                {formatGameLength(match.metadata.game_length)}
              </p>
              <p className="text-zinc-700 text-[10px] mt-0.5">
                {formatMatchDate(match.metadata.game_start)}
              </p>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn(
                "text-zinc-600 transition-transform duration-200 shrink-0",
                expanded && "rotate-180"
              )}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </button>

      {/* Expandable panel: insights + scoreboard */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/[0.06] bg-[#07080c]">
              {/* Achievement pills */}
              {achievements.length > 0 && (
                <>
                  <MatchAchievements achievements={achievements} />
                  <div className="border-t border-white/[0.05]" />
                </>
              )}
              {/* Match leaders */}
              <TopPerformers
                match={match}
                name={name}
                tag={tag}
                rounds={rounds}
              />
              <div className="border-t border-white/[0.05]" />
              {/* Per-match insights vs avg */}
              {playerAvg && (
                <>
                  <PerMatchInsights
                    match={match}
                    player={player}
                    rounds={rounds}
                    playerAvg={playerAvg}
                  />
                  <div className="border-t border-white/[0.05]" />
                </>
              )}
              <Scoreboard match={match} name={name} tag={tag} player={player} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


