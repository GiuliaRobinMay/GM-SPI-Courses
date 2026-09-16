"use client";

import { Suspense } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { useLibrary } from "@/lib/store";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { ready, loadError } = useLibrary();

  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Suspense fallback={<div className="h-[61px] border-b border-hairline" />}>
          <TopBar />
        </Suspense>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
          {loadError ? (
            <div className="card border-brand-red/30 bg-brand-red/5 p-6">
              <p className="font-semibold text-brand-red">
                Your library could not be opened
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-slate-700">
                Nothing has been changed or overwritten — the app stops rather
                than risk replacing your library with an empty one.
              </p>
              <p className="mt-2 text-[13px] text-slate-500">{loadError}</p>
              <button
                className="btn-primary mt-4"
                onClick={() => window.location.reload()}
              >
                Try again
              </button>
            </div>
          ) : ready ? (
            children
          ) : (
            <LoadingShell />
          )}
        </main>
      </div>
    </div>
  );
}

function LoadingShell() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-56 rounded-lg bg-slate-200/70" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-44 rounded-2xl bg-slate-200/50" />
        ))}
      </div>
    </div>
  );
}
