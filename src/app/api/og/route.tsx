import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const name = searchParams.get("name") ?? "Unknown";
  const tag = searchParams.get("tag") ?? "0000";
  const rank = searchParams.get("rank") ?? "Unranked";
  const rr = searchParams.get("rr") ?? "0";
  const tier = searchParams.get("tier") ?? "0";
  const cardUrl = searchParams.get("card") ?? "";

  // Tier color map (matches getTierColor)
  const tierColors: Record<string, string> = {
    "3": "#2e9a41", "4": "#2e9a41", "5": "#2e9a41",
    "6": "#4cb87a", "7": "#4cb87a", "8": "#4cb87a",
    "9": "#4fb7d0", "10": "#4fb7d0", "11": "#4fb7d0",
    "12": "#3d7dca", "13": "#3d7dca", "14": "#3d7dca",
    "15": "#8b5cf6", "16": "#8b5cf6", "17": "#8b5cf6",
    "18": "#ef4444", "19": "#ef4444", "20": "#ef4444",
    "21": "#f97316", "22": "#f97316", "23": "#f97316",
    "24": "#eab308", "25": "#eab308", "26": "#eab308",
    "27": "#e2c15e",
  };
  const accentColor = tierColors[tier] ?? "#22d3ee";
  const rankIconUrl = `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${tier}/largeicon.png`;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#07080c",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          fontFamily: "sans-serif",
        }}
      >
        {/* Card art background */}
        {cardUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cardUrl}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.12,
            }}
          />
        )}

        {/* Gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(135deg, #07080c 0%, #07080c 50%, ${accentColor}18 100%)`,
          }}
        />

        {/* Rank glow */}
        <div
          style={{
            position: "absolute",
            right: -100,
            top: "50%",
            transform: "translateY(-50%)",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accentColor}22 0%, transparent 70%)`,
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            width: "100%",
            padding: "0 80px",
            gap: 60,
          }}
        >
          {/* Left: name + rank badge */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
            {/* Badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: `${accentColor}18`,
                border: `1px solid ${accentColor}30`,
                borderRadius: 100,
                padding: "6px 16px",
                width: "fit-content",
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#22d3ee",
                }}
              />
              <span
                style={{
                  color: "#22d3ee",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                }}
              >
                Clutchly · Valorant Tracker
              </span>
            </div>

            {/* Player name */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span
                style={{
                  color: "#ffffff",
                  fontSize: 72,
                  fontWeight: 900,
                  lineHeight: 1,
                  letterSpacing: "-2px",
                }}
              >
                {name}
              </span>
              <span
                style={{
                  color: "#52525b",
                  fontSize: 32,
                  fontWeight: 400,
                }}
              >
                #{tag}
              </span>
            </div>

            {/* Rank info */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
              <span
                style={{
                  color: accentColor,
                  fontSize: 28,
                  fontWeight: 800,
                }}
              >
                {rank}
              </span>
              <span style={{ color: "#3f3f46", fontSize: 20 }}>·</span>
              <span
                style={{
                  color: "#a1a1aa",
                  fontSize: 24,
                  fontFamily: "monospace",
                }}
              >
                {rr} RR
              </span>
            </div>
          </div>

          {/* Right: rank icon */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={rankIconUrl}
            style={{
              width: 180,
              height: 180,
              objectFit: "contain",
              filter: `drop-shadow(0 0 24px ${accentColor}50)`,
            }}
          />
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(to right, transparent, ${accentColor}, transparent)`,
          }}
        />
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
