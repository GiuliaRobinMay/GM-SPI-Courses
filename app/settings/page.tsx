"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FolderPlus, RotateCcw, Trash2, Upload } from "lucide-react";
import { useLibrary } from "@/lib/store";
import { storageReport } from "@/lib/persistence";
import { validatePackage, type ImportReport } from "@/lib/importer";
import type { CoursePackage } from "@/lib/types";

export default function SettingsPage() {
  const { db, resetToDemo, clearAll, importPackages, replaceAll } = useLibrary();
  const [message, setMessage] = useState<string | null>(null);
  const [reports, setReports] = useState<ImportReport[]>([]);
  const [storage, setStorage] = useState<{ used: number; quota: number | null } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const courseInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void storageReport(db).then(setStorage);
  }, [db]);

  /** Read a batch of course files, merging the valid ones and naming the rest. */
  async function importCourseFiles(files: File[]) {
    const packages: CoursePackage[] = [];
    const failures: ImportReport[] = [];

    for (const file of files) {
      try {
        const parsed = JSON.parse(await file.text());
        const problem = validatePackage(parsed);
        if (problem) {
          failures.push({
            ok: false,
            error: `${file.name}: ${problem}`,
            lessonsAdded: 0,
            lessonsUpdated: 0,
            courseCreated: false,
            facultyCreated: false,
          });
          continue;
        }
        packages.push(parsed as CoursePackage);
      } catch {
        failures.push({
          ok: false,
          error: `${file.name}: not valid JSON.`,
          lessonsAdded: 0,
          lessonsUpdated: 0,
          courseCreated: false,
          facultyCreated: false,
        });
      }
    }

    const merged = packages.length > 0 ? importPackages(packages) : [];
    setReports([...merged, ...failures]);
    setMessage(null);
  }

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
          title="Add course files"
          body="Merges one or more course files into your library. Nothing is removed, and re-importing a course updates it in place."
          action={
            <>
              <button className="btn-primary" onClick={() => courseInput.current?.click()}>
                <FolderPlus className="size-4" />
                Add courses
              </button>
              <input
                ref={courseInput}
                type="file"
                accept="application/json,.json"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const files = Array.from(e.target.files ?? []);
                  e.target.value = "";
                  if (files.length) await importCourseFiles(files);
                }}
              />
            </>
          }
        />
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
                    setReports([]);
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

      {reports.length > 0 && (
        <section className="card p-5">
          <p className="font-medium text-slate-900">Import results</p>
          <ul className="mt-3 space-y-2 text-[13px]">
            {reports.map((r, i) => (
              <li
                key={i}
                className={`rounded-xl px-3 py-2.5 ${
                  r.ok ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"
                }`}
              >
                {r.ok ? (
                  <>
                    <span className="font-medium">{r.courseTitle}</span>
                    {r.facultyName && (
                      <span className="text-emerald-700"> → {r.facultyName}</span>
                    )}
                    <span className="text-emerald-700">
                      {" · "}
                      {r.courseCreated ? "new course" : "updated"}
                      {r.lessonsAdded > 0 && `, ${r.lessonsAdded} lessons added`}
                      {r.lessonsUpdated > 0 && `, ${r.lessonsUpdated} updated`}
                    </span>
                  </>
                ) : (
                  r.error
                )}
              </li>
            ))}
          </ul>
        </section>
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
        {storage && (
          <p className="mt-3 text-[12px] text-slate-400">
            Using {formatBytes(storage.used)}
            {storage.quota
              ? ` of roughly ${formatBytes(storage.quota)} this browser allows`
              : ""}
            . Stored in IndexedDB, so a library of many courses fits.
          </p>
        )}
      </section>
    </div>
  );
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
