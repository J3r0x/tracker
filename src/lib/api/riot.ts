const RIOT_API_KEY = process.env.RIOT_API_KEY ?? "";

// Base URLs por región
const ACCOUNT_BASE = "https://americas.api.riotgames.com";
const VALORANT_BASE = (region: string) =>
  `https://${region}.api.riotgames.com`;

async function riotFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "X-Riot-Token": RIOT_API_KEY },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      `Riot API error ${res.status}: ${error?.status?.message ?? res.statusText}`
    );
  }

  return res.json() as Promise<T>;
}

export interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export async function getAccountByRiotId(
  gameName: string,
  tagLine: string
): Promise<RiotAccount> {
  const url = `${ACCOUNT_BASE}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  return riotFetch<RiotAccount>(url);
}

export interface MatchlistEntry {
  matchId: string;
}

export async function getMatchlist(
  puuid: string,
  region = "na",
  count = 10
): Promise<string[]> {
  const url = `${VALORANT_BASE(region)}/val/match/v1/matchlists/by-puuid/${puuid}?queue=competitive&size=${count}`;
  const data = await riotFetch<{ history: MatchlistEntry[] }>(url);
  return data.history.map((h) => h.matchId);
}

export interface MatchData {
  matchInfo: {
    matchId: string;
    queueId: string;
    gameStartMillis: number;
    gameLengthMillis: number;
    mapId: string;
  };
  players: Array<{
    puuid: string;
    gameName: string;
    tagLine: string;
    characterId: string;
    stats: {
      kills: number;
      deaths: number;
      assists: number;
      score: number;
      roundsPlayed: number;
    };
    teamId: string;
    competitiveTier: number;
  }>;
  teams: Array<{
    teamId: string;
    won: boolean;
    roundsPlayed: number;
    roundsWon: number;
  }>;
}

export async function getMatch(matchId: string, region = "na"): Promise<MatchData> {
  const url = `${VALORANT_BASE(region)}/val/match/v1/matches/${matchId}`;
  return riotFetch<MatchData>(url);
}
