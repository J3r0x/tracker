import { getMatchResult, getPlayerFromMatch } from "@/lib/utils/valorant";
import type { HenrikMatch } from "@/lib/api/henrik";

interface MostPlayedWithProps {
  matches: HenrikMatch[];
  name: string;
  tag: string;
}

interface DuoStat {
  name: string;
  tag: string;
  games: number;
  wins: number;
}

export function MostPlayedWith({ matches, name, tag }: MostPlayedWithProps) {
  if (!matches.length) return null;

  const tmMap = new Map<string, DuoStat>();

  for (const match of matches) {
    const player = getPlayerFromMatch(match, name, tag);
    if (!player) continue;
    const result = getMatchResult(match, player);
    const myTeam = player.team.toLowerCase() as "red" | "blue";
    const teammates = (match.players[myTeam] ?? []).filter(
      (p) =>
        !(
          p.name.toLowerCase() === name.toLowerCase() &&
          p.tag.toLowerCase() === tag.toLowerCase()
        )
    );
    for (const tm of teammates) {
      const key = `${tm.name}#${tm.tag}`;
      const ex = tmMap.get(key);
      if (ex) {
        ex.games++;
        if (result === "win") ex.wins++;
      } else {
        tmMap.set(key, {
          name: tm.name,
          tag: tm.tag,
          games: 1,
          wins: result === "win" ? 1 : 0,
        });
      }
    }
  }

  const duos = [...tmMap.values()]
    .filter((d) => d.games >= 2)
    .sort((a, b) => b.games - a.games)
    .slice(0, 8);

  if (!duos.length) return null;

  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#0d0e14] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-white/[0.05]">
        <span className="w-0.5 h-4 rounded-full bg-cyan-400 shrink-0" />
        <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">
          Most Played With
        </h2>
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-white/[0.04]">
        <span className="flex-1 text-[10px] uppercase tracking-[0.15em] text-zinc-700 font-bold">
          Player
        </span>
        <span className="w-20 text-center text-[10px] uppercase tracking-[0.15em] text-zinc-700 font-bold">
          Games
        </span>
        <span className="w-2 shrink-0" />
        <span className="w-16 text-right text-[10px] uppercase tracking-[0.15em] text-zinc-700 font-bold">
          Win Rate
        </span>
      </div>

      {/* Rows */}
      {duos.map((d) => {
        const wr = Math.round((d.wins / d.games) * 100);
        const wrColor =
          wr >= 55 ? "#22c55e" : wr >= 50 ? "#86efac" : wr >= 40 ? "#f59e0b" : "#ef4444";
        const losses = d.games - d.wins;

        return (
          <div
            key={`${d.name}#${d.tag}`}
            className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{d.name}</p>
              <p className="text-[10px] text-zinc-600 font-mono">#{d.tag}</p>
            </div>
            <div className="w-20 text-center">
              <span className="text-xs font-mono">
                {d.wins > 0 && <span className="text-green-400">{d.wins}W</span>}
                {d.wins > 0 && losses > 0 && <span className="text-zinc-700"> </span>}
                {losses > 0 && <span className="text-red-400">{losses}L</span>}
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
        );
      })}
    </div>
  );
}
