import Link from "next/link";
import { SearchBar } from "@/components/search-bar";

export default function NotFound() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center p-8">
      <div className="w-full max-w-md flex flex-col items-center gap-6 text-center">
        <div className="text-8xl font-black text-zinc-800">404</div>
        <div>
          <h1 className="text-2xl font-bold text-white">Player not found</h1>
          <p className="text-zinc-500 mt-2 text-sm">
            Make sure the Riot ID is correct and the player exists in the
            selected region.
          </p>
        </div>

        <div className="w-full">
          <SearchBar />
        </div>

        <Link href="/" className="text-zinc-500 hover:text-red-500 text-sm transition-colors">
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
