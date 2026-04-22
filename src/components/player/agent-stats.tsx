import Image from "next/image";
import {
  calcACS,
  calcHSPercent,
  calcKD,
  getMatchResult,
  getPlayerFromMatch,
  getRoundsPlayed,
} from "@/lib/utils/valorant";
import type { HenrikMatch } from "@/lib/api/henrik";

interface AgentStatsProps {
  matches: HenrikMatch[];
  name: string;
  tag: string;
}

interface AgentStat {
  character: string;
  portrait: string;
  bust: string;
  games: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
  score: number;
  rounds: number;
  headshots: number;
  bodyshots: number;
  legshots: number;
}

export function AgentStats({ matches, name, tag }: AgentStatsProps) {
  if (!matches.length) return null;

  const agentMap = new Map<string, AgentStat>();

  for (const match of matches) {
    const player = getPlayerFromMatch(match, name, tag);
    if (!player) continue;

    const result = getMatchResult(match, player);
    const rounds = getRoundsPlayed(match);
    const key = player.character;

    const existing = agentMap.get(key);
    if (existing) {
      existing.games++;
      if (result === "win") existing.wins++;
      existing.kills += player.stats.kills;
      existing.deaths += player.stats.deaths;
      existing.assists += player.stats.assists;
      existing.score += player.stats.score;
      existing.rounds += rounds;
      existing.headshots += player.stats.headshots;
      existing.bodyshots += player.stats.bodyshots;
      existing.legshots += player.stats.legshots;
    } else {
      agentMap.set(key, {
        character: player.character,
        portrait: player.assets?.agent?.small ?? "",
        bust: player.assets?.agent?.bust ?? player.assets?.agent?.full ?? "",
        games: 1,
        wins: result === "win" ? 1 : 0,
        kills: player.stats.kills,
        deaths: player.stats.deaths,
        assists: player.stats.assists,
        score: player.stats.score,
        rounds,
        headshots: player.stats.headshots,
        bodyshots: player.stats.bodyshots,
        legshots: player.stats.legshots,
      });
    }
  }

  const agents = [...agentMap.values()].sort((a, b) => b.games - a.games);

  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#0d0e14] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-white/[0.05]">
        <span className="w-0.5 h-4 rounded-full bg-cyan-400 shrink-0" />
        <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">Agent Performance</h2>
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-white/[0.04]">
        <span className="flex-1 text-[10px] uppercase tracking-[0.15em] text-zinc-700 font-bold">Agent</span>
        <span className="w-20 text-center text-[10px] uppercase tracking-[0.15em] text-zinc-700 font-bold">Games</span>
        <span className="w-2 shrink-0" />
        <span className="w-16 text-right text-[10px] uppercase tracking-[0.15em] text-zinc-700 font-bold">Win Rate</span>
      </div>

      {/* Rows */}
      {agents.map((agent) => {
        const wr = Math.round((agent.wins / agent.games) * 100);
        const kd = calcKD(agent.kills, agent.deaths);
        const kdNum = parseFloat(kd);
        const acs = calcACS(agent.score, agent.rounds);
        const hs = calcHSPercent(agent.headshots, agent.bodyshots, agent.legshots);
        const wrColor = wr >= 55 ? "#22c55e" : wr >= 50 ? "#86efac" : wr >= 40 ? "#f59e0b" : "#ef4444";
        const kdColor = kdNum >= 1.5 ? "#22c55e" : kdNum >= 1 ? "#a1a1aa" : "#ef4444";
        const losses = agent.games - agent.wins;

        return (
          <div
            key={agent.character}
            className="relative flex flex-col px-4 py-3 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors overflow-hidden"
          >
            {/* Agent bust bg */}
            {agent.bust && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={agent.bust}
                alt=""
                className="absolute right-0 top-0 h-full w-auto object-contain object-right pointer-events-none select-none"
                style={{ opacity: 0.07, filter: "saturate(0.4)" }}
              />
            )}

            {/* Main row */}
            <div className="relative flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {agent.portrait && (
                  <div className="relative w-7 h-7 rounded-md overflow-hidden bg-zinc-800 shrink-0">
                    <Image src={agent.portrait} alt={agent.character} fill sizes="28px" className="object-cover" />
                  </div>
                )}
                <span className="text-sm font-black text-zinc-100 truncate">{agent.character}</span>
              </div>
              <div className="w-20 text-center">
                <span className="text-xs font-mono">
                  {agent.wins > 0 && <span className="text-green-400">{agent.wins}W</span>}
                  {agent.wins > 0 && losses > 0 && <span className="text-zinc-700"> </span>}
                  {losses > 0 && <span className="text-red-400">{losses}L</span>}
                </span>
              </div>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: wrColor }} />
              <span className="w-16 text-right text-base font-black font-mono" style={{ color: wrColor }}>
                {wr}%
              </span>
            </div>

            {/* Sub-stats */}
            <div className="relative flex gap-4 mt-1.5">
              <span className="text-[10px] font-mono font-bold" style={{ color: kdColor }}>K/D {kd}</span>
              <span className="text-zinc-500 text-[10px] font-mono">ACS {acs}</span>
              <span className="text-zinc-500 text-[10px] font-mono">HS {hs}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
