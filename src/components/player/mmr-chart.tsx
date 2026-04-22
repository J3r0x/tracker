"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { MMRHistoryEntry, PlayerMMR } from "@/lib/api/henrik";
import { getTierColor, getTierName } from "@/lib/utils/valorant";

// elo = (tier - 3) * 100 + rr
// Iron 1(3)=0, Bronze 1(6)=300, Silver 1(9)=600, Gold 1(12)=900
// Plat 1(15)=1200, Diamond 1(18)=1500, Asc 1(21)=1800, Imm 1(24)=2100, Rad(27)=2400
const RANK_ABBR: Record<number, string> = {
     0: "I1",  100: "I2",  200: "I3",
   300: "B1",  400: "B2",  500: "B3",
   600: "S1",  700: "S2",  800: "S3",
   900: "G1", 1000: "G2", 1100: "G3",
  1200: "P1", 1300: "P2", 1400: "P3",
  1500: "D1", 1600: "D2", 1700: "D3",
  1800: "A1", 1900: "A2", 2000: "A3",
  2100: "IM1", 2200: "IM2", 2300: "IM3",
  2400: "RAD",
};

// Fronteras entre grupos (inicio de Bronze, Silver, ...)
const RANK_BOUNDARIES = [300, 600, 900, 1200, 1500, 1800, 2100, 2400];

// Tier index para color: tier = elo/100 + 3, capped at 27
function eloToTierIndex(elo: number): number {
  return Math.min(Math.floor(elo / 100) + 3, 27);
}

function getRankIconUrl(tier: number): string {
  return `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${tier}/largeicon.png`;
}

function eloToAbbr(elo: number): string {
  const key = Math.floor(elo / 100) * 100;
  return RANK_ABBR[key] ?? "";
}

interface MMRChartProps {
  history: MMRHistoryEntry[];
  mmr?: PlayerMMR | null;
}

interface TooltipPayload {
  active?: boolean;
  payload?: Array<{ payload: MMRHistoryEntry }>;
}

function CustomTooltip({ active, payload }: TooltipPayload) {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload;
  const color = getTierColor(entry.currenttier);
  const change = entry.mmr_change_to_last_game;

  return (
    <div className="bg-[#0d0e12] border border-white/10 rounded px-3 py-2 text-xs shadow-2xl">
      <p className="font-bold font-mono" style={{ color }}>
        {getTierName(entry.currenttier)} · {entry.ranking_in_tier} RR
      </p>
      <p className={`font-mono mt-0.5 ${change >= 0 ? "text-green-400" : "text-red-400"}`}>
        {change >= 0 ? "+" : ""}{change} RR
      </p>
      <p className="text-zinc-600 mt-1">{entry.date.split(" ")[0]}</p>
    </div>
  );
}

// Tick personalizado con icono de rango
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RankTick(props: any) {
  const { x, y, payload } = props;
  if (!payload) return null;
  const tier = eloToTierIndex(payload.value);
  if (tier < 3) return null;
  const size = 22;
  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore – SVG <image> is valid here
    <image
      href={getRankIconUrl(tier)}
      x={x - size - 2}
      y={y - size / 2}
      width={size}
      height={size}
      opacity={0.85}
    />
  );
}

export function MMRChart({ history, mmr }: MMRChartProps) {
  // Invertir historial (API devuelve más reciente primero)
  // Filtrar entradas sin rango (unranked, tier=0) para que el gráfico
  // empiece desde la primera partida rankeda y el dominio no se expanda a 0.
  const reversed = [...history].reverse().filter((e) => e.currenttier > 0);

  // Añadir el estado actual como último punto para que la línea
  // siempre termine en el rango real del jugador hoy
  const data = (() => {
    if (!mmr) return reversed;
    const currentPoint: MMRHistoryEntry = {
      currenttier: mmr.currenttier,
      currenttierpatched: mmr.currenttierpatched,
      ranking_in_tier: mmr.ranking_in_tier,
      mmr_change_to_last_game: mmr.mmr_change_to_last_game,
      elo: mmr.elo,
      date: "Ahora",
      date_raw: Date.now(),
    };
    // Solo añadir si el ELO actual difiere del último entry
    const lastElo = reversed[reversed.length - 1]?.elo;
    return lastElo === mmr.elo ? reversed : [...reversed, currentPoint];
  })();

  const tierColor = getTierColor(mmr?.currenttier ?? history[0]?.currenttier ?? 0);

  // Anclar la ventana al ELO actual (no al histórico) para que el eje
  // siempre muestre el rango donde está el jugador HOY.
  // Mostramos 2 subdivisiones (200 elo) abajo y 1 arriba del tier actual.
  const anchorElo = mmr?.elo ?? data[data.length - 1]?.elo ?? 0;
  const anchorTick = Math.floor(anchorElo / 100) * 100;
  const yMin = Math.max(0, anchorTick - 200);
  const yMax = anchorTick + 200;
  const yTicks = Array.from(
    { length: (yMax - yMin) / 100 + 1 },
    (_, i) => yMin + i * 100
  );
  const visibleBoundaries = RANK_BOUNDARIES.filter((b) => b > yMin && b < yMax);

  return (
    <div className="h-full flex flex-col">
      {/* ── Line chart por rango ── */}
      {data.length > 0 && (
        <div className="bg-[#0d0e14] border border-white/[0.07] rounded-xl p-5 pb-3 flex-1">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-0.5 h-4 rounded-full bg-cyan-400 shrink-0" />
            <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
              Rank History
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="rankGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={tierColor} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={tierColor} stopOpacity={0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="date"
                tick={{ fill: "#3f3f46", fontSize: 10 }}
                tickFormatter={(v: string) => v.split(" ")[0]}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[yMin, yMax]}
                ticks={yTicks}
                tick={<RankTick />}
                tickLine={false}
                axisLine={false}
                width={32}
                interval={0}
                minTickGap={0}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: "rgba(255,255,255,0.05)", strokeWidth: 1 }}
              />

              {/* Fronteras de grupo (Iron→Bronze, Bronze→Silver…) */}
              {visibleBoundaries.map((b) => (
                <ReferenceLine
                  key={b}
                  y={b}
                  stroke="rgba(255,255,255,0.07)"
                  strokeDasharray="4 4"
                />
              ))}

              <Area
                type="linear"
                dataKey="elo"
                stroke={tierColor}
                strokeWidth={2}
                fill="url(#rankGrad)"
                dot={false}
                activeDot={{ r: 4, fill: tierColor, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}


