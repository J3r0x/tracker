import { SearchBar } from "@/components/search-bar";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl flex flex-col items-center gap-8">
        {/* Logo / Title */}
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight">
            <span className="text-red-500">VALORANT</span> TRACKER
          </h1>
          <p className="mt-2 text-zinc-400 text-lg">
            Stats, rank history & performance insights
          </p>
        </div>

        {/* Search */}
        <SearchBar />

        <p className="text-zinc-600 text-sm">
          Enter your Riot ID (e.g. <span className="text-zinc-400">Player#NA1</span>)
        </p>
      </div>
    </main>
  );
}
