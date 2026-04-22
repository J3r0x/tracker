"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTrackerStore } from "@/stores/tracker-store";

interface SearchBarProps {
  compact?: boolean;
  game?: "valorant" | "lol";
  lolRegion?: string;
}

export function SearchBar({ compact = false, game = "valorant", lolRegion }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { recentSearches, addRecentSearch, region } = useTrackerStore();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (inputRef.current && !inputRef.current.closest("form")?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function navigate(q: string) {
    const trimmed = q.trim();
    if (!trimmed.includes("#")) return;
    const [name, ...rest] = trimmed.split("#");
    const tag = rest.join("#");
    if (!name || !tag) return;
    addRecentSearch(trimmed);
    setQuery("");
    setOpen(false);
    const base = game === "lol" ? "/lol" : "/player";
    const regionParam = game === "lol" ? (lolRegion ?? "lan") : region;
    router.push(`${base}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?region=${regionParam}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate(query);
  }

  const showRecents = open && !query && recentSearches.length > 0;
  const isValid = query.includes("#");

  return (
    <form onSubmit={handleSubmit} className="w-full flex gap-2 relative">
      <div className="relative flex-1">
        {/* Search icon */}
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none"
          style={{ width: compact ? 14 : 16, height: compact ? 14 : 16 }}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="PlayerName#TAG"
          autoComplete="off"
          spellCheck={false}
          className={cn(
            "w-full bg-white/[0.03] border border-white/[0.07] rounded-md text-white placeholder:text-zinc-600",
            "focus:outline-none focus:border-[#C8AA6E]/40 focus:bg-white/[0.04] transition-all",
            compact
              ? "pl-8 pr-3 py-1.5 text-sm"
              : "pl-10 pr-4 py-3.5 text-base"
          )}
        />

        {/* Recent searches dropdown */}
        {showRecents && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0d0e12] border border-white/[0.08] rounded-md overflow-hidden z-50 shadow-2xl shadow-black/60">
            <p className="text-zinc-600 text-[10px] uppercase tracking-widest px-3 py-2 border-b border-white/5 font-semibold">
              Recent
            </p>
            {recentSearches.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => navigate(s)}
                className="w-full text-left px-3 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2.5"
              >
                <svg className="w-3 h-3 text-zinc-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>
                </svg>
                <span className="font-mono text-xs">{s}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={!isValid}
        className={cn(
            "bg-[#C8AA6E] hover:bg-[#d4b87a] active:bg-[#b89a5e] text-black font-black rounded-md transition-all shrink-0 disabled:opacity-30 disabled:cursor-not-allowed",
          compact ? "px-3 py-1.5 text-sm" : "px-5 py-3.5 text-sm tracking-wide"
        )}
      >
        {compact ? (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        ) : "Search"}
      </button>
    </form>
  );
}
