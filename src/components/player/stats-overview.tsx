import {
  calcACS,
  calcHSPercent,
  calcKD,
  getMatchResult,
  getPlayerFromMatch,
  getRoundsPlayed,
} from "@/lib/utils/valorant";
import type { HenrikMatch } from "@/lib/api/henrik";

interface StatsOverviewProps {
  matches: HenrikMatch[];
  name: string;
  tag: string;
}

interface BigStatProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

function BigStat({ label, value, sub, color }: BigStatProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-zinc-600 text-[8px] uppercase tracking-[0.2em] font-semibold">{label}</p>
      <p className="text-2xl font-black font-mono leading-none" style={color ? { color } : undefined}>{value}</p>
      {sub && <p className="text-zinc-600 text-[10px] font-mono">{sub}</p>}
    </div>
  );
}

export function StatsOverview({ matches, name, tag }: StatsOverviewProps) {
  if (matches.length === 0) return null;

  let wins = 0, losses = 0;
  let totalKills = 0, totalDeaths = 0, totalAssists = 0;
  let totalScore = 0, totalRounds = 0;
  let totalHS = 0, totalBS = 0, totalLS = 0;

  let streak = 0;
  let streakIsWin = false;
  let streakLocked = false;

  let r5wins = 0, r5kills = 0, r5deaths = 0, r5score = 0, r5rounds = 0, r5played = 0;
  let r5hs = 0, r5bs = 0, r5ls = 0;

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
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

    if (!streakLocked && result !== "draw") {
      if (streak === 0) { streak = 1; streakIsWin = result === "win"; }
      else if ((result === "win") === streakIsWin) streak++;
      else streakLocked = true;
    }

    if (i < 5) {
      r5played++;
      if (result === "win") r5wins++;
      r5kills += player.stats.kills;
      r5deaths += player.stats.deaths;
      r5score += player.stats.score;
      r5rounds += rounds;
      r5hs += player.stats.headshots;
      r5bs += player.stats.bodyshots;
      r5ls += player.stats.legshots;
    }
  }

  const played = wins + losses;
  const winrate = played > 0 ? Math.round((wins / played) * 100) : 0;
  const kd = calcKD(totalKills, totalDeaths);
  const kdNum = parseFloat(kd);
  const acs = calcACS(totalScore, totalRounds);
  const hs = calcHSPercent(totalHS, totalBS, totalLS);
  const avgKills = played > 0 ? (totalKills / played).toFixed(1) : "0";
  const wrColor = winrate >= 55 ? "#22c55e" : winrate >= 50 ? "#86efac" : "#ef4444";
  const kdColor = kdNum >= 1.5 ? "#22c55e" : kdNum >= 1 ? "#a1a1aa" : "#ef4444";
  const streakLabel = streak > 1 ? `${streak}${streakIsWin ? "W" : "L"} streak` : null;

  const r5wr = r5played > 0 ? Math.round((r5wins / r5played) * 100) : 0;
  const r5kd = calcKD(r5kills, r5deaths);
  const r5acs = calcACS(r5score, r5rounds);
  const r5hsPct = calcHSPercent(r5hs, r5bs, r5ls);

  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#0d0e14] p-5 h-full">
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="w-0.5 h-4 rounded-full bg-cyan-400 shrink-0" />
          <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
            Last {matches.length} games
          </h2>
        </div>
        {streakLabel && (
          <span
            className={`text-[10px] font-bold font-mono px-2.5 py-1 rounded-full ${
              streakIsWin
                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}
          >
            {streakLabel}
          </span>
        )}
      </div>

      {/* Main stats: WR left + 2x2 grid right */}
      <div className="flex gap-0 divide-x divide-white/[0.05]">
        {/* WR */}
        <div className="pr-5 flex flex-col gap-1 min-w-[110px]">
          <p className="text-zinc-600 text-[8px] uppercase tracking-[0.2em] font-semibold">Win Rate</p>
          <p className="text-4xl font-black font-mono leading-none" style={{ color: wrColor }}>
            {winrate}%
          </p>
          <p className="text-zinc-600 text-[10px] font-mono mt-0.5">{wins}W — {losses}L</p>
          <div className="mt-auto pt-2 w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${winrate}%`, backgroundColor: wrColor }} />
          </div>
        </div>

        {/* 2x2 stats grid */}
        <div className="pl-5 grid grid-cols-2 gap-x-5 gap-y-4 flex-1">
          <BigStat label="K/D" value={kd} sub={`${avgKills} kills/g`} color={kdColor} />
          <BigStat label="ACS" value={acs} sub="combat score" />
          <BigStat label="HS%" value={`${hs}%`} sub="headshots" />
          <BigStat label="KDA" value={(totalKills / Math.max(played, 1)).toFixed(1)} sub={`${totalAssists} assists`} />
        </div>
      </div>

      {/* Last 5 vs avg comparison */}
      {r5played >= 3 && (
        <div className="mt-5 pt-4 border-t border-white/[0.05] flex flex-wrap items-center gap-x-8 gap-y-2">
          <p className="text-[8px] font-bold text-zinc-700 uppercase tracking-[0.2em]">Last 5</p>
          {(
            [
              ["K/D", r5kd, kd],
              ["ACS", String(r5acs), String(acs)],
              ["HS%", `${r5hsPct}%`, `${hs}%`],
              ["WR", `${r5wr}%`, `${winrate}%`],
            ] as [string, string, string][]
          ).map(([label, recent, avg]) => {
            const up = parseFloat(recent) > parseFloat(avg);
            const down = parseFloat(recent) < parseFloat(avg);
            return (
              <div key={label} className="flex items-baseline gap-1.5">
                <span className="text-zinc-700 text-[9px] uppercase tracking-widest font-medium w-7">{label}</span>
                <span className={`font-mono font-bold text-sm ${up ? "text-green-400" : down ? "text-red-400" : "text-zinc-300"}`}>
                  {recent}
                </span>
                <span className="text-zinc-700 text-[9px] font-mono">vs {avg}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
