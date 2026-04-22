import type { HenrikMatch, HenrikPlayer } from "@/lib/api/henrik";

// ─── Tier / Rank ────────────────────────────────────────────────────────────

// Henrik API usa el sistema 0/3-27: Iron 1 = 3, Plat 2 = 16, Radiant = 27
// elo = currenttier * 100 + ranking_in_tier
export const TIER_NAMES: Record<number, string> = {
  0: "Unranked",
  3: "Iron 1",     4: "Iron 2",     5: "Iron 3",
  6: "Bronze 1",   7: "Bronze 2",   8: "Bronze 3",
  9: "Silver 1",  10: "Silver 2",  11: "Silver 3",
  12: "Gold 1",   13: "Gold 2",    14: "Gold 3",
  15: "Platinum 1", 16: "Platinum 2", 17: "Platinum 3",
  18: "Diamond 1",  19: "Diamond 2",  20: "Diamond 3",
  21: "Ascendant 1", 22: "Ascendant 2", 23: "Ascendant 3",
  24: "Immortal 1",  25: "Immortal 2",  26: "Immortal 3",
  27: "Radiant",
};

export const TIER_COLORS: Record<number, string> = {
  0: "#6B7280",
  3: "#94A3B8",  4: "#94A3B8",  5: "#94A3B8",   // Iron
  6: "#B45309",  7: "#B45309",  8: "#B45309",   // Bronze
  9: "#9CA3AF", 10: "#9CA3AF", 11: "#9CA3AF",   // Silver
  12: "#D97706", 13: "#D97706", 14: "#D97706",  // Gold
  15: "#0891B2", 16: "#0891B2", 17: "#0891B2",  // Platinum
  18: "#7C3AED", 19: "#7C3AED", 20: "#7C3AED",  // Diamond
  21: "#16A34A", 22: "#16A34A", 23: "#16A34A",  // Ascendant
  24: "#DC2626", 25: "#DC2626", 26: "#DC2626",  // Immortal
  27: "#F59E0B",                                 // Radiant
};

export function getTierName(tier: number): string {
  return TIER_NAMES[tier] ?? "Unknown";
}

export function getTierColor(tier: number): string {
  return TIER_COLORS[tier] ?? "#6B7280";
}

// ─── Match helpers ──────────────────────────────────────────────────────────

export function getPlayerFromMatch(
  match: HenrikMatch,
  name: string,
  tag: string
): HenrikPlayer | undefined {
  return match.players?.all_players?.find(
    (p) =>
      p.name.toLowerCase() === name.toLowerCase() &&
      p.tag.toLowerCase() === tag.toLowerCase()
  );
}

export function getMatchResult(
  match: HenrikMatch,
  player: HenrikPlayer
): "win" | "loss" | "draw" {
  const team = player.team.toLowerCase() as "red" | "blue";
  const teamData = match.teams[team];
  if (!teamData) return "draw";
  const opponentTeam = team === "red" ? "blue" : "red";
  const opponentData = match.teams[opponentTeam];
  if (teamData.rounds_won === opponentData.rounds_won) return "draw";
  return teamData.has_won ? "win" : "loss";
}

export function getMatchScore(
  match: HenrikMatch,
  player: HenrikPlayer
): { own: number; enemy: number } {
  const team = player.team.toLowerCase() as "red" | "blue";
  const opponentTeam = team === "red" ? "blue" : "red";
  return {
    own: match.teams[team]?.rounds_won ?? 0,
    enemy: match.teams[opponentTeam]?.rounds_won ?? 0,
  };
}

export function calcKD(kills: number, deaths: number): string {
  if (deaths === 0) return kills.toFixed(2);
  return (kills / deaths).toFixed(2);
}

export function calcACS(score: number, roundsPlayed: number): number {
  if (roundsPlayed === 0) return 0;
  return Math.round(score / roundsPlayed);
}

export function calcHSPercent(
  headshots: number,
  bodyshots: number,
  legshots: number
): number {
  const total = headshots + bodyshots + legshots;
  if (total === 0) return 0;
  return Math.round((headshots / total) * 100);
}

export function getRoundsPlayed(match: HenrikMatch): number {
  return (
    (match.teams.red?.rounds_won ?? 0) +
    (match.teams.blue?.rounds_won ?? 0)
  );
}

export function formatMatchDate(gameStart: number): string {
  const now = Date.now();
  const diff = now - gameStart * 1000;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(gameStart * 1000).toLocaleDateString();
}

export function formatGameLength(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const RANK_ICON_UUID = "03621f52-342b-cf4e-4f86-9350a49c6d04";
export function getRankIconUrl(tier: number): string {
  return `https://media.valorant-api.com/competitivetiers/${RANK_ICON_UUID}/${tier}/largeicon.png`;
}

// Map splash images from valorant-api.com
// Key = lowercase map name as returned by Henrik API
const MAP_SPLASH: Record<string, string> = {
  ascent:    "https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png",
  bind:      "https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/splash.png",
  breeze:    "https://media.valorant-api.com/maps/2fb9a4fd-47b8-4e7d-a969-74b4046ebd53/splash.png",
  fracture:  "https://media.valorant-api.com/maps/b529448b-4d60-346e-e89e-00a4c527a405/splash.png",
  haven:     "https://media.valorant-api.com/maps/2bee0dc9-4ffe-519b-1cbd-7fbe763a6047/splash.png",
  icebox:    "https://media.valorant-api.com/maps/e2ad5c54-4114-a870-9641-8ea21279579a/splash.png",
  lotus:     "https://media.valorant-api.com/maps/2fe4ed3a-450a-948b-6d6b-e89a78e680a9/splash.png",
  pearl:     "https://media.valorant-api.com/maps/fd267378-4d1d-484f-ff52-77821ed10dc2/splash.png",
  split:     "https://media.valorant-api.com/maps/d960549e-485c-e861-8d71-aa9d1aed12a2/splash.png",
  sunset:    "https://media.valorant-api.com/maps/92584fbe-486a-b1b2-9faa-39b0f486b498/splash.png",
  abyss:     "https://media.valorant-api.com/maps/224b0a95-48b9-f703-1bd8-67aca101a61f/splash.png",
};

export function getMapSplashUrl(mapName: string): string | undefined {
  return MAP_SPLASH[mapName.toLowerCase()];
}
