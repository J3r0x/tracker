// Async Server Component — fetched independently from the page shell.
// Wrapped in <Suspense> in page.tsx so the player header renders immediately
// while this component streams in after the slower Henrik /matches call resolves.

import { getCachedMatchHistory } from "@/lib/api/cached";
import type { PlayerMMR, MMRHistoryEntry, HenrikMatch } from "@/lib/api/henrik";
import { PerformanceOverview } from "@/components/player/performance-overview";
import { MMRChart } from "@/components/player/mmr-chart";
import { MatchHistory } from "@/components/player/match-history";
import { AgentStats } from "@/components/player/agent-stats";
import { MapStats } from "@/components/player/map-stats";
import { MostPlayedWith } from "@/components/player/most-played-with";

interface MatchSectionsProps {
  name: string;
  tag: string;
  region: string;
  mmrData: PlayerMMR | null;
  mmrHistory: MMRHistoryEntry[];
}

export async function MatchSections({ name, tag, region, mmrData, mmrHistory }: MatchSectionsProps) {
  const rawMatches = await getCachedMatchHistory(name, tag, region, 15, "competitive").catch(
    () => [] as HenrikMatch[]
  );
  const matches = rawMatches.filter(
    (m) => m?.metadata != null && m?.players?.all_players != null
  );

  return (
    <div className="max-w-[1400px] mx-auto px-4 pb-6">
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* ── Main column ── */}
        <div className="flex-1 min-w-0">
          <PerformanceOverview matches={matches} name={name} tag={tag} />

          {(mmrData || mmrHistory.length > 0) && (
            <div className="mb-6">
              <MMRChart history={mmrHistory} mmr={mmrData} />
            </div>
          )}

          <MatchHistory matches={matches} name={name} tag={tag} />
        </div>

        {/* ── Sidebar ── */}
        <div className="w-full lg:w-[300px] shrink-0 flex flex-col gap-4">
          <AgentStats matches={matches} name={name} tag={tag} />
          <MapStats matches={matches} name={name} tag={tag} />
          <MostPlayedWith matches={matches} name={name} tag={tag} />
        </div>
      </div>
    </div>
  );
}

// ── Skeleton shown while MatchSections streams in ──────────────────────────

export function MatchSectionsSkeleton() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 pb-6 animate-pulse">
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Main column skeleton */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Performance overview */}
          <div className="rounded-xl bg-[#111318] border border-white/[0.07] h-32" />
          {/* MMR chart */}
          <div className="rounded-xl bg-[#111318] border border-white/[0.07] h-48" />
          {/* Match cards */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-[#111318] border border-white/[0.07] h-20" />
          ))}
        </div>
        {/* Sidebar skeleton */}
        <div className="w-full lg:w-[300px] shrink-0 flex flex-col gap-4">
          <div className="rounded-xl bg-[#111318] border border-white/[0.07] h-48" />
          <div className="rounded-xl bg-[#111318] border border-white/[0.07] h-40" />
          <div className="rounded-xl bg-[#111318] border border-white/[0.07] h-36" />
        </div>
      </div>
    </div>
  );
}
