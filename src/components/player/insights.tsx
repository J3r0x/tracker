import {
  calcACS,
  calcHSPercent,
  calcKD,
  getMatchResult,
  getPlayerFromMatch,
  getRoundsPlayed,
} from "@/lib/utils/valorant";
import type { HenrikMatch } from "@/lib/api/henrik";

interface InsightsProps {
  matches: HenrikMatch[];
  name: string;
  tag: string;
}

interface InsightCardProps {
  label: string;
  value: string;
  sub: string;
  color?: string;
  trend?: "up" | "down" | "neutral";
  badge?: string;
  badgeColor?: string;
  wide?: boolean;
}

function InsightCard({
  label,
  value,
  sub,
  color,
  trend,
  badge,
  badgeColor,
  wide,
}: InsightCardProps) {
  const trendIcon =
    trend === "up" ? "↑" : trend === "down" ? "↓" : null;
  const trendColor =
    trend === "up" ? "#22c55e" : trend === "down" ? "#ef4444" : "#a1a1aa";

  return (
    <div
      className={`bg-[#0d0e14] border border-white/[0.07] rounded-xl p-4 flex flex-col gap-2 ${
        wide ? "col-span-2" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[8px] uppercase tracking-[0.2em] font-bold text-zinc-600">
          {label}
        </p>
        {badge && (
          <span
            className="text-[8px] font-black px-2 py-0.5 rounded-full border"
            style={{
              color: badgeColor ?? "#a1a1aa",
              borderColor: `${badgeColor ?? "#a1a1aa"}30`,
              backgroundColor: `${badgeColor ?? "#a1a1aa"}10`,
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <p
          className="text-2xl font-black font-mono leading-none"
          style={color ? { color } : undefined}
        >
          {value}
        </p>
        {trendIcon && (
          <span className="text-sm font-bold font-mono" style={{ color: trendColor }}>
            {trendIcon}
          </span>
        )}
      </div>
      <p className="text-zinc-600 text-[10px] font-mono leading-snug">{sub}</p>
    </div>
  );
}

// ─── Computation helpers ──────────────────────────────────────────────────────

interface PerGameStats {
  result: "win" | "loss" | "draw";
  acs: number;
  kd: number;
  hs: number;
  dmgDelta: number;
  map: string;
  agent: string;
  hour: number;
  teammates: string[]; // "name#tag"
}

function computePerGame(
  matches: HenrikMatch[],
  name: string,
  tag: string
): PerGameStats[] {
  return matches.flatMap((match) => {
    const player = getPlayerFromMatch(match, name, tag);
    if (!player) return [];
    const result = getMatchResult(match, player);
    const rounds = getRoundsPlayed(match);
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

    return [{ result, acs, kd, hs, dmgDelta, map: match.metadata.map, agent: player.character, hour, teammates }];
  });
}

// ─── Main component ───────────────────────────────────────────────────────────

export function Insights({ matches, name, tag }: InsightsProps) {
  if (matches.length < 5) return null;

  const games = computePerGame(matches, name, tag);
  const played = games.length;
  if (played === 0) return null;

  // ── Performance Trend (last 5 vs 5 before) ──────────────────────────────
  const recent = games.slice(0, 5);
  const prior = games.slice(5, 10);

  const avgACS = (g: PerGameStats[]) =>
    g.length ? Math.round(g.reduce((s, x) => s + x.acs, 0) / g.length) : 0;
  const avgKD = (g: PerGameStats[]) =>
    g.length
      ? parseFloat((g.reduce((s, x) => s + x.kd, 0) / g.length).toFixed(2))
      : 0;

  const recentACS = avgACS(recent);
  const priorACS = prior.length ? avgACS(prior) : recentACS;
  const acsD = recentACS - priorACS;
  const acsTrend: "up" | "down" | "neutral" =
    acsD > 5 ? "up" : acsD < -5 ? "down" : "neutral";

  const recentKD = avgKD(recent);
  const priorKD = prior.length ? avgKD(prior) : recentKD;
  const kdTrend: "up" | "down" | "neutral" =
    recentKD > priorKD + 0.05
      ? "up"
      : recentKD < priorKD - 0.05
      ? "down"
      : "neutral";

  // ── Damage Delta ──────────────────────────────────────────────────────────
  const avgDmgDelta = Math.round(
    games.reduce((s, g) => s + g.dmgDelta, 0) / played
  );

  // ── Consistency score (lower std dev = more consistent) ───────────────────
  const meanACS = avgACS(games);
  const stdDevACS = Math.round(
    Math.sqrt(
      games.reduce((s, g) => s + Math.pow(g.acs - meanACS, 2), 0) / played
    )
  );
  const consistencyLabel =
    stdDevACS < 50 ? "Very Consistent" : stdDevACS < 100 ? "Consistent" : "Volatile";
  const consistencyColor =
    stdDevACS < 50 ? "#22c55e" : stdDevACS < 100 ? "#d97706" : "#ef4444";

  // ── Best hour to play ─────────────────────────────────────────────────────
  const hourMap: Record<number, { wins: number; total: number }> = {};
  for (const g of games) {
    if (!hourMap[g.hour]) hourMap[g.hour] = { wins: 0, total: 0 };
    hourMap[g.hour].total++;
    if (g.result === "win") hourMap[g.hour].wins++;
  }
  let bestHour = -1;
  let bestHourWR = 0;
  for (const [h, d] of Object.entries(hourMap)) {
    if (d.total >= 2) {
      const wr = d.wins / d.total;
      if (wr > bestHourWR) {
        bestHourWR = wr;
        bestHour = parseInt(h);
      }
    }
  }
  const formatHour = (h: number) => {
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:00 ${ampm}`;
  };

  // ── Most reliable teammate ─────────────────────────────────────────────────
  const teammateMap: Record<string, { wins: number; total: number }> = {};
  for (const g of games) {
    for (const t of g.teammates) {
      if (!teammateMap[t]) teammateMap[t] = { wins: 0, total: 0 };
      teammateMap[t].total++;
      if (g.result === "win") teammateMap[t].wins++;
    }
  }
  const topTeammate = Object.entries(teammateMap)
    .filter(([, d]) => d.total >= 3)
    .sort(([, a], [, b]) => b.wins / b.total - a.wins / a.total)[0];

  // ── Best map ──────────────────────────────────────────────────────────────
  const mapMap: Record<string, { wins: number; total: number }> = {};
  for (const g of games) {
    if (!mapMap[g.map]) mapMap[g.map] = { wins: 0, total: 0 };
    mapMap[g.map].total++;
    if (g.result === "win") mapMap[g.map].wins++;
  }
  const bestMap = Object.entries(mapMap)
    .filter(([, d]) => d.total >= 2)
    .sort(([, a], [, b]) => b.wins / b.total - a.wins / a.total)[0];
  const worstMap = Object.entries(mapMap)
    .filter(([, d]) => d.total >= 2)
    .sort(([, a], [, b]) => a.wins / a.total - b.wins / b.total)[0];

  // ── Multi-kill rate (≥3 kills in one sense: avg kills ≥ 3) ─────────────────
  // We don't have round-level data, so we use "games with 20+ kills" as a "carry" game
  const carryGames = games.filter((g) => g.acs >= 250).length;
  const carryRate = Math.round((carryGames / played) * 100);

  // ── Best agent ────────────────────────────────────────────────────────────
  const agentMap: Record<string, { wins: number; total: number; acs: number }> = {};
  for (const g of games) {
    if (!agentMap[g.agent]) agentMap[g.agent] = { wins: 0, total: 0, acs: 0 };
    agentMap[g.agent].total++;
    agentMap[g.agent].acs += g.acs;
    if (g.result === "win") agentMap[g.agent].wins++;
  }
  const bestAgent = Object.entries(agentMap)
    .filter(([, d]) => d.total >= 2)
    .sort(([, a], [, b]) => {
      const aScore = a.wins / a.total * 0.6 + (a.acs / a.total) / 300 * 0.4;
      const bScore = b.wins / b.total * 0.6 + (b.acs / b.total) / 300 * 0.4;
      return bScore - aScore;
    })[0];

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="w-0.5 h-4 rounded-full bg-cyan-400 shrink-0" />
        <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
          Insights
        </h2>
        <span className="text-[9px] text-zinc-700 font-mono">
          based on last {played} games
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {/* Perf trend ACS */}
        <InsightCard
          label="ACS Trend"
          value={`${recentACS}`}
          sub={
            prior.length
              ? `${acsD >= 0 ? "+" : ""}${acsD} vs prev 5 games`
              : "insufficient data"
          }
          color={
            acsTrend === "up"
              ? "#22c55e"
              : acsTrend === "down"
              ? "#ef4444"
              : "#a1a1aa"
          }
          trend={acsTrend}
          badge={acsTrend === "up" ? "Improving" : acsTrend === "down" ? "Declining" : "Stable"}
          badgeColor={acsTrend === "up" ? "#22c55e" : acsTrend === "down" ? "#ef4444" : "#71717a"}
        />

        {/* K/D trend */}
        <InsightCard
          label="K/D Trend"
          value={`${recentKD}`}
          sub={
            prior.length
              ? `${recentKD > priorKD ? "+" : ""}${(recentKD - priorKD).toFixed(2)} vs prev 5`
              : "insufficient data"
          }
          color={
            kdTrend === "up"
              ? "#22c55e"
              : kdTrend === "down"
              ? "#ef4444"
              : "#a1a1aa"
          }
          trend={kdTrend}
        />

        {/* Damage delta */}
        <InsightCard
          label="Damage Delta"
          value={`${avgDmgDelta >= 0 ? "+" : ""}${avgDmgDelta}`}
          sub="avg (dealt − received) per round"
          color={avgDmgDelta >= 30 ? "#22c55e" : avgDmgDelta >= 0 ? "#a1a1aa" : "#ef4444"}
          badge={avgDmgDelta >= 30 ? "Trade Winner" : avgDmgDelta >= 0 ? "Even" : "Trade Loser"}
          badgeColor={avgDmgDelta >= 30 ? "#22c55e" : avgDmgDelta >= 0 ? "#d97706" : "#ef4444"}
        />

        {/* Consistency */}
        <InsightCard
          label="Consistency"
          value={`±${stdDevACS}`}
          sub={`ACS std dev — ${consistencyLabel}`}
          color={consistencyColor}
          badge={consistencyLabel}
          badgeColor={consistencyColor}
        />

        {/* Carry rate */}
        <InsightCard
          label="Carry Rate"
          value={`${carryRate}%`}
          sub={`${carryGames}/${played} games with 250+ ACS`}
          color={carryRate >= 40 ? "#22c55e" : carryRate >= 20 ? "#d97706" : "#71717a"}
        />

        {/* Best agent */}
        {bestAgent && (
          <InsightCard
            label="Best Agent"
            value={bestAgent[0]}
            sub={`${Math.round((bestAgent[1].wins / bestAgent[1].total) * 100)}% WR · ${Math.round(bestAgent[1].acs / bestAgent[1].total)} ACS avg`}
            color="#22d3ee"
            badge={`${bestAgent[1].total}G`}
            badgeColor="#22d3ee"
          />
        )}

        {/* Best map */}
        {bestMap && (
          <InsightCard
            label="Best Map"
            value={bestMap[0]}
            sub={`${Math.round((bestMap[1].wins / bestMap[1].total) * 100)}% WR in ${bestMap[1].total} games`}
            color="#22c55e"
          />
        )}

        {/* Worst map */}
        {worstMap && worstMap[0] !== bestMap?.[0] && (
          <InsightCard
            label="Worst Map"
            value={worstMap[0]}
            sub={`${Math.round((worstMap[1].wins / worstMap[1].total) * 100)}% WR in ${worstMap[1].total} games`}
            color="#ef4444"
          />
        )}

        {/* Best hour */}
        {bestHour >= 0 && (
          <InsightCard
            label="Best Time"
            value={formatHour(bestHour)}
            sub={`${Math.round(bestHourWR * 100)}% WR at this hour`}
            color="#f59e0b"
            badge="🕐 Peak Hours"
            badgeColor="#f59e0b"
          />
        )}

        {/* Top teammate */}
        {topTeammate && (
          <InsightCard
            label="Best Duo"
            value={topTeammate[0].split("#")[0]}
            sub={`${Math.round((topTeammate[1].wins / topTeammate[1].total) * 100)}% WR together · ${topTeammate[1].total} games`}
            color="#a78bfa"
            badge={`#${topTeammate[0].split("#")[1]}`}
            badgeColor="#a78bfa"
          />
        )}
      </div>
    </div>
  );
}
