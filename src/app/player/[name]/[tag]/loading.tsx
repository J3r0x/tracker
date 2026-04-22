export default function PlayerLoading() {
  return (
    <main className="min-h-[calc(100vh-3.5rem)]">
      {/* ── Header skeleton ── */}
      <div className="max-w-[1400px] mx-auto px-4 pt-6 mb-6">
        <div className="relative rounded-2xl overflow-hidden bg-[#090a0f] animate-pulse" style={{ minHeight: 280 }}>
          {/* ambient glow placeholder */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#090a0f] via-[#090a0f]/85 to-transparent" />
          <div className="relative flex items-center gap-7 px-8 sm:px-10 py-9" style={{ minHeight: 280 }}>
            {/* Avatar */}
            <div className="shrink-0 w-28 h-28 rounded-2xl bg-white/[0.06]" />

            {/* Name + meta */}
            <div className="flex-1 min-w-0 flex flex-col gap-3">
              <div className="h-3 w-20 rounded-full bg-white/[0.06]" />
              <div className="h-10 w-64 rounded-lg bg-white/[0.08]" />
              <div className="h-2.5 w-40 rounded-full bg-white/[0.05]" />
              <div className="h-4 w-52 rounded-full bg-white/[0.05] mt-1" />
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px self-stretch my-4 bg-white/[0.05]" />

            {/* Rank */}
            <div className="flex items-center gap-5 shrink-0">
              <div className="w-24 h-24 rounded-full bg-white/[0.06]" />
              <div className="flex flex-col gap-2 min-w-[130px]">
                <div className="h-2.5 w-20 rounded-full bg-white/[0.05]" />
                <div className="h-9 w-32 rounded-lg bg-white/[0.08]" />
                <div className="h-5 w-24 rounded-full bg-white/[0.06]" />
                <div className="h-1.5 w-32 rounded-full bg-white/[0.06]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main + Sidebar ── */}
      <div className="max-w-[1400px] mx-auto px-4 pb-6">
        <div className="flex flex-col lg:flex-row gap-5 items-start">

          {/* Main column */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">
            {/* Performance overview */}
            <SkeletonCard height={180} />
            {/* MMR chart */}
            <SkeletonCard height={220} />
            {/* Match history — 5 rows */}
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonCard key={i} height={72} />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-[300px] shrink-0 flex flex-col gap-4">
            <SkeletonCard height={260} />
            <SkeletonCard height={220} />
            <SkeletonCard height={200} />
          </div>
        </div>
      </div>
    </main>
  );
}

function SkeletonCard({ height }: { height: number }) {
  return (
    <div
      className="w-full rounded-2xl bg-[#0d0e14] animate-pulse border border-white/[0.04]"
      style={{ height }}
    >
      <div className="p-4 flex flex-col gap-3">
        <div className="h-2.5 w-28 rounded-full bg-white/[0.06]" />
        <div className="h-2 w-full rounded-full bg-white/[0.04]" />
        <div className="h-2 w-4/5 rounded-full bg-white/[0.04]" />
      </div>
    </div>
  );
}
