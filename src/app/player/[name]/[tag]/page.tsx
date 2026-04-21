import { notFound } from "next/navigation";
import { getAccountByRiotId } from "@/lib/api/riot";
import { getPlayerMMR } from "@/lib/api/henrik";

interface PageProps {
  params: Promise<{ name: string; tag: string }>;
}

export default async function PlayerPage({ params }: PageProps) {
  const { name, tag } = await params;
  const decodedName = decodeURIComponent(name);
  const decodedTag = decodeURIComponent(tag);

  let account;
  try {
    account = await getAccountByRiotId(decodedName, decodedTag);
  } catch {
    notFound();
  }

  let mmr = null;
  try {
    mmr = await getPlayerMMR(decodedName, decodedTag);
  } catch {
    // MMR no disponible, continuar sin él
  }

  return (
    <main className="min-h-screen p-8 max-w-5xl mx-auto">
      {/* Header del perfil */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-2xl font-bold text-red-500">
          {decodedName[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-3xl font-bold">
            {account.gameName}
            <span className="text-zinc-500 text-xl ml-1">#{account.tagLine}</span>
          </h1>
          {mmr && (
            <p className="text-zinc-400 mt-1">
              {mmr.currenttierpatched} · {mmr.ranking_in_tier} RR
            </p>
          )}
        </div>
      </div>

      {/* Placeholder para más secciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <h2 className="text-lg font-semibold mb-2">Match History</h2>
          <p className="text-zinc-500 text-sm">Coming soon...</p>
        </div>
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <h2 className="text-lg font-semibold mb-2">MMR History</h2>
          <p className="text-zinc-500 text-sm">Coming soon...</p>
        </div>
      </div>
    </main>
  );
}
