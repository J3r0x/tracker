import { NextRequest, NextResponse } from "next/server";
import {
  getHenrikAccount,
  getPlayerMMR,
  getMMRHistory,
} from "@/lib/api/henrik";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string; tag: string }> }
) {
  const limited = rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  const { name, tag } = await params;

  try {
    // 1. Buscar cuenta — devuelve región automáticamente
    const account = await getHenrikAccount(name, tag);
    const region = account.region.toLowerCase();

    // 2. MMR y MMR history en paralelo
    const [mmrResult, historyResult] = await Promise.allSettled([
      getPlayerMMR(name, tag, region),
      getMMRHistory(name, tag, region),
    ]);

    return NextResponse.json({
      account,
      region,
      mmr: mmrResult.status === "fulfilled" ? mmrResult.value : null,
      mmrHistory:
        historyResult.status === "fulfilled" ? historyResult.value : [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("404") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
