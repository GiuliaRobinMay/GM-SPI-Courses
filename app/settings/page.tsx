"use client";

import { useRef, useState } from "react";
import { Download, RotateCcw, Trash2, Upload } from "lucide-react";
import { useLibrary } from "@/lib/store";

export default function SettingsPage() {
  const { db, resetToDemo, clearAll } = useLibrary();
  const [message, setMessage] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function exportJson() {
    const blob = new Blob([JSON.stringify(db, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `studiolo-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-slate-900">
          Settings
        </h1>
        <p className="muted mt-1">
          This template keeps everything in your browser. Nothing leaves this device.
        </p>
      </div>

      <section className="card divide-y divide-hairline">
        <Row
          title="Export your library"
          body="Download everything as JSON — the same shape the database will use."
          action={
            <button className="btn-ghost" onClick={exportJson}>
              <Download className="size-4" />
              Export
            </button>
          }
        />
        <Row
          title="Import a library"
          body="Replaces what is stored now with a previously exported file."
          action={
            <>
              <button className="btn-ghost" onClick={() => fileInput.current?.click()}>
                <Upload className="size-4" />
                Import
              </button>
              <input
                ref={fileInput}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  try {
                    const parsed = JSON.parse(await file.text());
                    if (typeof parsed?.version !== "number") throw new Error("bad file");
                    window.localStorage.setItem(
                      "studiolo.library.v1",
                      JSON.stringify(parsed),
                    );
                    window.location.reload();
                  } catch {
                    setMessage("That file could not be read as a Studiolo export.");
                  }
                }}
              />
            </>
          }
        />
        <Row
          title="Reset to the demo library"
          body="Restores the sample faculties, courses and transcripts."
          action={
            <button
              className="btn-ghost"
              onClick={() => {
                if (confirm("Replace everything with the demo library?")) {
                  resetToDemo();
                  setMessage("Demo library restored.");
                }
              }}
            >
              <RotateCcw className="size-4" />
              Reset
            </button>
          }
        />
        <Row
          title="Start empty"
          body="Deletes every faculty, course and lesson stored in this browser."
          action={
            <button
              className="btn-ghost text-rose-600 hover:bg-rose-50"
              onClick={() => {
                if (confirm("Delete everything? This cannot be undone.")) {
                  clearAll();
                  setMessage("Library cleared.");
                }
              }}
            >
              <Trash2 className="size-4" />
              Clear all
            </button>
          }
        />
      </section>

      {message && (
        <p className="rounded-xl bg-slate-100 px-4 py-3 text-[13px] text-slate-700">
          {message}
        </p>
      )}

      <section className="card p-5">
        <p className="font-medium text-slate-900">What is stored</p>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-[13px] sm:grid-cols-4">
          {[
            ["Faculties", db.faculties.length],
            ["Courses", db.courses.length],
            ["Lessons", db.lessons.length],
            ["Creators", db.creators.length],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-xl bg-slate-50 px-3 py-2.5">
              <dt className="text-slate-400">{label}</dt>
              <dd className="text-[18px] font-semibold tabular-nums text-slate-900">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

function Row({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-5">
      <div className="min-w-0">
        <p className="font-medium text-slate-900">{title}</p>
        <p className="muted mt-0.5">{body}</p>
      </div>
      <div className="flex shrink-0 gap-2">{action}</div>
    </div>
  );
}
