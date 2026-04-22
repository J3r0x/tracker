import { SearchBar } from "@/components/search-bar";
import { FavoritesPanel } from "@/components/favorites-panel";

export default function HomePage() {
  return (
    <main className="relative min-h-[calc(100vh-3.5rem)] flex flex-col justify-center px-8 md:px-16 overflow-hidden">
      {/* Grid background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)`,
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, black 20%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, black 20%, transparent 100%)",
        }}
      />

      {/* Glows */}
      <div className="pointer-events-none absolute -top-32 right-0 w-[480px] h-[480px] rounded-full bg-cyan-400/[0.04] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-64 h-64 rounded-full bg-cyan-400/[0.03] blur-3xl" />

      {/* Decorative watermark */}
      <span
        className="pointer-events-none select-none absolute right-0 top-1/2 -translate-y-1/2 text-[18vw] font-black tracking-tighter leading-none text-white/[0.018] hidden lg:block"
        aria-hidden
      >
        CLUTCHLY
      </span>

      <div className="relative max-w-xl py-16">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 mb-10 px-3 py-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/20">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-cyan-400 text-[11px] font-bold tracking-[0.25em] uppercase">
            Clutchly — Valorant Tracker
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-[0.88] mb-8 select-none">
          TRACK.<br />
          GRIND.<br />
          <span className="text-cyan-400">IMPROVE.</span>
        </h1>

        <p className="text-zinc-500 text-base leading-relaxed mb-10 max-w-sm">
          Stats, rank history, and performance analytics for Valorant — built for players who actually care.
        </p>

        {/* Search */}
        <SearchBar />

        <p className="text-zinc-700 text-xs mt-3 font-mono">
          e.g.{" "}
          <span className="text-zinc-500">PlayerName<span className="text-cyan-400/60">#</span>TAG</span>
        </p>

        {/* Favorites quick-access */}
        <FavoritesPanel />

        {/* Features */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-8">
          {[
            "Match History",
            "MMR Tracking",
            "Agent Stats",
            "Map Winrates",
            "Performance Insights",
            "Best Duo",
            "Damage Delta",
            "Scoreboard",
          ].map((feat) => (
            <span key={feat} className="flex items-center gap-2 text-[11px] text-zinc-600">
              <span className="w-1 h-1 rounded-full bg-cyan-400/50 shrink-0" />
              {feat}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
