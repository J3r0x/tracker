"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  getChampionSquare,
  getItemIconUrl,
  getSummonerSpellIcon,
  getQueueLabel,
  type LolMatch,
  type MatchParticipant,
} from "@/lib/api/lol";
import { cn } from "@/lib/utils";

interface Props {
  matches: LolMatch[];
  puuid: string;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const QUEUE_CLASS: Record<number, string> = {
  420: "Ranked Solo",
  440: "Ranked Flex",
  450: "ARAM",
  400: "Normal Draft",
  430: "Normal Blind",
  490: "Quickplay",
};

const POSITION_LABEL: Record<string, string> = {
  TOP: "TOP",
  JUNGLE: "JGL",
  MIDDLE: "MID",
  BOTTOM: "ADC",
  UTILITY: "SUP",
};

const POSITION_ICON_SLUG: Record<string, string> = {
  TOP: "top",
  JUNGLE: "jungle",
  MIDDLE: "middle",
  BOTTOM: "bottom",
  UTILITY: "utility",
};

const CDN_CLASH = "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions";
const CDN_MH = "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-match-history/global/default";

function getPositionIconUrl(pos: string): string {
  const slug = POSITION_ICON_SLUG[pos];
  return slug ? `${CDN_CLASH}/icon-position-${slug}.png` : "";
}

function formatK(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

// ── Slots ─────────────────────────────────────────────────────

function ItemSlot({ id, size = 28 }: { id: number; size?: number }) {
  return (
    <div
      className="rounded bg-[#0a0b10] border border-white/[0.07] overflow-hidden shrink-0"
      style={{ width: size, height: size }}
    >
      {id > 0 && (
        <Image src={getItemIconUrl(id)} alt="" width={size} height={size} className="object-cover" unoptimized />
      )}
    </div>
  );
}

function SpellSlot({ spellId, size = 22 }: { spellId: number; size?: number }) {
  return (
    <div className="rounded overflow-hidden border border-white/[0.07] shrink-0" style={{ width: size, height: size }}>
      <Image src={getSummonerSpellIcon(spellId)} alt="" width={size} height={size} className="object-cover" unoptimized />
    </div>
  );
}

function RuneSlot({ perkId, size = 22 }: { perkId: number; size?: number }) {
  return (
    <div
      className="rounded-full overflow-hidden bg-[#0a0b10] border border-white/[0.07] shrink-0 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Image
        src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/styles/${perkId}.png`}
        alt="" width={size - 2} height={size - 2} className="object-cover" unoptimized
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    </div>
  );
}

function MultiKillBadge({ p }: { p: MatchParticipant }) {
  if (p.pentaKills > 0)  return <span className="text-[9px] font-black px-2 py-0.5 rounded border border-amber-400/40 text-amber-300 bg-amber-400/10 tracking-wide">PENTA</span>;
  if (p.quadraKills > 0) return <span className="text-[9px] font-black px-2 py-0.5 rounded border border-white/20 text-zinc-300 bg-white/[0.06] tracking-wide">QUADRA</span>;
  if (p.tripleKills > 0) return <span className="text-[9px] font-black px-2 py-0.5 rounded border border-white/20 text-zinc-300 bg-white/[0.06] tracking-wide">TRIPLE</span>;
  if (p.doubleKills > 0) return <span className="text-[9px] font-black px-2 py-0.5 rounded border border-white/10 text-zinc-500 bg-white/[0.03] tracking-wide">DOUBLE</span>;
  return null;
}

function PositionBadge({ pos }: { pos: string }) {
  const iconUrl = getPositionIconUrl(pos);
  const label = POSITION_LABEL[pos] ?? pos.slice(0, 3);
  if (!iconUrl) return null;
  return (
    <div className="shrink-0 opacity-60" title={label} style={{ width: 14, height: 14 }}>
      <Image src={iconUrl} alt={label} width={14} height={14} unoptimized
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    </div>
  );
}

function DamageBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
      <div className="h-full rounded-full bg-zinc-400" style={{ width: `${pct}%` }} />
    </div>
  );
}

// ── Stat pill used in expanded "Your performance" ─────────────

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-lg bg-[#0a0b10] border border-white/[0.06] min-w-[60px]">
      <span className="text-base font-black font-mono text-white leading-none">{value}</span>
      <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-600 leading-none whitespace-nowrap">{label}</span>
    </div>
  );
}

// ── Main card ──────────────────────────────────────────────────

function MatchCard({ match, puuid }: { match: LolMatch; puuid: string }) {
  const [expanded, setExpanded] = useState(false);
  const me = match.info.participants.find((p) => p.puuid === puuid);
  if (!me) return null;

  const kdaNum = me.deaths === 0 ? 99 : (me.kills + me.assists) / me.deaths;
  const kdaStr = me.deaths === 0 ? "Perfect" : kdaNum.toFixed(2);
  const kdaColor = kdaNum >= 5 ? "#22c55e" : kdaNum >= 3 ? "#d97706" : "#71717a";

  const cs = me.totalMinionsKilled + me.neutralMinionsKilled;
  const csMin = (cs / (match.info.gameDuration / 60)).toFixed(1);

  const queueLabel = QUEUE_CLASS[match.info.queueId] ?? getQueueLabel(match.info.queueId);
  const position = me.individualPosition || me.teamPosition || "";

  const myTeamParticipants = match.info.participants.filter((p) => p.teamId === me.teamId);
  const teamKills = myTeamParticipants.reduce((s, p) => s + p.kills, 0);
  const kp = teamKills > 0 ? Math.round(((me.kills + me.assists) / teamKills) * 100) : 0;

  const maxDmg = Math.max(...match.info.participants.map((p) => p.totalDamageDealtToChampions));
  const maxDmgTaken = Math.max(...match.info.participants.map((p) => p.totalDamageTaken));

  const blue = match.info.participants.filter((p) => p.teamId === 100);
  const red = match.info.participants.filter((p) => p.teamId === 200);
  const blueTeam = match.info.teams.find((t) => t.teamId === 100);
  const redTeam = match.info.teams.find((t) => t.teamId === 200);
  const blueWon = blueTeam?.win ?? false;

  const items = [me.item0, me.item1, me.item2, me.item3, me.item4, me.item5];
  const trinket = me.item6;
  const keystoneId = me.perks?.styles?.[0]?.selections?.[0]?.perk;

  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#111318] overflow-hidden flex">
      {/* Win/loss stripe — only color, no text */}
      <div className={cn("w-1 shrink-0", me.win ? "bg-green-500" : "bg-red-500")} />

      <div className="flex-1 min-w-0">
        {/* ── Summary row ── */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full text-left cursor-pointer hover:bg-white/[0.02] transition-colors duration-100"
        >
          <div className="flex items-center gap-4 px-4 py-4">
            {/* Champion + spells + rune */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/[0.1]">
                  <Image src={getChampionSquare(me.championName)} alt={me.championName} width={56} height={56} className="object-cover" unoptimized />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-[#111318] border border-white/[0.1] rounded text-[9px] font-black font-mono text-zinc-400 px-1 py-0.5 leading-none">
                  {me.champLevel}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <SpellSlot spellId={me.summoner1Id} size={20} />
                <SpellSlot spellId={me.summoner2Id} size={20} />
              </div>
              {keystoneId && <RuneSlot perkId={keystoneId} size={20} />}
            </div>

            {/* Champion name + meta */}
            <div className="hidden sm:flex flex-col gap-0.5 shrink-0 w-32">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-black text-white leading-none">{me.championName}</span>
                {position && <PositionBadge pos={position} />}
              </div>
              <span className="text-xs text-zinc-500">{queueLabel}</span>
              <span className="text-xs text-zinc-600">{format(new Date(match.info.gameCreation), "MMM d")} · {formatDuration(match.info.gameDuration)}</span>
            </div>

            {/* KDA — big */}
            <div className="flex flex-col items-center shrink-0 min-w-[100px]">
              <p className="text-xl font-black font-mono text-white leading-none tracking-tight">
                {me.kills}
                <span className="text-zinc-700 mx-0.5">/</span>
                <span className="text-red-400">{me.deaths}</span>
                <span className="text-zinc-700 mx-0.5">/</span>
                {me.assists}
              </p>
              <p className="text-xs font-bold mt-1 tracking-widest uppercase" style={{ color: kdaColor }}>
                {kdaStr} KDA
              </p>
              <div className="mt-1"><MultiKillBadge p={me} /></div>
            </div>

            {/* Secondary stats — all white */}
            <div className="hidden md:flex items-center divide-x divide-white/[0.07]">
              {[
                { v: `${kp}%`, l: "KP" },
                { v: String(cs), l: `${csMin}/m` },
                { v: formatK(me.totalDamageDealtToChampions), l: "DMG" },
                { v: String(me.visionScore), l: "Vision" },
              ].map(({ v, l }) => (
                <div key={l} className="flex flex-col items-center px-4">
                  <span className="text-base font-bold font-mono text-white leading-none">{v}</span>
                  <span className="text-[10px] text-zinc-600 uppercase tracking-widest mt-0.5">{l}</span>
                </div>
              ))}
            </div>

            {/* Items */}
            <div className="hidden xl:flex items-center gap-0.5 ml-auto shrink-0">
              {items.map((id, i) => <ItemSlot key={i} id={id} size={28} />)}
              <div className="w-px h-5 bg-white/[0.07] mx-1" />
              <ItemSlot id={trinket} size={28} />
            </div>

            {/* Result + chevron */}
            <div className="ml-auto xl:ml-4 flex items-center gap-3 shrink-0">
              <span className={cn("text-xs font-black hidden sm:block", me.win ? "text-green-400" : "text-red-400")}>
                {me.win ? "Victory" : "Defeat"}
              </span>
              <svg
                className={cn("w-4 h-4 text-zinc-600 transition-transform duration-200", expanded && "rotate-180")}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        </button>

        {/* ── Expanded ── */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="exp"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              {/* Your performance */}
              <div className="border-t border-white/[0.06] px-5 py-4 bg-[#0d0e14]">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-3">Your Performance</p>
                <div className="flex flex-wrap gap-2">
                  <StatPill label="KP" value={`${kp}%`} />
                  <StatPill label="Gold" value={formatK(me.goldEarned)} />
                  <StatPill label="DMG Dealt" value={formatK(me.totalDamageDealtToChampions)} />
                  <StatPill label="DMG Taken" value={formatK(me.totalDamageTaken)} />
                  <StatPill label="CS" value={String(cs)} />
                  <StatPill label="CS/min" value={csMin} />
                  <StatPill label="Vision" value={String(me.visionScore)} />
                  <StatPill label="Wards" value={String(me.wardsPlaced)} />
                  <StatPill label="Control" value={String(me.controlWardsPlaced)} />
                  <StatPill label="Time Dead" value={formatDuration(me.totalTimeSpentDead ?? 0)} />
                  {me.totalHeal > 500 && <StatPill label="Healing" value={formatK(me.totalHeal)} />}
                  {me.largestKillingSpree > 1 && <StatPill label="Spree" value={String(me.largestKillingSpree)} />}
                  {me.objectivesStolen > 0 && <StatPill label="Stolen" value={String(me.objectivesStolen)} />}
                  {me.firstBloodKill && <StatPill label="First Blood" value="Yes" />}
                </div>
              </div>

              {/* Team objectives */}
              <div className="border-t border-white/[0.06] px-5 py-3 bg-[#0d0e14]">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-2">Objectives</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { data: blueTeam, won: blueWon, label: "Blue" },
                    { data: redTeam, won: !blueWon, label: "Red" },
                  ].map(({ data, won, label }) => (
                    <div key={label} className="border border-white/[0.07] rounded-lg px-4 py-2.5 bg-[#111318]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-black text-white">{label}</span>
                        <span className={cn("text-[10px] font-bold", won ? "text-green-400" : "text-red-400")}>
                          {won ? "Victory" : "Defeat"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs font-mono">
                        {[
                          ["Kills", data?.objectives.champion.kills ?? 0],
                          ["Towers", data?.objectives.tower.kills ?? 0],
                          ["Dragons", data?.objectives.dragon.kills ?? 0],
                          ["Barons", data?.objectives.baron.kills ?? 0],
                          ["Inhibitors", data?.objectives.inhibitor?.kills ?? 0],
                        ].map(([k, v]) => (
                          <span key={k} className="flex gap-1">
                            <span className="text-zinc-600">{k}</span>
                            <span className="text-white font-bold">{v}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scoreboard */}
              <div className="border-t border-white/[0.06] px-5 py-4 bg-[#0d0e14] flex flex-col xl:flex-row gap-5">
                {[
                  { team: blue, won: blueWon, label: "Blue Team" },
                  { team: red, won: !blueWon, label: "Red Team" },
                ].map(({ team, won, label }) => (
                  <div key={label} className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-black text-white">{label}</span>
                      <span className={cn("text-[10px] font-bold", won ? "text-green-400" : "text-red-400")}>
                        {won ? "Victory" : "Defeat"}
                      </span>
                    </div>

                    {/* Column labels */}
                    <div className="grid grid-cols-[28px_1fr_80px_44px_90px_90px_44px] items-center gap-1 px-2 mb-1">
                      <div />
                      <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-600">Player</span>
                      <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-600 text-center">KDA</span>
                      <div className="flex items-center justify-center gap-0.5">
                        <Image src={`${CDN_MH}/icon_minions.png`} alt="" width={12} height={12} unoptimized className="opacity-60" />
                        <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-600">CS</span>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-600 text-center">DMG Dealt</span>
                      <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-600 text-center">DMG Taken</span>
                      <div className="flex items-center justify-end gap-0.5">
                        <Image src={`${CDN_MH}/icon_gold.png`} alt="" width={12} height={12} unoptimized className="opacity-60" />
                        <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-600">Gold</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      {team.map((p, idx) => {
                        const isMe = p.puuid === puuid;
                        const pKdaNum = p.deaths === 0 ? 99 : (p.kills + p.assists) / p.deaths;
                        const pKdaStr = p.deaths === 0 ? "Perf" : pKdaNum.toFixed(1);
                        const pCs = p.totalMinionsKilled + p.neutralMinionsKilled;
                        const pItems = [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6];
                        const pPos = p.individualPosition || p.teamPosition || "";
                        return (
                          <div
                            key={p.puuid + idx}
                            className={cn(
                              "rounded-lg px-2 py-2",
                              isMe
                                ? "bg-[#1a1608] border border-[#C8AA6E]/20"
                                : "bg-[#111318] border border-transparent"
                            )}
                          >
                            <div className="grid grid-cols-[28px_1fr_80px_44px_90px_90px_44px] items-center gap-1">
                              {/* Icon */}
                              <div className="w-7 h-7 rounded overflow-hidden border border-white/[0.08] shrink-0">
                                <Image src={getChampionSquare(p.championName)} alt={p.championName} width={28} height={28} unoptimized />
                              </div>

                              {/* Name */}
                              <div className="min-w-0 flex flex-col gap-0.5">
                                <div className="flex items-center gap-1 min-w-0">
                                  <span className={cn("truncate text-xs font-semibold", isMe ? "text-[#C8AA6E]" : "text-zinc-300")}>
                                    {p.riotIdGameName || p.championName}
                                  </span>
                                  {pPos && <PositionBadge pos={pPos} />}
                                </div>
                                <span className="text-[10px] text-zinc-600 truncate">{p.championName}</span>
                              </div>

                              {/* KDA */}
                              <div className="flex flex-col items-center">
                                <span className="text-xs font-bold font-mono text-white">
                                  {p.kills}/<span className="text-red-400">{p.deaths}</span>/{p.assists}
                                </span>
                                <span className="text-[10px] text-zinc-600 font-mono">{pKdaStr}</span>
                              </div>

                              {/* CS */}
                              <div className="text-center">
                                <span className="text-xs font-mono text-zinc-300">{pCs}</span>
                              </div>

                              {/* DMG dealt */}
                              <div className="flex flex-col gap-0.5 px-1">
                                <span className="text-[11px] font-mono text-white text-right">
                                  {formatK(p.totalDamageDealtToChampions)}
                                </span>
                                <DamageBar value={p.totalDamageDealtToChampions} max={maxDmg} />
                              </div>

                              {/* DMG taken */}
                              <div className="flex flex-col gap-0.5 px-1">
                                <span className="text-[11px] font-mono text-white text-right">
                                  {formatK(p.totalDamageTaken)}
                                </span>
                                <DamageBar value={p.totalDamageTaken} max={maxDmgTaken} />
                              </div>

                              {/* Gold */}
                              <div className="text-right">
                                <span className="text-[11px] font-mono text-zinc-300">{formatK(p.goldEarned)}</span>
                              </div>
                            </div>

                            {/* Items */}
                            <div className="flex items-center gap-0.5 mt-1.5 ml-8">
                              {pItems.map((id, i) => <ItemSlot key={i} id={id} size={20} />)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function LolMatchHistory({ matches, puuid }: Props) {
  if (!matches.length) {
    return (
      <div className="rounded-xl border border-white/[0.07] bg-[#111318] px-6 py-10 text-center">
        <p className="text-zinc-500 text-sm">No matches found in the last 20 games.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-0.5 h-3.5 rounded-full bg-[#C8AA6E] shrink-0" />
        <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.25em]">Match History</h2>
      </div>
      {matches.map((m) => (
        <MatchCard key={m.metadata.matchId} match={m} puuid={puuid} />
      ))}
    </div>
  );
}
