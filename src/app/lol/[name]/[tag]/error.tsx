"use client";

import { useEffect } from "react";

export default function LolError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[LoL Error]", error);
  }, [error]);

  const is404 = error.message.toLowerCase().includes("not found");
  const isKey = error.message.toLowerCase().includes("api key");
  const isRegion = error.message.toLowerCase().includes("try a different region");

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <svg className="w-7 h-7 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          </svg>
        </div>

        <div>
          <h1 className="text-xl font-black text-white mb-1">
            {is404 ? "Summoner not found" : isKey ? "API key issue" : "Something went wrong"}
          </h1>
          <p className="text-zinc-500 text-sm leading-relaxed">
            {is404
              ? "Check the Riot ID and region — they must match exactly (e.g. Player#NA1)."
              : isRegion
              ? error.message
              : isKey
              ? "The Riot API key is missing or expired. Dev keys need to be refreshed every 24 hours."
              : error.message}
          </p>
        </div>

        <div className="flex gap-2 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 text-sm font-bold bg-amber-400 hover:bg-amber-300 text-black rounded-lg transition-colors"
          >
            Try again
          </button>
          <a
            href="/"
            className="px-4 py-2 text-sm font-bold bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.07] text-zinc-300 rounded-lg transition-colors"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
