"use client";

import { useEffect, useRef, useState } from "react";
import {
  Download, LogOut, RotateCcw, Trash2, Upload,
} from "lucide-react";
import { useLibrary } from "@/lib/store";
import {
  persistence, storageReport, isSupabaseConfigured,
  type BackupMeta,
} from "@/lib/persistence";
import { getSupabase } from "@/lib/supabase/client";

export default function SettingsPage() {
  const { db, resetToDemo, clearAll, replaceAll } = useLibrary();
  const [message, setMessage] = useState<string | null>(null);
  const [storage, setStorage] = useState<{ used: number; quota: number | null } | null>(null);
  const [backups, setBackups] = useState<BackupMeta[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void storageReport(db).then(setStorage);
    void persistence.listBackups().then(setBackups);
  }, [db]);


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
          {isSupabaseConfigured
            ? "Your library is stored in your account and follows you between devices."
            : "Everything is kept in this browser. Nothing leaves this device."}
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
          title="Restore a whole library"
          body="Replaces everything with a previously exported file. Use “Add course files” to add without removing."
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
                    if (
                      !confirm(
                        "Restoring replaces your whole library. To add a course without removing anything, use “Add course files” instead. Continue?",
                      )
                    )
                      return;
                    replaceAll(parsed);
                    setMessage("Library restored from the file.");
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
          body="Restores the sample collections, courses and transcripts."
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
          body="Deletes every collection, course and lesson stored in this browser."
          action={
            <button
              className="btn-ghost text-brand-red hover:bg-brand-red/10"
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

      {isSupabaseConfigured && (
        <section className="card divide-y divide-hairline">
          <Row
            title="Sign out"
            body="Your library stays in your account."
            action={
              <button
                className="btn-ghost"
                onClick={async () => {
                  await getSupabase()?.auth.signOut();
                  window.location.reload();
                }}
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            }
          />
        </section>
      )}

      {backups.length > 0 && (
        <section className="card p-5">
          <p className="font-medium text-slate-900">Earlier versions</p>
          <p className="muted mt-0.5">
            Taken automatically whenever something was about to replace a
            larger library with a smaller one.
          </p>
          <ul className="mt-3 space-y-2">
            {backups.map((backup) => (
              <li
                key={backup.key}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-3.5 py-2.5"
              >
                <div>
                  <p className="text-[13px] font-medium text-slate-900">
                    {new Date(backup.savedAt).toLocaleString()}
                  </p>
                  <p className="text-[12px] text-slate-500">
                    {backup.courses} courses · {backup.lessons} lessons
                  </p>
                </div>
                <button
                  className="btn-ghost"
                  onClick={async () => {
                    const snapshot = await persistence.readBackup(backup.key);
                    if (!snapshot) {
                      setMessage("That version could not be read.");
                      return;
                    }
                    if (
                      !confirm(
                        `Restore ${backup.courses} courses and ${backup.lessons} lessons from ${new Date(backup.savedAt).toLocaleString()}? Your current library is saved as a version first.`,
                      )
                    )
                      return;
                    replaceAll(snapshot);
                    setMessage("Restored.");
                  }}
                >
                  Restore
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {message && (
        <p className="rounded-xl bg-slate-100 px-4 py-3 text-[13px] text-slate-700">
          {message}
        </p>
      )}


      <section className="card p-5">
        <p className="font-medium text-slate-900">What is stored</p>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-[13px] sm:grid-cols-4">
          {[
            ["Collections", db.faculties.length],
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
        {storage && (
          <p className="mt-3 text-[12px] text-slate-400">
            Using {formatBytes(storage.used)}
            {storage.quota
              ? ` of roughly ${formatBytes(storage.quota)} this browser allows`
              : ""}
            .{" "}
            {isSupabaseConfigured
              ? "Stored in your Supabase account."
              : "Stored in this browser (IndexedDB), so a library of many courses fits."}
          </p>
        )}
      </section>
    </div>
  );
}

/** First occurrence of each id wins, so what is already in the account is kept. */
function dedupe<T extends { id: string }>(items: T[]): T[] {
  const seen = new Map<string, T>();
  for (const item of items) if (!seen.has(item.id)) seen.set(item.id, item);
  return [...seen.values()];
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
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
