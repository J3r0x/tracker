import Image from "next/image";
import { calcKD, getTierColor, getTierName, getMatchResult, getPlayerFromMatch } from "@/lib/utils/valorant";
import type { HenrikMatch, PlayerMMR } from "@/lib/api/henrik";
import type { RiotAccount } from "@/lib/api/riot";
import { FavoriteButton } from "@/components/player/favorite-button";

interface PlayerHeaderProps {
  account: RiotAccount;
  mmr: PlayerMMR | null;
  playerCard?: string;
  region: string;
  accountLevel?: number;
  matches?: HenrikMatch[];
  playerName?: string;
  playerTag?: string;
}

function RecentFormDots({ matches, name, tag }: { matches: HenrikMatch[]; name: string; tag: string }) {
  const dots = matches.slice(0, 10).map((m) => {
    const player = getPlayerFromMatch(m, name, tag);
    if (!player) return null;
    return getMatchResult(m, player);
  }).filter(Boolean) as ("win" | "loss" | "draw")[];

  if (!dots.length) return null;
  return (
    <div className="flex items-center gap-1 mt-3">
      <span className="text-zinc-700 text-[10px] uppercase tracking-[0.15em] mr-1">Form</span>
      {dots.map((r, i) => (
        <span
          key={i}
          className={`w-2 h-2 rounded-full ${r === "win" ? "bg-green-400" : r === "loss" ? "bg-red-500" : "bg-zinc-600"}`}
          title={r}
        />
      ))}
    </div>
  );
}

function getRankIconUrl(tier: number): string {
  return `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${tier}/largeicon.png`;
}

export function PlayerHeader({ account, mmr, playerCard, region, accountLevel, matches, playerName, playerTag }: PlayerHeaderProps) {
  const tier = mmr?.currenttier ?? 0;
  const tierColor = getTierColor(tier);
  const tierName = mmr?.currenttierpatched ?? getTierName(tier);
  const peakTier = mmr?.highest_rank?.tier ?? 0;

  const topAgent = (() => {
    if (!matches?.length || !playerName || !playerTag) return null;
    const agentMap = new Map<string, {
      games: number; wins: number; kills: number; deaths: number;
      portrait: string; bust: string; agentName: string;
    }>();
    for (const match of matches) {
      const player = getPlayerFromMatch(match, playerName, playerTag);
      if (!player) continue;
      const result = getMatchResult(match, player);
      const key = player.character;
      const ex = agentMap.get(key);
      if (ex) {
        ex.games++;
        if (result === "win") ex.wins++;
        ex.kills += player.stats.kills;
        ex.deaths += player.stats.deaths;
      } else {
        agentMap.set(key, {
          games: 1, wins: result === "win" ? 1 : 0,
          kills: player.stats.kills, deaths: player.stats.deaths,
          portrait: player.assets?.agent?.small ?? "",
          bust: player.assets?.agent?.bust ?? player.assets?.agent?.full ?? "",
          agentName: player.character,
        });
      }
    }
    if (!agentMap.size) return null;
    const [, s] = [...agentMap.entries()].sort((a, b) => b[1].games - a[1].games)[0];
    return { ...s, wr: Math.round((s.wins / s.games) * 100), kd: calcKD(s.kills, s.deaths) };
  })();

  // RR progress toward next division (0-100)
  const rrProgress = mmr?.ranking_in_tier ?? 0;

  return (
    <div
      className="relative rounded-2xl overflow-hidden mb-6 shadow-2xl"
      style={{ background: "#090a0f", minHeight: 280 }}
    >
      {/* Player card art — full bleed background */}
      {playerCard && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={playerCard}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-top"
          style={{ opacity: 0.13, filter: "blur(2px)", transform: "scale(1.05)" }}
        />
      )}

      {/* Rank color ambient glow — right side */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 55% 130% at 90% 50%, ${tierColor}22 0%, transparent 65%)`,
        }}
      />
      {/* Dark vignette from left */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#090a0f] via-[#090a0f]/85 to-transparent pointer-events-none" />
      {/* Bottom fade */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#090a0f] to-transparent pointer-events-none" />

      {/* Top agent bust — atmospheric right-side art */}
      {topAgent?.bust && (
        <div className="absolute right-0 top-0 bottom-0 w-[38%] overflow-hidden pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={topAgent.bust}
            alt=""
            className="absolute right-[-8%] bottom-0 h-[115%] object-contain object-bottom"
            style={{ opacity: 0.15 }}
          />
          {/* Fade agent into background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#090a0f] via-transparent to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="relative flex items-center gap-7 px-8 sm:px-10 py-9" style={{ minHeight: 280 }}>
        {/* ── Avatar ── */}
        <div className="relative shrink-0">
          <div
            className="rounded-2xl overflow-hidden shadow-2xl border-2"
            style={{ borderColor: `${tierColor}45`, width: 112, height: 112 }}
          >
            {playerCard ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={playerCard.replace("wideart", "smallart")}
                alt={account.gameName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-5xl font-black bg-zinc-800/80"
              >
                {account.gameName[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#090a0f] border border-white/10 text-zinc-400 text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-lg">
            Lv. {accountLevel ?? "—"}
          </div>
        </div>

        {/* ── Name + meta ── */}
        <div className="flex-1 min-w-0">
          {/* Region badge */}
          <span
            className="inline-block text-[11px] uppercase tracking-[0.28em] font-black px-2.5 py-0.5 rounded-full border mb-2 w-fit"
            style={{
              color: tierColor,
              borderColor: `${tierColor}30`,
              backgroundColor: `${tierColor}12`,
            }}
          >
            {region.toUpperCase()} · Valorant
          </span>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-none truncate">
            {account.gameName}
            <span className="text-zinc-600 text-xl sm:text-2xl font-normal ml-2.5">
              #{account.tagLine}
            </span>
          </h1>

          {matches && playerName && playerTag && (
            <RecentFormDots matches={matches} name={playerName} tag={playerTag} />
          )}

          {topAgent && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={topAgent.portrait}
                alt={topAgent.agentName}
                className="w-5 h-5 rounded-md object-cover"
              />
              <span className="text-zinc-300 text-sm font-bold">{topAgent.agentName}</span>
              <span className="text-zinc-700 text-xs">·</span>
              <span className="text-zinc-600 text-sm font-mono">{topAgent.games}G</span>
              <span className="text-zinc-700 text-xs">·</span>
              <span
                className="text-sm font-mono font-bold"
                style={{
                  color:
                    topAgent.wr >= 55
                      ? "#22c55e"
                      : topAgent.wr >= 50
                      ? "#86efac"
                      : "#ef4444",
                }}
              >
                {topAgent.wr}% WR
              </span>
              <span className="text-zinc-700 text-xs">·</span>
              <span className="text-zinc-500 text-sm font-mono">{topAgent.kd} K/D</span>
            </div>
          )}

        </div>

        {/* ── Rank-colored divider ── */}
        <div
          className="hidden sm:block w-px self-stretch my-4 shrink-0"
          style={{
            background: `linear-gradient(to bottom, transparent, ${tierColor}35, transparent)`,
          }}
        />

        {/* ── Rank showcase ── */}
        <div className="flex items-center gap-5 shrink-0">
          <div
            className="relative drop-shadow-2xl shrink-0"
            style={{ width: 100, height: 100 }}
          >
            <Image
              src={getRankIconUrl(tier)}
              alt={tierName}
              fill
              sizes="100px"
              className="object-contain"
              style={{ filter: `drop-shadow(0 0 12px ${tierColor}50)` }}
            />
          </div>

          <div className="min-w-[130px]">
            <p className="text-[10px] text-zinc-600 uppercase tracking-[0.22em] mb-0.5">
              Current Rank
            </p>
            <p
              className="text-3xl sm:text-4xl font-black leading-none"
              style={{ color: tierColor }}
            >
              {tierName}
            </p>

            {mmr && tier > 0 && (
              <>
                <p className="text-white/90 font-mono font-bold text-xl mt-1.5 leading-none">
                  {mmr.ranking_in_tier}
                  <span className="text-zinc-600 text-sm font-normal ml-1">RR</span>
                  {mmr.mmr_change_to_last_game !== 0 && (
                    <span
                      className={`text-sm font-bold ml-2 ${
                        mmr.mmr_change_to_last_game > 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {mmr.mmr_change_to_last_game > 0 ? "+" : ""}
                      {mmr.mmr_change_to_last_game}
                    </span>
                  )}
                </p>
                {/* RR bar */}
                <div className="mt-2.5 w-32 h-1.5 bg-white/[0.07] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${rrProgress}%`,
                      backgroundColor: tierColor,
                      boxShadow: `0 0 8px ${tierColor}80`,
                    }}
                  />
                </div>
              </>
            )}

            {mmr?.highest_rank && peakTier > 0 && (
              <div className="flex items-center gap-1.5 mt-2.5">
                <div className="relative w-5 h-5 shrink-0">
                  <Image
                    src={getRankIconUrl(peakTier)}
                    alt="peak"
                    fill
                    sizes="20px"
                    className="object-contain"
                  />
                </div>
                <span className="text-zinc-600 text-xs font-mono">
                  Peak{" "}
                  <span className="text-zinc-400">
                    {mmr.highest_rank.patched_tier}
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Favorite button */}
          <div className="self-start">
            <FavoriteButton name={account.gameName} tag={account.tagLine} region={region} />
          </div>
        </div>
      </div>
    </div>
  );
}
