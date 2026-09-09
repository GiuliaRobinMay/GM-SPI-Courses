"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Upload } from "lucide-react";
import { useLibrary } from "@/lib/store";
import { cleanCaptions, looksLikeCaptions, wordCount } from "@/lib/transcript";
import { estimateMinutes } from "@/lib/insights";
import type { SourceKind } from "@/lib/types";
import { CreatorPicker } from "./CreatorPicker";
import { Field, Modal } from "./ui";

const SOURCE_KINDS: { value: SourceKind; label: string }[] = [
  { value: "transcript", label: "Transcript" },
  { value: "video", label: "Video" },
  { value: "pdf", label: "PDF" },
  { value: "document", label: "Document" },
  { value: "article", label: "Article" },
  { value: "note", label: "My own note" },
];

const TEXT_EXTENSIONS = [".txt", ".md", ".markdown", ".vtt", ".srt"];

export function LessonDialog({
  open,
  onClose,
  courseId,
  lessonId,
}: {
  open: boolean;
  onClose: () => void;
  /** Pre-selected course when adding from inside one. */
  courseId?: string;
  /** When set, the dialog edits that lesson instead of creating one. */
  lessonId?: string;
}) {
  const router = useRouter();
  const { db, addLesson, updateLesson, lesson, lessonsOf } = useLibrary();
  const existing = lessonId ? lesson(lessonId) : undefined;
  const fileInput = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [course, setCourse] = useState(courseId ?? db.courses[0]?.id ?? "");
  const [creatorId, setCreatorId] = useState<string | undefined>(undefined);
  const [sourceKind, setSourceKind] = useState<SourceKind>("transcript");
  const [videoUrl, setVideoUrl] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [topics, setTopics] = useState("");
  const [transcript, setTranscript] = useState("");
  const [notes, setNotes] = useState("");
  const [fileName, setFileName] = useState<string | undefined>(undefined);
  const [fileWarning, setFileWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(existing?.title ?? "");
    setCourse(existing?.courseId ?? courseId ?? db.courses[0]?.id ?? "");
    setCreatorId(existing?.creatorId);
    setSourceKind(existing?.sourceKind ?? "transcript");
    setVideoUrl(existing?.videoUrl ?? "");
    setSourceUrl(existing?.sourceUrl ?? "");
    setTopics(existing?.topics.join(", ") ?? "");
    setTranscript(existing?.transcript ?? "");
    setNotes(existing?.notes ?? "");
    setFileName(existing?.sourceFileName);
    setFileWarning(null);
  }, [open, existing, courseId, db.courses]);

  async function handleFile(file: File) {
    setFileName(file.name);
    const lower = file.name.toLowerCase();
    const isText = TEXT_EXTENSIONS.some((ext) => lower.endsWith(ext));

    if (!isText) {
      // PDF / Word need a real parser — see README. Keep the provenance,
      // ask for the text.
      setFileWarning(
        `${file.name} is kept as the source name. Paste its text below — PDF and Word parsing lands with the backend.`,
      );
      if (lower.endsWith(".pdf")) setSourceKind("pdf");
      else if (lower.endsWith(".docx") || lower.endsWith(".doc")) setSourceKind("document");
      return;
    }

    const raw = await file.text();
    setTranscript(looksLikeCaptions(raw) ? cleanCaptions(raw) : raw.trim());
    setSourceKind("transcript");
    setFileWarning(null);
    if (!title.trim()) setTitle(file.name.replace(/\.[^.]+$/, ""));
  }

  function submit() {
    if (!title.trim() || !course) return;
    const payload = {
      title: title.trim(),
      courseId: course,
      creatorId,
      sourceKind,
      videoUrl: videoUrl.trim() || undefined,
      sourceUrl: sourceUrl.trim() || undefined,
      sourceFileName: fileName,
      transcript: transcript.trim(),
      notes: notes.trim() || undefined,
      topics: topics.split(",").map((t) => t.trim()).filter(Boolean),
    };

    if (existing) {
      updateLesson(existing.id, payload);
      onClose();
      return;
    }

    const created = addLesson({ ...payload, order: lessonsOf(course).length });
    onClose();
    router.push(`/lesson/${created.id}`);
  }

  const words = wordCount(transcript);

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={existing ? "Edit lesson" : "Add material"}
      description="Drop in a transcript, a video link, or both. Everything keeps its source."
      footer={
        <>
          <span className="mr-auto text-[12px] text-slate-400">
            {words > 0
              ? `${words.toLocaleString()} words · ~${estimateMinutes(transcript)} min`
              : "No transcript yet"}
          </span>
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={submit}
            disabled={!title.trim() || !course}
          >
            {existing ? "Save changes" : "Add lesson"}
          </button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Lesson title">
            <input
              autoFocus
              className="field"
              placeholder="Scoping an agent so it can't wander"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Course">
          <select
            className="field"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
          >
            {db.faculties.map((f) => (
              <optgroup key={f.id} label={f.name}>
                {db.courses
                  .filter((c) => c.facultyId === f.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </Field>

        <Field label="Creator" hint="Leave on “same as course” when it matches.">
          <CreatorPicker allowInherit value={creatorId} onChange={setCreatorId} />
        </Field>

        <Field label="Material type">
          <select
            className="field"
            value={sourceKind}
            onChange={(e) => setSourceKind(e.target.value as SourceKind)}
          >
            {SOURCE_KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Topics" hint="Comma separated.">
          <input
            className="field"
            placeholder="agents, scoping"
            value={topics}
            onChange={(e) => setTopics(e.target.value)}
          />
        </Field>

        <Field label="Video link" hint="YouTube, Loom, Vimeo — embedded in the player.">
          <input
            className="field"
            placeholder="https://youtube.com/watch?v=…"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
        </Field>

        <Field label="Original lesson link" hint="Back to where it lives.">
          <input
            className="field"
            placeholder="https://…"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
          />
        </Field>

        <div className="sm:col-span-2">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="label mb-0">Transcript or text</span>
            <button
              className="btn-quiet px-2 py-1 text-[13px]"
              onClick={() => fileInput.current?.click()}
            >
              <Upload className="size-3.5" />
              Upload file
            </button>
            <input
              ref={fileInput}
              type="file"
              accept=".txt,.md,.markdown,.vtt,.srt,.pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
                e.target.value = "";
              }}
            />
          </div>

          <textarea
            className="field min-h-[220px] resize-y font-[450] leading-relaxed"
            placeholder="Paste the transcript here. Subtitle files (.vtt / .srt) are cleaned up automatically on upload."
            value={transcript}
            onChange={(e) => {
              const next = e.target.value;
              setTranscript(looksLikeCaptions(next) ? cleanCaptions(next) : next);
            }}
          />

          {fileName && (
            <p className="mt-2 flex items-center gap-1.5 text-[12px] text-slate-500">
              <FileText className="size-3.5" />
              Source file: {fileName}
            </p>
          )}
          {fileWarning && (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
              {fileWarning}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <Field label="Your notes" hint="Kept separate from the source material.">
            <textarea
              className="field min-h-[70px] resize-y"
              placeholder="Why you saved this, what to try first…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
