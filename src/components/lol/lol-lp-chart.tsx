"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import {
  getTierColor,
  getLpTotal,
  type LolMatch,
  type LeagueEntry,
} from "@/lib/api/lol";
import { format } from "date-fns";

interface Props {
  matches: LolMatch[];
  puuid: string;
  soloEntry: LeagueEntry | null;
}

interface ChartPoint {
  date: string;
  lp: number;
  win: boolean;
  champion: string;
  kda: string;
  tier: string;
}

// Each tier = 400 total LP (4 divs × 100)
// IRON=0, BRONZE=400, SILVER=800, GOLD=1200, PLATINUM=1600,
// EMERALD=2000, DIAMOND=2400, MASTER=2800, GRANDMASTER=3200, CHALLENGER=3600
const TIER_ORDER = [
  "IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM",
  "EMERALD", "DIAMOND", "MASTER", "GRANDMASTER", "CHALLENGER",
] as const;
type Tier = typeof TIER_ORDER[number];

const TIER_STARTS = TIER_ORDER.map((_, i) => i * 400);
const GROUP_BOUNDARIES = TIER_STARTS.slice(1); // 400, 800, ..., 3600

function lpToTier(totalLp: number): Tier {
  for (let i = TIER_STARTS.length - 1; i >= 0; i--) {
    if (totalLp >= TIER_STARTS[i]) return TIER_ORDER[i];
  }
  return "IRON";
}

function lpToLabel(totalLp: number): string {
  const tier = lpToTier(totalLp);
  const tierIdx = TIER_ORDER.indexOf(tier);
  const withinTier = totalLp - tierIdx * 400;
  const apex = ["MASTER", "GRANDMASTER", "CHALLENGER"];
  if (apex.includes(tier)) return `${tier} ${withinTier} LP`;
  const divs = ["IV", "III", "II", "I"];
  const div = divs[Math.min(Math.floor(withinTier / 100), 3)];
  const lp = withinTier % 100;
  return `${tier} ${div} — ${lp} LP`;
}

// SVG Y-axis tick — rank emblem icon
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RankTick(props: any) {
  const { x, y, payload } = props;
  if (!payload) return null;
  const tier = lpToTier(payload.value as number).toLowerCase();
  const size = 24;
  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore SVG image element
    <image
      href={`https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-emblem/emblem-${tier}.png`}
      x={x - size - 2}
      y={y - size / 2}
      width={size}
      height={size}
      opacity={0.9}
    />
  );
}

export function LolLpChart({ matches, puuid, soloEntry }: Props) {
  const data = useMemo<ChartPoint[]>(() => {
    const sorted = [...matches].sort(
      (a, b) => a.info.gameCreation - b.info.gameCreation
    );

    const currentLp = soloEntry
      ? getLpTotal(soloEntry.tier, soloEntry.rank, soloEntry.leaguePoints)
      : 800;

    // Walk backwards from current LP to estimate history
    let lp = currentLp;
    const reversed = [...sorted].reverse();
    const lpValues: number[] = [lp];
    for (let i = 0; i < reversed.length - 1; i++) {
      const me = reversed[i].info.participants.find((p) => p.puuid === puuid);
      if (!me) { lpValues.push(lp); continue; }
      lp += me.win ? -20 : 20;
      lpValues.push(Math.max(0, lp));
    }
    lpValues.reverse();

    return sorted.map((m, i) => {
      const me = m.info.participants.find((p) => p.puuid === puuid);
      const kda = me
        ? me.deaths === 0
          ? "Perfect"
          : `${((me.kills + me.assists) / me.deaths).toFixed(2)}`
        : "—";
      const totalLp = lpValues[i];
      return {
        date: format(new Date(m.info.gameCreation), "MMM d"),
        lp: totalLp,
        win: me?.win ?? false,
        champion: me?.championName ?? "",
        kda,
        tier: lpToTier(totalLp),
      };
    });
  }, [matches, puuid, soloEntry]);

  const currentTotalLp = soloEntry
    ? getLpTotal(soloEntry.tier, soloEntry.rank, soloEntry.leaguePoints)
    : (data[data.length - 1]?.lp ?? 800);

  const tierColor = soloEntry ? getTierColor(soloEntry.tier) : "#d97706";
  const tierIdx = TIER_ORDER.indexOf(lpToTier(currentTotalLp));

  // Y window: show current tier ± 1
  const yMin = Math.max(0, (tierIdx - 1) * 400);
  const yMax = (tierIdx + 2) * 400;
  const yTicks = TIER_STARTS.filter((b) => b >= yMin && b <= yMax);
  const visibleBoundaries = GROUP_BOUNDARIES.filter((b) => b > yMin && b < yMax);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
      className="rounded-xl border border-white/[0.07] bg-[#0d0e14] overflow-hidden"
    >
      <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-white/[0.05]">
        <span className="w-0.5 h-4 rounded-full bg-amber-400 shrink-0" />
        <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">
          LP History
        </h2>
        <span className="text-zinc-700 text-[10px] font-mono ml-auto">
          estimated · last {matches.length} games
        </span>
      </div>

      <div className="h-[240px] px-2 py-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 6 }}>
            <defs>
              <linearGradient id="lpGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={tierColor} stopOpacity={0.18} />
                <stop offset="95%" stopColor={tierColor} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: "#3f3f46", fontSize: 10, fontFamily: "var(--font-geist-mono)" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[yMin, yMax]}
              ticks={yTicks}
              tick={<RankTick />}
              tickLine={false}
              axisLine={false}
              width={34}
              interval={0}
              minTickGap={0}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as ChartPoint;
                return (
                  <div className="bg-[#0a0b10] border border-white/[0.1] rounded-lg px-3 py-2 text-xs shadow-xl">
                    <p className="text-zinc-400 font-mono mb-1">{d.date}</p>
                    <p className="font-black font-mono" style={{ color: getTierColor(d.tier) }}>
                      {lpToLabel(d.lp)}
                    </p>
                    <p className={`font-bold mt-0.5 ${d.win ? "text-green-400" : "text-red-400"}`}>
                      {d.win ? "▲ Win" : "▼ Loss"} · {d.champion}
                    </p>
                    <p className="text-zinc-500 mt-0.5">KDA {d.kda}</p>
                  </div>
                );
              }}
            />

            {/* Tier boundary lines */}
            {visibleBoundaries.map((b) => (
              <ReferenceLine
                key={b}
                y={b}
                stroke="rgba(255,255,255,0.09)"
                strokeDasharray="4 4"
                label={{
                  value: TIER_ORDER[b / 400],
                  position: "insideTopRight",
                  fontSize: 9,
                  fill: "rgba(255,255,255,0.2)",
                  fontFamily: "var(--font-geist-mono)",
                }}
              />
            ))}

            <Area
              type="monotone"
              dataKey="lp"
              stroke={tierColor}
              strokeWidth={2}
              fill="url(#lpGrad)"
              dot={(props) => {
                const { cx, cy, payload } = props as { cx: number; cy: number; payload: ChartPoint };
                return (
                  <circle
                    key={`dot-${cx}-${cy}`}
                    cx={cx}
                    cy={cy}
                    r={3.5}
                    fill={payload.win ? "#22c55e" : "#ef4444"}
                    stroke="#0d0e14"
                    strokeWidth={1.5}
                  />
                );
              }}
              activeDot={{ r: 5, fill: tierColor, stroke: "#0d0e14", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
