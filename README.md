# Clutchly

A multi-game player stats tracker for Valorant and League of Legends. Search any player by Riot ID and instantly see their match history, ranked stats, performance trends, and live game status. No account required.

Available as a web app and as a native desktop app via Electron.

**Stack:** Next.js 16 · React 19 · TypeScript · Electron · Tailwind CSS · Framer Motion · Recharts · Zustand · TanStack Query

---

## Why I built this

Third-party trackers like OP.GG or Tracker.gg are great, but I wanted to understand how they actually work under the hood: how you coordinate two different APIs (official + unofficial), how you handle rate limits gracefully, and how you structure a Next.js app that needs to feel fast even when fetching a lot of data per page.

Clutchly is my take on that. It covers two games, 11 regions, and uses Server Components with Suspense streaming so nothing feels blocked while data loads.

---

## Technical highlights

- Used Next.js Server Components for all data fetching. Each section of a player profile streams in independently via Suspense boundaries, so the page renders progressively instead of waiting for every API call to finish
- Riot's official API does not expose MMR history for Valorant. I integrated Henrik's unofficial API alongside the official one to fill that gap, with a clean abstraction so the rest of the app doesn't care which source a piece of data comes from
- All Riot API calls are proxied through Next.js API routes instead of hitting Riot directly from the client. This keeps the API key server-side and allows centralized rate limiting (30 req/min per IP)
- Responses are cached with a 60-second `revalidate` window. Fresh enough to be useful, conservative enough to stay within development API key limits
- The Electron build wraps the standalone Next.js output with proper context isolation and a typed preload bridge. The renderer never has direct access to Node APIs

---

## What it tracks

| | Valorant | League of Legends |
|---|---|---|
| **Match history** | K/D/A, headshot %, damage delta, scoreboard position | Last 20 ranked games, CS/min, gold |
| **Rank tracking** | MMR history chart, rank progression | LP history chart, Solo and Flex standings |
| **Agent / Champion** | Winrates, games played per agent | KDA and mastery per champion |
| **Map stats** | Winrates and performance per map | n/a |
| **Live game** | n/a | Live game detection banner |
| **Insights** | Performance summary, best duos, recent form | n/a |
| **Regions** | Global (via Riot account API) | 11 regions: NA, EUW, EUNE, KR, JP, BR, LAN, LAS, OCE, TR, RU |

---

## Getting started

You need a Riot Games API key from the [Riot Developer Portal](https://developer.riotgames.com/).

```bash
npm install

# Add your keys (see Environment variables below)
cp .env.local.example .env.local

# Web
npm run dev

# Desktop (Electron)
npm run electron:dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Required | Notes |
|---|---|---|
| `RIOT_API_KEY` | Yes | From [developer.riotgames.com](https://developer.riotgames.com). Development keys expire every 24h |
| `HENRIK_API_KEY` | No | From [henrikdev.xyz](https://app.henrikdev.xyz). Optional. Unlocks higher rate limits for Valorant MMR data |

---

## Structure

```
src/
  app/
    page.tsx              Home / search
    player/[name]/        Valorant player profile
    lol/[name]/           LoL player profile
    api/                  Riot API proxy routes + rate limiting
  components/
    player/               Valorant UI (match card, MMR chart, agent stats, insights...)
    lol/                  LoL UI (match history, LP chart, champion stats, live banner...)
  lib/
    api/                  riot.ts · henrik.ts · lol.ts wrappers
    rate-limit.ts         In-memory IP-based rate limiter
electron/
  main.js                 Main process
  preload.js              Context isolation bridge
```
