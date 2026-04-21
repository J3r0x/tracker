"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || !trimmed.includes("#")) return;

    const [name, tag] = trimmed.split("#");
    if (!name || !tag) return;

    router.push(`/player/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="PlayerName#TAG"
        className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
      />
      <button
        type="submit"
        className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
        disabled={!query.includes("#")}
      >
        Search
      </button>
    </form>
  );
}
