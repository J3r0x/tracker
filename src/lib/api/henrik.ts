// API no oficial de Henrik — usada para MMR history y stats adicionales
// Documentación: https://docs.henrikdev.xyz/
// API key gratis en: https://henrikdev.xyz/

const HENRIK_BASE = "https://api.henrikdev.xyz/valorant";
const HENRIK_API_KEY = process.env.HENRIK_API_KEY ?? "";

async function henrikFetch<T>(path: string): Promise<T> {
  const headers: HeadersInit = { "Accept": "application/json" };
  if (HENRIK_API_KEY) {
    headers["Authorization"] = HENRIK_API_KEY;
  }

  const res = await fetch(`${HENRIK_BASE}${path}`, {
    headers,
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      `Henrik API ${res.status}: ${body?.errors?.[0]?.message ?? res.statusText}`
    );
  }

  const json = await res.json();
  return json.data as T;
}

// ─── Match History ─────────────────────────────────────────────────────────

export interface HenrikPlayer {
  name: string;
  tag: string;
  team: "Red" | "Blue";
  character: string;
  currenttier: number;
  currenttier_patched: string;
  assets: {
    agent: {
      small: string;
      full: string;
      bust: string;
      killfeed: string;
    };
    card: {
      small: string;
      large: string;
      wide: string;
    };
  };
  stats: {
    score: number;
    kills: number;
    deaths: number;
    assists: number;
    headshots: number;
    bodyshots: number;
    legshots: number;
  };
  damage_made: number;
  damage_received: number;
}

export interface HenrikMatch {
  metadata: {
    matchid: string;
    map: string;
    game_length: number;
    game_start: number;
    mode: string;
    queue: { id: string; name: string };
    season: { id: string; short: string };
  };
  players: {
    all_players: HenrikPlayer[];
    red: HenrikPlayer[];
    blue: HenrikPlayer[];
  };
  teams: {
    red: { has_won: boolean; rounds_won: number; rounds_lost: number };
    blue: { has_won: boolean; rounds_won: number; rounds_lost: number };
  };
}

export async function getMatchHistory(
  name: string,
  tag: string,
  region = "na",
  size = 10,
  filter = "competitive"
): Promise<HenrikMatch[]> {
  return henrikFetch<HenrikMatch[]>(
    `/v3/matches/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?filter=${filter}&size=${size}`
  );
}

export interface MMRHistoryEntry {
  currenttier: number;
  currenttierpatched: string;
  ranking_in_tier: number;
  mmr_change_to_last_game: number;
  elo: number;
  date: string;
  date_raw: number;
}

export async function getMMRHistory(
  name: string,
  tag: string,
  region = "na"
): Promise<MMRHistoryEntry[]> {
  return henrikFetch<MMRHistoryEntry[]>(
    `/v1/mmr-history/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`
  );
}

export interface PlayerMMR {
  currenttier: number;
  currenttierpatched: string;
  ranking_in_tier: number;
  mmr_change_to_last_game: number;
  elo: number;
  name: string;
  tag: string;
  highest_rank?: {
    tier: number;
    patched_tier: string;
    season: string;
  };
}

// Estructura real de la API v2 — los datos de rango están bajo current_data
interface PlayerMMRRaw {
  name: string;
  tag: string;
  puuid: string;
  current_data: {
    currenttier: number;
    currenttierpatched: string;
    ranking_in_tier: number;
    mmr_change_to_last_game: number;
    elo: number;
    games_needed_for_rating: number;
    old: boolean;
  };
  highest_rank: {
    old: boolean;
    tier: number;
    patched_tier: string;
    season: string;
  };
}

export async function getPlayerMMR(
  name: string,
  tag: string,
  region = "na"
): Promise<PlayerMMR> {
  const raw = await henrikFetch<PlayerMMRRaw>(
    `/v2/mmr/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`
  );
  return {
    name: raw.name,
    tag: raw.tag,
    currenttier: raw.current_data.currenttier,
    currenttierpatched: raw.current_data.currenttierpatched,
    ranking_in_tier: raw.current_data.ranking_in_tier,
    mmr_change_to_last_game: raw.current_data.mmr_change_to_last_game,
    elo: raw.current_data.elo,
    highest_rank: raw.highest_rank,
  };
}

// ─── Account (auto-detect region) ─────────────────────────────────────────

export interface HenrikAccount {
  puuid: string;
  region: string;
  account_level: number;
  name: string;
  tag: string;
  card: {
    small: string;
    large: string;
    wide: string;
    id: string;
  };
  last_update_raw: number;
}

export async function getHenrikAccount(
  name: string,
  tag: string
): Promise<HenrikAccount> {
  return henrikFetch<HenrikAccount>(
    `/v1/account/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`
  );
}
