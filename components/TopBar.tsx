"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

export function TopBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");

  useEffect(() => {
    setQuery(params.get("q") ?? "");
  }, [params]);

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-hairline bg-canvas/85 px-6 py-3 backdrop-blur">
      <form
        className="relative ml-auto w-full max-w-sm"
        onSubmit={(e) => {
          e.preventDefault();
          router.push(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : "/search");
        }}
      >
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          className="field pl-10"
          placeholder="Search lessons, transcripts, creators…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>


    </header>
  );
}
