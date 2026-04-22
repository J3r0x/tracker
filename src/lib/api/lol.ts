// Riot Games Official API — League of Legends
// Docs: https://developer.riotgames.com/apis
// Key required: set RIOT_API_KEY in .env.local
// Dev keys expire every 24h — personal/production keys last longer

const RIOT_API_KEY = process.env.RIOT_API_KEY ?? "";

// ─── Region config ─────────────────────────────────────────────────────────────

export const LOL_REGIONS = [
  { value: "na",   label: "NA",   platform: "na1",   regional: "americas" },
  { value: "euw",  label: "EUW",  platform: "euw1",  regional: "europe"   },
  { value: "eune", label: "EUNE", platform: "eune1", regional: "europe"   },
  { value: "kr",   label: "KR",   platform: "kr",    regional: "asia"     },
  { value: "jp",   label: "JP",   platform: "jp1",   regional: "asia"     },
  { value: "br",   label: "BR",   platform: "br1",   regional: "americas" },
  { value: "lan",  label: "LAN",  platform: "la1",   regional: "americas" },
  { value: "las",  label: "LAS",  platform: "la2",   regional: "americas" },
  { value: "oce",  label: "OCE",  platform: "oc1",   regional: "sea"      },
  { value: "tr",   label: "TR",   platform: "tr1",   regional: "europe"   },
  { value: "ru",   label: "RU",   platform: "ru",    regional: "europe"   },
] as const;

export type LolRegion = (typeof LOL_REGIONS)[number]["value"];

function getRouting(region: string) {
  const found = LOL_REGIONS.find((r) => r.value === region.toLowerCase());
  if (!found) return { platform: "na1", regional: "americas" };
  return { platform: found.platform, regional: found.regional };
}

// ─── Base fetch ───────────────────────────────────────────────────────────────

async function lolFetch<T>(url: string): Promise<T> {
  if (!RIOT_API_KEY) throw new Error("RIOT_API_KEY is not configured");

  const res = await fetch(url, {
    headers: { "X-Riot-Token": RIOT_API_KEY },
    next: { revalidate: 60 },
  });

  if (res.status === 404) throw new Error("Player not found");
  if (res.status === 403) throw new Error("API key invalid or expired");
  if (res.status === 429) throw new Error("Rate limit exceeded — try again in a moment");

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { status?: { message?: string } };
    throw new Error(`Riot API ${res.status}: ${body?.status?.message ?? res.statusText}`);
  }

  return res.json() as Promise<T>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LolAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface LolSummoner {
  id?: string;         // absent on new Riot-ID-only accounts
  accountId?: string;
  puuid: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}

export interface LeagueEntry {
  leagueId: string;
  summonerId: string;
  queueType: "RANKED_SOLO_5x5" | "RANKED_FLEX_SR" | string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  hotStreak: boolean;
  veteran: boolean;
  freshBlood: boolean;
  inactive: boolean;
}

export interface MatchParticipant {
  puuid: string;
  riotIdGameName: string;
  riotIdTagline: string;
  summonerId: string;
  championId: number;
  championName: string;
  teamId: 100 | 200;
  kills: number;
  deaths: number;
  assists: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  goldEarned: number;
  goldSpent: number;
  totalDamageDealtToChampions: number;
  totalDamageTaken: number;
  damageSelfMitigated: number;
  totalHeal: number;
  totalHealsOnTeammates: number;
  timeCCingOthers: number;
  totalTimeSpentDead: number;
  visionScore: number;
  win: boolean;
  champLevel: number;
  summoner1Id: number;
  summoner2Id: number;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  individualPosition: string; // TOP | JUNGLE | MIDDLE | BOTTOM | UTILITY
  teamPosition: string;
  lane: string;
  role: string;
  pentaKills: number;
  quadraKills: number;
  tripleKills: number;
  doubleKills: number;
  largestMultiKill: number;
  largestKillingSpree: number;
  killingSprees: number;
  firstBloodKill: boolean;
  firstBloodAssist: boolean;
  turretKills: number;
  inhibitorKills: number;
  objectivesStolen: number;
  wardsPlaced: number;
  wardsKilled: number;
  controlWardsPlaced: number;
  challenges?: {
    killParticipation?: number;
    damagePerMinute?: number;
    goldPerMinute?: number;
    kda?: number;
    soloKills?: number;
    teamDamagePercentage?: number;
    visionScorePerMinute?: number;
  };
  perks: {
    statPerks: { defense: number; flex: number; offense: number };
    styles: {
      description: string;
      selections: { perk: number; var1: number; var2: number; var3: number }[];
      style: number;
    }[];
  };
}

export interface MatchTeam {
  teamId: 100 | 200;
  win: boolean;
  objectives: {
    baron:      { first: boolean; kills: number };
    dragon:     { first: boolean; kills: number };
    tower:      { first: boolean; kills: number };
    inhibitor:  { first: boolean; kills: number };
    riftHerald: { first: boolean; kills: number };
    champion:   { first: boolean; kills: number };
  };
  bans: { championId: number; pickTurn: number }[];
}

export interface LolMatch {
  metadata: { matchId: string; participants: string[] };
  info: {
    gameCreation: number;
    gameDuration: number;
    gameMode: string;
    queueId: number;
    participants: MatchParticipant[];
    teams: MatchTeam[];
  };
}

export interface LiveGameParticipant {
  summonerId: string;
  puuid: string;
  championId: number;
  teamId: 100 | 200;
  spell1Id: number;
  spell2Id: number;
  riotId: string;
}

export interface LiveGame {
  gameId: number;
  gameMode: string;
  gameQueueConfigId: number;
  gameStartTime: number;
  gameLength: number;
  participants: LiveGameParticipant[];
}

// ─── Data Dragon helpers ──────────────────────────────────────────────────────

/** Champion splash: https://ddragon.leagueoflegends.com/cdn/img/champion/splash/{name}_0.jpg */
export function getChampionSplash(name: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${name}_0.jpg`;
}

/** Champion square: used in scoreboard rows */
export function getChampionSquare(name: string, version = "15.8.1"): string {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${name}.png`;
}

/** Summoner icon */
export function getSummonerIconUrl(iconId: number, version = "15.8.1"): string {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${iconId}.png`;
}

/** Item icon */
export function getItemIconUrl(itemId: number, version = "15.8.1"): string {
  if (!itemId) return "";
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${itemId}.png`;
}

/** Summoner spell icon — spellId matches Data Dragon spell keys */
export function getSummonerSpellIcon(spellId: number, version = "15.8.1"): string {
  const SPELLS: Record<number, string> = {
    1: "SummonerBoost",       // Cleanse
    3: "SummonerExhaust",
    4: "SummonerFlash",
    6: "SummonerHaste",       // Ghost
    7: "SummonerHeal",
    11: "SummonerSmite",
    12: "SummonerTeleport",
    13: "SummonerMana",       // Clarity
    14: "SummonerDot",        // Ignite
    21: "SummonerBarrier",
    30: "SummonerPoroRecall",
    31: "SummonerPoroThrow",
    32: "SummonerSnowball",   // Mark (ARAM)
    39: "SummonerSnowURFSnowball_Mark",
    54: "Summoner_UltBookPlaceholder",
    55: "Summoner_UltBookSmitePlaceholder",
  };
  const key = SPELLS[spellId] ?? "SummonerFlash";
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${key}.png`;
}

/** Rank emblem from Community Dragon — tier lowercase */
export function getRankEmblemUrl(tier: string): string {
  return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-emblem/emblem-${tier.toLowerCase()}.png`;
}

// Tier display data
const TIER_ORDER = ["IRON","BRONZE","SILVER","GOLD","PLATINUM","EMERALD","DIAMOND","MASTER","GRANDMASTER","CHALLENGER"];

export function getTierColor(tier: string): string {
  switch (tier.toUpperCase()) {
    case "IRON":        return "#7d7d7d";
    case "BRONZE":      return "#b87333";
    case "SILVER":      return "#a8a8a8";
    case "GOLD":        return "#ffd700";
    case "PLATINUM":    return "#4cd8c4";
    case "EMERALD":     return "#4eab5d";
    case "DIAMOND":     return "#86a4f5";
    case "MASTER":      return "#dd88f0";
    case "GRANDMASTER": return "#ef4444";
    case "CHALLENGER":  return "#f0b94d";
    default:            return "#71717a";
  }
}

export function formatRank(tier: string, rank: string, lp: number): string {
  const apexTiers = ["MASTER","GRANDMASTER","CHALLENGER"];
  if (apexTiers.includes(tier.toUpperCase())) {
    return `${tier} ${lp} LP`;
  }
  return `${tier} ${rank} — ${lp} LP`;
}

export function getLpTotal(tier: string, rank: string, lp: number): number {
  const tierIdx = TIER_ORDER.indexOf(tier.toUpperCase());
  if (tierIdx < 0) return lp;
  const rankMap: Record<string, number> = { IV: 0, III: 100, II: 200, I: 300 };
  return tierIdx * 400 + (rankMap[rank] ?? 0) + lp;
}

// ─── Queue label map ──────────────────────────────────────────────────────────

export function getQueueLabel(queueId: number): string {
  const map: Record<number, string> = {
    420: "Ranked Solo",
    440: "Ranked Flex",
    400: "Normal Draft",
    430: "Normal Blind",
    450: "ARAM",
    490: "Quickplay",
    700: "Clash",
    900: "URF",
    1020: "One for All",
  };
  return map[queueId] ?? "Game";
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function getLolAccount(
  gameName: string,
  tagLine: string,
  region: string
): Promise<LolAccount> {
  const { regional } = getRouting(region);
  return lolFetch<LolAccount>(
    `https://${regional}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
  );
}

export async function getLolSummoner(
  puuid: string,
  region: string
): Promise<LolSummoner> {
  const { platform } = getRouting(region);
  return lolFetch<LolSummoner>(
    `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`
  );
}

export async function getLeagueEntries(
  puuid: string,
  region: string
): Promise<LeagueEntry[]> {
  const { platform } = getRouting(region);
  // Use the PUUID-based endpoint (works for all accounts, including new Riot-ID-only ones)
  return lolFetch<LeagueEntry[]>(
    `https://${platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${encodeURIComponent(puuid)}`
  );
}

export async function getLolMatchIds(
  puuid: string,
  region: string,
  options: { queue?: number; count?: number; start?: number } = {}
): Promise<string[]> {
  const { regional } = getRouting(region);
  const params = new URLSearchParams();
  if (options.queue !== undefined) params.set("queue", String(options.queue));
  params.set("count", String(options.count ?? 20));
  params.set("start", String(options.start ?? 0));
  return lolFetch<string[]>(
    `https://${regional}.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?${params}`
  );
}

export async function getLolMatch(matchId: string, region: string): Promise<LolMatch> {
  const { regional } = getRouting(region);
  return lolFetch<LolMatch>(
    `https://${regional}.api.riotgames.com/lol/match/v5/matches/${encodeURIComponent(matchId)}`
  );
}

export async function getLolLiveGame(
  puuid: string,
  region: string
): Promise<LiveGame | null> {
  const { platform } = getRouting(region);
  try {
    return await lolFetch<LiveGame>(
      `https://${platform}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${encodeURIComponent(puuid)}`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("not found") || msg.includes("404")) return null;
    throw err;
  }
}
