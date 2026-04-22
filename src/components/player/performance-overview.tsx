"use client";

import { motion } from "framer-motion";
import {
  calcACS,
  calcHSPercent,
  calcKD,
  getMatchResult,
  getPlayerFromMatch,
  getRoundsPlayed,
} from "@/lib/utils/valorant";
import type { HenrikMatch } from "@/lib/api/henrik";

interface PerformanceOverviewProps {
  matches: HenrikMatch[];
  name: string;
  tag: string;
}

// ─── Stat cell (top row) ──────────────────────────────────────────────────────

function StatCell({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col items-center text-center flex-1 px-4 py-4 gap-0.5">
      <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500">{label}</p>
      <p
        className="text-3xl font-black font-mono leading-none"
        style={color ? { color } : undefined}
      >
        {value}
      </p>
      {sub && <p className="text-zinc-500 text-xs font-mono mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Insight pill (bottom row) ────────────────────────────────────────────────

function InsightPill({
  label,
  value,
  badge,
  badgeColor,
  color,
}: {
  label: string;
  value: string;
  badge?: string;
  badgeColor?: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3 h-full">
      <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-zinc-500 leading-none">{label}</p>
      <p
        className="text-xl font-black font-mono leading-none truncate"
        style={color ? { color } : undefined}
      >
        {value}
      </p>
      {badge ? (
        <span
          className="self-start text-[10px] font-black px-2 py-0.5 rounded-full border"
          style={{
            color: badgeColor ?? "#a1a1aa",
            borderColor: `${badgeColor ?? "#a1a1aa"}30`,
            backgroundColor: `${badgeColor ?? "#a1a1aa"}12`,
          }}
        >
          {badge}
        </span>
      ) : (
        <span className="h-[18px]" />
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PerformanceOverview({
  matches,
  name,
  tag,
}: PerformanceOverviewProps) {
  if (matches.length === 0) return null;

  // ── Base stats ────────────────────────────────────────────────────────────
  let wins = 0,
    losses = 0;
  let totalKills = 0,
    totalDeaths = 0,
    totalAssists = 0;
  let totalScore = 0,
    totalRounds = 0;
  let totalHS = 0,
    totalBS = 0,
    totalLS = 0;
  let totalDmgMade = 0;

  let streak = 0;
  let streakIsWin = false;
  let streakLocked = false;

  // per-game breakdown for insights
  const games: {
    result: "win" | "loss" | "draw";
    acs: number;
    kd: number;
    hs: number;
    dmgDelta: number;
    map: string;
    agent: string;
    hour: number;
    teammates: string[];
  }[] = [];

  for (const match of matches) {
    const player = getPlayerFromMatch(match, name, tag);
    if (!player) continue;
    const result = getMatchResult(match, player);
    const rounds = getRoundsPlayed(match);

    if (result === "win") wins++;
    else if (result === "loss") losses++;

    totalKills += player.stats.kills;
    totalDeaths += player.stats.deaths;
    totalAssists += player.stats.assists;
    totalScore += player.stats.score;
    totalHS += player.stats.headshots;
    totalBS += player.stats.bodyshots;
    totalLS += player.stats.legshots;
    totalRounds += rounds;
    totalDmgMade += player.damage_made;

    if (!streakLocked && result !== "draw") {
      if (streak === 0) {
        streak = 1;
        streakIsWin = result === "win";
      } else if ((result === "win") === streakIsWin) {
        streak++;
      } else {
        streakLocked = true;
      }
    }

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
    const hour = new Date(match.metadata.game_start * 1000).getHours();
    const myTeam = player.team.toLowerCase() as "red" | "blue";
    const teammates = (match.players[myTeam] ?? [])
      .filter(
        (p) =>
          !(
            p.name.toLowerCase() === name.toLowerCase() &&
            p.tag.toLowerCase() === tag.toLowerCase()
          )
      )
      .map((p) => `${p.name}#${p.tag}`);

    games.push({ result, acs, kd, hs, dmgDelta, map: match.metadata.map, agent: player.character, hour, teammates });
  }

  const played = wins + losses;
  if (played === 0) return null;

  const winrate = Math.round((wins / played) * 100);
  const kd = calcKD(totalKills, totalDeaths);
  const kdNum = parseFloat(kd);
  const acs = calcACS(totalScore, totalRounds);
  const hs = calcHSPercent(totalHS, totalBS, totalLS);
  const dmgPerRound =
    totalRounds > 0 ? Math.round(totalDmgMade / totalRounds) : 0;
  const killsPerRound =
    totalRounds > 0 ? (totalKills / totalRounds).toFixed(2) : "0";
  const avgKills = (totalKills / played).toFixed(1);

  const wrColor =
    winrate >= 55 ? "#22c55e" : winrate >= 50 ? "#86efac" : "#ef4444";
  const kdColor =
    kdNum >= 1.5 ? "#22c55e" : kdNum >= 1 ? "#a1a1aa" : "#ef4444";
  const streakLabel =
    streak > 1 ? `${streak}${streakIsWin ? "W" : "L"} streak` : null;
  const streakColor = streakIsWin ? "#22c55e" : "#ef4444";

  // ── Insights ──────────────────────────────────────────────────────────────
  const N = games.length;

  // ACS trend: last 5 vs 5 before
  const r5 = games.slice(0, 5);
  const r5prior = games.slice(5, 10);
  const avgACSnow = r5.length
    ? Math.round(r5.reduce((s, g) => s + g.acs, 0) / r5.length)
    : acs;
  const avgACSprior = r5prior.length
    ? Math.round(r5prior.reduce((s, g) => s + g.acs, 0) / r5prior.length)
    : avgACSnow;
  const acsDelta = avgACSnow - avgACSprior;
  const acsTrendBadge =
    acsDelta > 5 ? "↑ Improving" : acsDelta < -5 ? "↓ Declining" : "Stable";
  const acsTrendColor =
    acsDelta > 5 ? "#22c55e" : acsDelta < -5 ? "#ef4444" : "#71717a";

  // Damage delta
  const avgDmgDelta = Math.round(
    games.reduce((s, g) => s + g.dmgDelta, 0) / N
  );

  // Consistency
  const stdDevACS = Math.round(
    Math.sqrt(
      games.reduce((s, g) => s + Math.pow(g.acs - acs, 2), 0) / N
    )
  );
  const consistencyLabel =
    stdDevACS < 50
      ? "Very Consistent"
      : stdDevACS < 100
      ? "Consistent"
      : "Volatile";
  const consistencyColor =
    stdDevACS < 50 ? "#22c55e" : stdDevACS < 100 ? "#d97706" : "#ef4444";

  // Best map
  const mapMap: Record<string, { wins: number; total: number }> = {};
  for (const g of games) {
    if (!mapMap[g.map]) mapMap[g.map] = { wins: 0, total: 0 };
    mapMap[g.map].total++;
    if (g.result === "win") mapMap[g.map].wins++;
  }
  const bestMap = Object.entries(mapMap)
    .filter(([, d]) => d.total >= 2)
    .sort(([, a], [, b]) => b.wins / b.total - a.wins / a.total)[0];

  // Best hour
  const hourMap: Record<number, { wins: number; total: number }> = {};
  for (const g of games) {
    if (!hourMap[g.hour]) hourMap[g.hour] = { wins: 0, total: 0 };
    hourMap[g.hour].total++;
    if (g.result === "win") hourMap[g.hour].wins++;
  }
  let bestHour = -1,
    bestHourWR = 0;
  for (const [h, d] of Object.entries(hourMap)) {
    if (d.total >= 2 && d.wins / d.total > bestHourWR) {
      bestHourWR = d.wins / d.total;
      bestHour = parseInt(h);
    }
  }
  const formatHour = (h: number) => {
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:00 ${ampm}`;
  };

  // Best teammate
  const tmMap: Record<string, { wins: number; total: number }> = {};
  for (const g of games) {
    for (const t of g.teammates) {
      if (!tmMap[t]) tmMap[t] = { wins: 0, total: 0 };
      tmMap[t].total++;
      if (g.result === "win") tmMap[t].wins++;
    }
  }
  const bestDuo = Object.entries(tmMap)
    .filter(([, d]) => d.total >= 3)
    .sort(([, a], [, b]) => b.wins / b.total - a.wins / a.total)[0];

  // Carry rate
  const carryGames = games.filter((g) => g.acs >= 250).length;
  const carryRate = Math.round((carryGames / N) * 100);

  const insights: {
    label: string;
    value: string;
    badge?: string;
    badgeColor?: string;
    color?: string;
  }[] = [];

  // ACS trend
  insights.push({
    label: "ACS Trend",
    value: String(avgACSnow),
    badge: acsTrendBadge,
    badgeColor: acsTrendColor,
    color: acsTrendColor,
  });

  // Damage delta
  insights.push({
    label: "Dmg Delta/R",
    value: `${avgDmgDelta >= 0 ? "+" : ""}${avgDmgDelta}`,
    badge:
      avgDmgDelta >= 30
        ? "Trade Winner"
        : avgDmgDelta >= 0
        ? "Even"
        : "Trade Loser",
    badgeColor:
      avgDmgDelta >= 30 ? "#22c55e" : avgDmgDelta >= 0 ? "#d97706" : "#ef4444",
    color:
      avgDmgDelta >= 30 ? "#22c55e" : avgDmgDelta >= 0 ? "#a1a1aa" : "#ef4444",
  });

  // Consistency
  insights.push({
    label: "Consistency",
    value: `±${stdDevACS}`,
    badge: consistencyLabel,
    badgeColor: consistencyColor,
    color: consistencyColor,
  });

  // Carry rate
  insights.push({
    label: "Carry Rate",
    value: `${carryRate}%`,
    badge: carryRate >= 40 ? "Carry" : undefined,
    badgeColor: "#22c55e",
    color: carryRate >= 40 ? "#22c55e" : carryRate >= 20 ? "#d97706" : "#71717a",
  });

  if (bestMap) {
    insights.push({
      label: "Best Map",
      value: bestMap[0],
      badge: `${Math.round((bestMap[1].wins / bestMap[1].total) * 100)}% WR`,
      badgeColor: "#22c55e",
      color: "#22c55e",
    });
  }

  if (bestHour >= 0) {
    insights.push({
      label: "Peak Hours",
      value: formatHour(bestHour),
      badge: `${Math.round(bestHourWR * 100)}% WR`,
      badgeColor: "#f59e0b",
      color: "#f59e0b",
    });
  }

  if (bestDuo) {
    insights.push({
      label: "Best Duo",
      value: bestDuo[0].split("#")[0],
      badge: `${Math.round((bestDuo[1].wins / bestDuo[1].total) * 100)}% WR`,
      badgeColor: "#a78bfa",
      color: "#a78bfa",
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="rounded-xl border border-white/[0.07] bg-[#0d0e14] overflow-hidden mb-6"
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          <span className="w-0.5 h-4 rounded-full bg-cyan-400 shrink-0" />
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">
            Performance Overview
          </h2>
          <span className="text-zinc-700 text-[10px] font-mono">
            last {matches.length} games
          </span>
        </div>
        <div className="flex items-center gap-2">
          {streakLabel && (
            <span
              className="text-xs font-bold font-mono px-2.5 py-1 rounded-full border"
              style={{
                color: streakColor,
                borderColor: `${streakColor}30`,
                backgroundColor: `${streakColor}10`,
              }}
            >
              {streakLabel}
            </span>
          )}
          {/* WR pill */}
          <span
            className="text-xs font-bold font-mono px-2.5 py-1 rounded-full border"
            style={{
              color: wrColor,
              borderColor: `${wrColor}30`,
              backgroundColor: `${wrColor}10`,
            }}
          >
            {winrate}% WR
          </span>
        </div>
      </div>

      {/* ── Stat row ── */}
      <div className="flex items-stretch divide-x divide-white/[0.05]">
        {/* WR wide cell */}
        <div className="flex flex-col items-center text-center flex-[1.4] px-5 py-4 gap-1">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500">Win Rate</p>
          <p className="text-3xl font-black font-mono leading-none" style={{ color: wrColor }}>
            {winrate}%
          </p>
          <p className="text-zinc-500 text-xs font-mono">
            {wins}W — {losses}L
          </p>
          <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden mt-1">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${winrate}%` }}
              transition={{ duration: 0.9, delay: 0.25, ease: [0.4, 0, 0.2, 1] }}
              style={{ backgroundColor: wrColor }}
            />
          </div>
        </div>

        <StatCell label="ACS" value={acs} sub="combat score" />
        <StatCell label="K/D" value={kd} sub={`${avgKills} kills/g`} color={kdColor} />
        <StatCell label="HS%" value={`${hs}%`} sub="headshots" />
        <StatCell label="Dmg/Round" value={dmgPerRound} sub="avg damage" />
        <StatCell label="Kills/Round" value={killsPerRound} sub={`${totalAssists} assists`} />
      </div>

      {/* ── Insights row ── */}
      {N >= 5 && (
        <div className="border-t border-white/[0.05] px-4 py-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
            {insights.map((insight, i) => (
              <motion.div
                key={insight.label}
                className="h-full"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: 0.15 + i * 0.05, ease: "easeOut" }}
              >
                <InsightPill
                  label={insight.label}
                  value={insight.value}
                  badge={insight.badge}
                  badgeColor={insight.badgeColor}
                  color={insight.color}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
