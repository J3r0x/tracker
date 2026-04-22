// Re-exports the Henrik API functions directly.
// Caching is handled at the fetch level via `next: { revalidate: 60 }` inside henrikFetch,
// which deduplicates concurrent requests and revalidates after 60 seconds.
// We intentionally avoid unstable_cache here because match payloads can exceed the 2MB limit.
export {
  getHenrikAccount as getCachedAccount,
  getPlayerMMR as getCachedPlayerMMR,
  getMatchHistory as getCachedMatchHistory,
  getMMRHistory as getCachedMMRHistory,
} from "@/lib/api/henrik";

