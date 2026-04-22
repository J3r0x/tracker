import { notFound } from "next/navigation";
import { getCachedAccount, getCachedMatchHistory, getCachedMMRHistory, getCachedPlayerMMR } from "@/lib/api/cached";
import { PlayerHeader } from "@/components/player/player-header";
import { PerformanceOverview } from "@/components/player/performance-overview";
import { MatchHistory } from "@/components/player/match-history";
import { MMRChart } from "@/components/player/mmr-chart";
import { AgentStats } from "@/components/player/agent-stats";
import { MapStats } from "@/components/player/map-stats";
import { MostPlayedWith } from "@/components/player/most-played-with";

interface PageProps {
  params: Promise<{ name: string; tag: string }>;
  searchParams: Promise<{ region?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps) {
  const { name, tag } = await params;
  const { region: regionParam } = await searchParams;
  const decodedName = decodeURIComponent(name);
  const decodedTag = decodeURIComponent(tag);

  // Best-effort: fetch rank info for OG image — silently skip on failure
  let rank = "Unranked";
  let rr = "0";
  let tier = "0";
  let cardUrl = "";
  try {
    const { getCachedAccount: _ca } = await import("@/lib/api/cached");
    const account = await _ca(decodedName, decodedTag);
    const region = (regionParam ?? account.region ?? "na").toLowerCase();
    cardUrl = account.card?.wide ?? "";
    const { getCachedPlayerMMR: _cm } = await import("@/lib/api/cached");
    const mmr = await _cm(decodedName, decodedTag, region);
    rank = mmr.currenttierpatched ?? "Unranked";
    rr = String(mmr.ranking_in_tier ?? 0);
    tier = String(mmr.currenttier ?? 0);
  } catch {
    // ignore
  }

  const ogUrl = new URL("/api/og", "https://clutchly.vercel.app");
  ogUrl.searchParams.set("name", decodedName);
  ogUrl.searchParams.set("tag", decodedTag);
  ogUrl.searchParams.set("rank", rank);
  ogUrl.searchParams.set("rr", rr);
  ogUrl.searchParams.set("tier", tier);
  if (cardUrl) ogUrl.searchParams.set("card", cardUrl);

  return {
    title: `${decodedName}#${decodedTag} — Clutchly`,
    description: `${decodedName}#${decodedTag} · ${rank} · ${rr} RR — Track stats, rank history and performance on Clutchly.`,
    openGraph: {
      title: `${decodedName}#${decodedTag} — Clutchly`,
      description: `${rank} · ${rr} RR`,
      images: [{ url: ogUrl.toString(), width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${decodedName}#${decodedTag} — Clutchly`,
      images: [ogUrl.toString()],
    },
  };
}

export default async function PlayerPage({ params, searchParams }: PageProps) {
  const { name, tag } = await params;
  const { region: regionParam } = await searchParams;

  const decodedName = decodeURIComponent(name);
  const decodedTag = decodeURIComponent(tag);

  // Cuenta + región auto-detectada desde Henrik (1 sola llamada)
  let account;
  try {
    account = await getCachedAccount(decodedName, decodedTag);
  } catch {
    notFound();
  }

  const region = (regionParam ?? account.region ?? "na").toLowerCase();

  // Todo lo demás es opcional — falla silenciosamente
  const [mmrResult, matchesResult, mmrHistoryResult] = await Promise.allSettled([
    getCachedPlayerMMR(decodedName, decodedTag, region),
    getCachedMatchHistory(decodedName, decodedTag, region, 20, "competitive"),
    getCachedMMRHistory(decodedName, decodedTag, region),
  ]);

  const mmrData = mmrResult.status === "fulfilled" ? mmrResult.value : null;
  const mmrHistory = mmrHistoryResult.status === "fulfilled" ? mmrHistoryResult.value : [];

  // Filtrar partidas con metadata o players nulos (custom games, etc.)
  const rawMatches = matchesResult.status === "fulfilled" ? matchesResult.value : [];
  const matchesData = rawMatches.filter(
    (m) => m?.metadata != null && m?.players?.all_players != null
  );

  // Player card desde el primer match disponible
  const firstMatchPlayer = matchesData[0]?.players?.all_players?.find(
    (p) =>
      p.name.toLowerCase() === decodedName.toLowerCase() &&
      p.tag.toLowerCase() === decodedTag.toLowerCase()
  );
  const playerCard = firstMatchPlayer?.assets?.card?.wide ?? account.card?.wide ?? undefined;

  return (
    <main className="min-h-[calc(100vh-3.5rem)]">
      {/* Full-width hero header */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-4 pt-6">
        <PlayerHeader
          account={{ puuid: account.puuid, gameName: account.name, tagLine: account.tag }}
          mmr={mmrData}
          playerCard={playerCard}
          region={region}
          accountLevel={account.account_level}
          matches={matchesData}
          playerName={decodedName}
          playerTag={decodedTag}
        />
      </div>

      {/* Main + Sidebar layout */}
      <div className="max-w-[1400px] mx-auto px-4 pb-6">
        <div className="flex flex-col lg:flex-row gap-5 items-start">

          {/* ── Main column ── */}
          <div className="flex-1 min-w-0">
            {/* Unified performance overview (stats + insights) */}
            <PerformanceOverview
              matches={matchesData}
              name={decodedName}
              tag={decodedTag}
            />

            {/* Rank history chart */}
            {(mmrData || mmrHistory.length > 0) && (
              <div className="mb-6">
                <MMRChart history={mmrHistory} mmr={mmrData} />
              </div>
            )}

            {/* Match history */}
            <MatchHistory
              matches={matchesData}
              name={decodedName}
              tag={decodedTag}
            />
          </div>

          {/* ── Sidebar ── */}
          <div className="w-full lg:w-[300px] shrink-0 flex flex-col gap-4">
            <AgentStats
              matches={matchesData}
              name={decodedName}
              tag={decodedTag}
            />
            <MapStats
              matches={matchesData}
              name={decodedName}
              tag={decodedTag}
            />
            <MostPlayedWith
              matches={matchesData}
              name={decodedName}
              tag={decodedTag}
            />
          </div>

        </div>
      </div>
    </main>
  );
}
