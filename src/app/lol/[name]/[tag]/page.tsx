import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getLolAccount,
  getLolSummoner,
  getLeagueEntries,
  getLolMatchIds,
  getLolMatch,
  getLolLiveGame,
  getSummonerIconUrl,
  type LolMatch,
} from "@/lib/api/lol";
import { LolHeader } from "@/components/lol/lol-header";
import { LolRankedCards } from "@/components/lol/lol-ranked-cards";
import { LolChampionStats } from "@/components/lol/lol-champion-stats";
import { LolMatchHistory } from "@/components/lol/lol-match-history";
import { LolLpChart } from "@/components/lol/lol-lp-chart";
import { LolLiveBanner } from "@/components/lol/lol-live-banner";

interface Props {
  params: Promise<{ name: string; tag: string }>;
  searchParams: Promise<{ region?: string }>;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  try {
    const { name, tag } = await params;
    const { region = "na" } = await searchParams;
    const gameName = decodeURIComponent(name);
    const tagLine = decodeURIComponent(tag);

    const account = await getLolAccount(gameName, tagLine, region).catch(() => null);
    const summoner = account ? await getLolSummoner(account.puuid, region).catch(() => null) : null;
    const entries = account ? await getLeagueEntries(account.puuid, region).catch(() => []) : [];
    const solo = entries.find((e) => e.queueType === "RANKED_SOLO_5x5");
    const rankStr = solo ? `${solo.tier} ${solo.rank} • ${solo.leaguePoints} LP` : "Unranked";

    return {
      title: `${gameName}#${tagLine} — LoL`,
      description: `${gameName}#${tagLine} — ${rankStr} · League of Legends stats on Clutchly`,
      openGraph: {
        title: `${gameName}#${tagLine} — League of Legends`,
        description: rankStr,
      },
    };
  } catch {
    return { title: "Player — LoL" };
  }
}

export default async function LolPlayerPage({ params, searchParams }: Props) {
  const { name, tag } = await params;
  const { region = "na" } = await searchParams;
  const gameName = decodeURIComponent(name);
  const tagLine = decodeURIComponent(tag);

  // All fetches — throw on account 404
  const account = await getLolAccount(gameName, tagLine, region).catch(() => null);
  if (!account) notFound();

  // Summoner might not exist in this LoL region even if the Riot account does
  let summoner;
  try {
    summoner = await getLolSummoner(account.puuid, region);
  } catch {
    throw new Error(
      `No League of Legends account found for ${account.gameName}#${account.tagLine} in ${region.toUpperCase()}. Try a different region.`
    );
  }

  const matchIds = await getLolMatchIds(account.puuid, region, { queue: 420, count: 20 }).catch(() => [] as string[]);

  const [entries, liveGame, matches] = await Promise.all([
    getLeagueEntries(account.puuid, region),
    getLolLiveGame(account.puuid, region),
    Promise.all(matchIds.map((id) => getLolMatch(id, region).catch(() => null))).then(
      (results) => results.filter((m): m is LolMatch => m !== null)
    ),
  ]);

  const soloEntry = entries.find((e) => e.queueType === "RANKED_SOLO_5x5") ?? null;
  const flexEntry = entries.find((e) => e.queueType === "RANKED_FLEX_SR") ?? null;
  const iconUrl = getSummonerIconUrl(summoner.profileIconId);

  return (
    <main>
      {/* Live game banner */}
      {liveGame && (
        <LolLiveBanner
          game={liveGame}
          puuid={account.puuid}
          region={region}
        />
      )}

      <div className="max-w-[1400px] mx-auto px-4 pt-6">
        <LolHeader
          gameName={account.gameName}
          tagLine={account.tagLine}
          summonerLevel={summoner.summonerLevel}
          iconUrl={iconUrl}
          soloEntry={soloEntry}
          region={region}
        />
      </div>

      <div className="max-w-[1400px] mx-auto px-4 pb-8">
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* Main column */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">
            <LolRankedCards soloEntry={soloEntry} flexEntry={flexEntry} />
            {matches.length >= 5 && (
              <LolLpChart
                matches={matches}
                puuid={account.puuid}
                soloEntry={soloEntry}
              />
            )}
            <LolMatchHistory
              matches={matches}
              puuid={account.puuid}
            />
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-[300px] shrink-0 flex flex-col gap-4">
            <LolChampionStats matches={matches} puuid={account.puuid} />
          </div>
        </div>
      </div>
    </main>
  );
}
