export default function LolLoading() {
  return (
    <main>
      <div className="max-w-[1400px] mx-auto px-4 pt-6">
        {/* Header skeleton */}
        <div className="rounded-xl border border-white/[0.07] bg-[#0d0e14] overflow-hidden animate-pulse mb-5">
          <div className="flex items-center gap-7 px-8 py-9">
            {/* Icon */}
            <div className="w-24 h-24 rounded-full bg-white/[0.06] shrink-0" />
            {/* Name + rank */}
            <div className="flex flex-col gap-3 flex-1">
              <div className="h-9 w-64 bg-white/[0.06] rounded-lg" />
              <div className="h-4 w-40 bg-white/[0.04] rounded" />
            </div>
            {/* Rank badge */}
            <div className="hidden lg:flex flex-col gap-2 items-end">
              <div className="h-10 w-44 bg-white/[0.06] rounded-lg" />
              <div className="h-4 w-24 bg-white/[0.04] rounded" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 pb-8">
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* Main column */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">
            {/* Ranked cards */}
            <div className="flex gap-4">
              {[0, 1].map((i) => (
                <div key={i} className="flex-1 h-36 rounded-xl bg-[#0d0e14] border border-white/[0.06] animate-pulse" />
              ))}
            </div>
            {/* LP chart */}
            <div className="h-[220px] rounded-xl bg-[#0d0e14] border border-white/[0.06] animate-pulse" />
            {/* Match rows */}
            {[0, 1, 2, 4, 5].map((i) => (
              <div key={i} className="h-[72px] rounded-xl bg-[#0d0e14] border border-white/[0.06] animate-pulse" />
            ))}
          </div>
          {/* Sidebar */}
          <div className="w-full lg:w-[300px] shrink-0">
            <div className="h-64 rounded-xl bg-[#0d0e14] border border-white/[0.06] animate-pulse" />
          </div>
        </div>
      </div>
    </main>
  );
}
