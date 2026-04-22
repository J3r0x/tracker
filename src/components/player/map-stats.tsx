import {
  calcACS,
  calcHSPercent,
  calcKD,
  getMatchResult,
  getMapSplashUrl,
  getPlayerFromMatch,
  getRoundsPlayed,
} from "@/lib/utils/valorant";
import type { HenrikMatch } from "@/lib/api/henrik";

interface MapStatsProps {
  matches: HenrikMatch[];
  name: string;
  tag: string;
}

interface MapStat {
  map: string;
  games: number;
  wins: number;
  kills: number;
  deaths: number;
  score: number;
  rounds: number;
  headshots: number;
  bodyshots: number;
  legshots: number;
}

export function MapStats({ matches, name, tag }: MapStatsProps) {
  if (!matches.length) return null;

  const mapData = new Map<string, MapStat>();

  for (const match of matches) {
    const player = getPlayerFromMatch(match, name, tag);
    if (!player) continue;

    const mapName = match.metadata?.map ?? "Unknown";
    const result = getMatchResult(match, player);
    const rounds = getRoundsPlayed(match);

    const existing = mapData.get(mapName);
    if (existing) {
      existing.games++;
      if (result === "win") existing.wins++;
      existing.kills += player.stats.kills;
      existing.deaths += player.stats.deaths;
      existing.score += player.stats.score;
      existing.rounds += rounds;
      existing.headshots += player.stats.headshots;
      existing.bodyshots += player.stats.bodyshots;
      existing.legshots += player.stats.legshots;
    } else {
      mapData.set(mapName, {
        map: mapName,
        games: 1,
        wins: result === "win" ? 1 : 0,
        kills: player.stats.kills,
        deaths: player.stats.deaths,
        score: player.stats.score,
        rounds,
        headshots: player.stats.headshots,
        bodyshots: player.stats.bodyshots,
        legshots: player.stats.legshots,
      });
    }
  }

  const maps = [...mapData.values()].sort((a, b) => b.games - a.games);

  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#0d0e14] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-white/[0.05]">
        <span className="w-0.5 h-4 rounded-full bg-cyan-400 shrink-0" />
        <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">Map Performance</h2>
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-white/[0.04]">
        <span className="flex-1 text-[10px] uppercase tracking-[0.15em] text-zinc-700 font-bold">Map</span>
        <span className="w-20 text-center text-[10px] uppercase tracking-[0.15em] text-zinc-700 font-bold">Games</span>
        <span className="w-2 shrink-0" />
        <span className="w-16 text-right text-[10px] uppercase tracking-[0.15em] text-zinc-700 font-bold">Win Rate</span>
      </div>

      {/* Rows */}
      {maps.map((m) => {
        const wr = Math.round((m.wins / m.games) * 100);
        const wrColor =
          wr >= 55 ? "#22c55e" : wr >= 50 ? "#86efac" : wr >= 40 ? "#f59e0b" : "#ef4444";
        const losses = m.games - m.wins;
        const splash = getMapSplashUrl(m.map);
        const acs = calcACS(m.score, m.rounds);
        const kd = calcKD(m.kills, m.deaths);
        const hs = calcHSPercent(m.headshots, m.bodyshots, m.legshots);

        return (
          <div
            key={m.map}
            className="group relative flex flex-col px-4 py-3 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors overflow-hidden"
          >
            {/* Map splash bg */}
            {splash && (
              <div
                className="absolute inset-0 bg-cover bg-center pointer-events-none"
                style={{ backgroundImage: `url(${splash})`, opacity: 0.06 }}
              />
            )}

            {/* Main row */}
            <div className="relative flex items-center gap-3">
              <span className="flex-1 text-sm font-bold text-white truncate">{m.map}</span>
              <div className="w-20 text-center">
                <span className="text-xs font-mono">
                  {m.wins > 0 && <span className="text-green-400">{m.wins}W</span>}
                  {m.wins > 0 && losses > 0 && <span className="text-zinc-700"> </span>}
                  {losses > 0 && <span className="text-red-400">{losses}L</span>}
                  {m.games - m.wins - losses === 0 && m.wins === 0 && losses === 0 && (
                    <span className="text-zinc-600">{m.games}G</span>
                  )}
                </span>
              </div>
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: wrColor }}
              />
              <span
                className="w-16 text-right text-sm font-black font-mono"
                style={{ color: wrColor }}
              >
                {wr}%
              </span>
            </div>

            {/* Sub-stats */}
            <div className="relative flex gap-4 mt-1.5">
              <span className="text-zinc-600 text-[10px] font-mono">ACS {acs}</span>
              <span className="text-zinc-600 text-[10px] font-mono">K/D {kd}</span>
              <span className="text-zinc-600 text-[10px] font-mono">HS {hs}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
