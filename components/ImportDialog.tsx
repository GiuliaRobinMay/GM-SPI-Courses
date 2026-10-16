"use client";

import { useRef, useState } from "react";
import { FileJson, Upload } from "lucide-react";
import { useLibrary } from "@/lib/store";
import { readPackages, type ImportReport } from "@/lib/importer";
import { Modal } from "./ui";

interface Line {
  ok: boolean;
  text: string;
}

/**
 * Bring in a scraped library.
 *
 * A file holds one course or a whole community's worth; either way the
 * import merges, so a second run updates in place rather than duplicating.
 * Files run large — a lesson carries its full transcript — so the work
 * happens one file at a time with its result reported as it lands.
 */
export function ImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { importPackages } = useLibrary();
  const input = useRef<HTMLInputElement>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [busy, setBusy] = useState(false);

  async function handle(files: File[]) {
    setBusy(true);
    setLines([]);

    for (const file of files) {
      const size = `${(file.size / 1e6).toFixed(1)} MB`;
      let parsed: unknown;
      try {
        parsed = JSON.parse(await file.text());
      } catch {
        setLines((l) => [...l, { ok: false, text: `${file.name}: not valid JSON.` }]);
        continue;
      }

      const read = readPackages(parsed);
      if ("error" in read) {
        setLines((l) => [...l, { ok: false, text: `${file.name}: ${read.error}` }]);
        continue;
      }

      const reports: ImportReport[] = importPackages(read.packages);
      const added = reports.reduce((n, r) => n + r.lessonsAdded, 0);
      const updated = reports.reduce((n, r) => n + r.lessonsUpdated, 0);
      const made = reports.filter((r) => r.courseCreated).length;

      setLines((l) => [
        ...l,
        {
          ok: true,
          text:
            `${file.name} (${size}) → ${reports[0]?.facultyName ?? "library"}: ` +
            `${reports.length} courses (${made} new), ` +
            `${added} lessons added${updated ? `, ${updated} updated` : ""}.`,
        },
      ]);
    }

    setBusy(false);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Import a library"
      description="A course file, or a whole community in one file. Nothing is removed, and importing again updates in place."
      footer={
        <button className="btn-ghost" onClick={onClose}>
          {lines.length > 0 ? "Done" : "Cancel"}
        </button>
      }
    >
      <button
        onClick={() => input.current?.click()}
        disabled={busy}
        className="flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-hairline bg-slate-50 px-6 py-10 transition hover:border-brand-violet/50 hover:bg-brand-violet/5 disabled:opacity-60"
      >
        <span className="flex size-11 items-center justify-center rounded-xl bg-brand-violet/10 text-brand-violet">
          <Upload className="size-5" />
        </span>
        <span className="font-medium text-slate-900">
          {busy ? "Importing…" : "Choose library files"}
        </span>
        <span className="muted">JSON. Large files are fine.</span>
      </button>

      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        multiple
        className="hidden"
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length) await handle(files);
        }}
      />

      {lines.length > 0 && (
        <ul className="mt-4 space-y-2">
          {lines.map((line, i) => (
            <li
              key={i}
              className={`flex gap-2 rounded-xl px-3.5 py-2.5 text-[13px] ${
                line.ok
                  ? "bg-brand-green/10 text-brand-green"
                  : "bg-brand-red/10 text-brand-red"
              }`}
            >
              <FileJson className="mt-0.5 size-4 shrink-0" />
              <span>{line.text}</span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
