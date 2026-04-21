// API no oficial de Henrik — usada para MMR history y stats adicionales
// Documentación: https://docs.henrikdev.xyz/

const HENRIK_BASE = "https://api.henrikdev.xyz/valorant";

async function henrikFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${HENRIK_BASE}${path}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Henrik API error ${res.status}`);
  }

  const json = await res.json();
  return json.data as T;
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
  elo: number;
  name: string;
  tag: string;
}

export async function getPlayerMMR(
  name: string,
  tag: string,
  region = "na"
): Promise<PlayerMMR> {
  return henrikFetch<PlayerMMR>(
    `/v2/mmr/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`
  );
}
