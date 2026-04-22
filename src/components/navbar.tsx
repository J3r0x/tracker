import Link from "next/link";
import { SearchBar } from "@/components/search-bar";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-[#07080c]/95 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <div className="w-7 h-7 rounded-md bg-[#C8AA6E]/10 border border-[#C8AA6E]/20 flex items-center justify-center transition-colors group-hover:bg-[#C8AA6E]/15">
            <svg className="w-3.5 h-3.5 text-[#C8AA6E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <span className="font-black text-lg tracking-tight">
            CLUTCH<span className="text-[#C8AA6E]">LY</span>
          </span>
        </Link>

        <div className="flex-1 max-w-sm">
          <SearchBar compact />
        </div>
      </div>
    </header>
  );
}
