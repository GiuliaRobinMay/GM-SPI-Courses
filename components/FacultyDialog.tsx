"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLibrary } from "@/lib/store";
import { ACCENT_TOKENS, accent } from "@/lib/theme";
import type { AccentToken } from "@/lib/types";
import { FACULTY_ICON_NAMES, FacultyIcon } from "./Icon";
import { Field, Modal } from "./ui";

export function FacultyDialog({
  open,
  onClose,
  facultyId,
}: {
  open: boolean;
  onClose: () => void;
  /** When set, the dialog edits that faculty instead of creating one. */
  facultyId?: string;
}) {
  const router = useRouter();
  const { addFaculty, updateFaculty, faculty, db } = useLibrary();
  const existing = facultyId ? faculty(facultyId) : undefined;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("book");
  const [tone, setTone] = useState<AccentToken>("violet");

  useEffect(() => {
    if (!open) return;
    setName(existing?.name ?? "");
    setDescription(existing?.description ?? "");
    setIcon(existing?.icon ?? "book");
    setTone(existing?.accent ?? "violet");
  }, [open, existing]);

  function submit() {
    if (!name.trim()) return;
    if (existing) {
      updateFaculty(existing.id, { name: name.trim(), description, icon, accent: tone });
      onClose();
      return;
    }
    const created = addFaculty({
      name: name.trim(),
      description,
      icon,
      accent: tone,
      order: db.faculties.length,
    });
    onClose();
    router.push(`/faculty/${created.id}`);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? "Edit collection" : "New collection"}
      description="A collection groups courses in your sidebar — SPI courses, resources, anything else."
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={submit} disabled={!name.trim()}>
            {existing ? "Save changes" : "Create collection"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Name">
          <input
            autoFocus
            className="field"
            placeholder="SPI courses"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </Field>

        <Field label="Description" hint="Optional — what belongs in here.">
          <input
            className="field"
            placeholder="Courses from the SPI community."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        <div>
          <span className="label">Icon</span>
          <div className="grid grid-cols-8 gap-1.5">
            {FACULTY_ICON_NAMES.map((n) => (
              <button
                key={n}
                onClick={() => setIcon(n)}
                aria-label={n}
                className={`flex aspect-square items-center justify-center rounded-lg border transition ${
                  icon === n
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-hairline text-slate-500 hover:border-slate-300"
                }`}
              >
                <FacultyIcon name={n} className="size-4" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="label">Colour</span>
          <div className="flex gap-2">
            {ACCENT_TOKENS.map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                aria-label={t}
                className={`size-8 rounded-full ${accent(t).solid} ${
                  tone === t ? "ring-2 ring-slate-900 ring-offset-2" : "opacity-70"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
