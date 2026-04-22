"use client";

import { useEffect } from "react";

export default function PlayerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isNotFound =
    error.message?.includes("404") ||
    error.message?.toLowerCase().includes("not found");

  return (
    <main className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center flex flex-col items-center gap-6">
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>

        {/* Message */}
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-black text-white">
            {isNotFound ? "Player not found" : "Something went wrong"}
          </h2>
          <p className="text-zinc-500 text-sm leading-relaxed">
            {isNotFound
              ? "We couldn't find that player. Check the name and tag, and make sure the region is correct."
              : "The Valorant API returned an error. This is usually temporary — try again in a few seconds."}
          </p>
          {error.message && !isNotFound && (
            <p className="text-zinc-700 text-xs font-mono mt-1 px-3 py-1.5 bg-white/[0.03] rounded-lg border border-white/[0.05]">
              {error.message}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={reset}
            className="px-5 py-2 rounded-xl bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/20 hover:border-cyan-400/40 text-cyan-400 text-sm font-bold transition-all"
          >
            Try again
          </button>
          <a
            href="/"
            className="px-5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-zinc-400 text-sm font-medium transition-all"
          >
            Go home
          </a>
        </div>
      </div>
    </main>
  );
}
