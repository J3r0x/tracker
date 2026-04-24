import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCachedAccount, getCachedMMRHistory, getCachedPlayerMMR } from "@/lib/api/cached";
import { PlayerHeader } from "@/components/player/player-header";
import { MatchSections, MatchSectionsSkeleton } from "@/components/player/match-sections";

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

  // Fetch account first — Henrik auto-detects the correct region from the Riot account.
  // This is the authoritative source; regionParam from the URL can be wrong (e.g. user had LATAM
  // selected in the store when searching an NA player).
  const account = await getCachedAccount(decodedName, decodedTag).catch(() => null);
  if (!account) notFound();

  const resolvedRegion = (account.region ?? regionParam ?? "na").toLowerCase();

  // Now fetch the remaining fast endpoints in parallel with the correct region
  const [mmrResult, mmrHistoryResult] = await Promise.allSettled([
    getCachedPlayerMMR(decodedName, decodedTag, resolvedRegion),
    getCachedMMRHistory(decodedName, decodedTag, resolvedRegion),
  ]);

  const mmrData = mmrResult.status === "fulfilled" ? mmrResult.value : null;
  const mmrHistory = mmrHistoryResult.status === "fulfilled" ? mmrHistoryResult.value : [];

  return (
    <main className="min-h-[calc(100vh-3.5rem)]">
      {/* Header renders immediately — no match data needed */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-4 pt-6">
        <PlayerHeader
          account={{ puuid: account.puuid, gameName: account.name, tagLine: account.tag }}
          mmr={mmrData}
          playerCard={account.card?.wide}
          region={resolvedRegion}
          accountLevel={account.account_level}
          playerName={decodedName}
          playerTag={decodedTag}
        />
      </div>

      {/* Match sections stream in independently — don't block the header */}
      <Suspense fallback={<MatchSectionsSkeleton />}>
        <MatchSections
          name={decodedName}
          tag={decodedTag}
          region={resolvedRegion}
          mmrData={mmrData}
          mmrHistory={mmrHistory}
        />
      </Suspense>
    </main>
  );
}
