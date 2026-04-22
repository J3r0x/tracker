import { NextRequest, NextResponse } from "next/server";
import { getMatchHistory } from "@/lib/api/henrik";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string; tag: string }> }
) {
  const limited = rateLimit(req, { limit: 20, windowMs: 60_000 });
  if (limited) return limited;

  const { name, tag } = await params;
  const { searchParams } = req.nextUrl;

  const region = searchParams.get("region") ?? "na";
  const size = Number(searchParams.get("size") ?? "15");
  const filter = searchParams.get("filter") ?? "competitive";

  try {
    const matches = await getMatchHistory(name, tag, region, size, filter);
    return NextResponse.json({ matches });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("404") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
