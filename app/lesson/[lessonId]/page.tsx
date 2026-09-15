"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, BookOpen, Check, Copy, ExternalLink, FileText, ListChecks,
  Pencil, PlayCircle, RefreshCw, Sparkles, Trash2, Wand2,
} from "lucide-react";
import { useLibrary } from "@/lib/store";
import { youtubeId, wordCount } from "@/lib/transcript";
import { LessonDialog } from "@/components/LessonDialog";
import { PlanControls } from "@/components/PlanControls";
import { EmptyState, Tag } from "@/components/ui";
import type { Lesson, LessonStatus } from "@/lib/types";

type Tab = "highlights" | "steps" | "lesson" | "transcript" | "notes";

const TABS: { value: Tab; label: string; icon: typeof Sparkles }[] = [
  { value: "highlights", label: "Highlights", icon: Sparkles },
  { value: "steps", label: "Step by step", icon: ListChecks },
  { value: "lesson", label: "Lesson text", icon: BookOpen },
  { value: "transcript", label: "Transcript", icon: FileText },
  { value: "notes", label: "My notes", icon: Pencil },
];

const STATUSES: { value: LessonStatus; label: string }[] = [
  { value: "todo", label: "To study" },
  { value: "studying", label: "Studying" },
  { value: "done", label: "Done" },
];

export default function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = use(params);
  const router = useRouter();
  const {
    lesson, course, faculty, creatorName, updateLesson, removeLesson,
    setLessonStatus, regenerateStudy,
  } = useLibrary();

  const [tab, setTab] = useState<Tab>("highlights");
  const [editOpen, setEditOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const item = lesson(lessonId);
  const parent = item ? course(item.courseId) : undefined;
  const fac = parent ? faculty(parent.facultyId) : undefined;

  useEffect(() => {
    setNotes(item?.notes ?? "");
    setChecked(new Set());
    // A post with written text and no transcript should open on that text,
    // not on an empty Highlights tab.
    if (item) setTab(availableTabs(item)[0]);
  }, [item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const vid = useMemo(() => youtubeId(item?.videoUrl), [item?.videoUrl]);

  if (!item) {
    return (
      <EmptyState
        title="Lesson not found"
        body="It may have been deleted."
        action={
          <Link href="/library" className="btn-ghost">
            Back to Library
          </Link>
        }
      />
    );
  }

  const study = item.study;

  function copy(text: string, key: string) {
    void navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1600);
  }

  return (
    <div className="space-y-6">
      {parent && (
        <Link href={`/course/${parent.id}`} className="btn-quiet -ml-2 w-fit text-[13px]">
          <ArrowLeft className="size-4" />
          {parent.title}
        </Link>
      )}

      <header className="space-y-3">
        <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.02em] text-slate-900">
          {item.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-slate-500">
          <span>{creatorName(item.creatorId ?? parent?.creatorId)}</span>
          {fac && (
            <>
              <span className="text-slate-300">·</span>
              <Link href={`/faculty/${fac.id}`} className="hover:text-slate-900">
                {fac.name}
              </Link>
            </>
          )}
          {item.durationMinutes && (
            <>
              <span className="text-slate-300">·</span>
              <span>{item.durationMinutes} min</span>
            </>
          )}
          {item.transcript && (
            <>
              <span className="text-slate-300">·</span>
              <span>{wordCount(item.transcript).toLocaleString()} words</span>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {item.topics.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="min-w-0 space-y-5">
          {vid ? (
            <div className="aspect-video overflow-hidden rounded-2xl border border-hairline bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${vid}`}
                title={item.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
                className="size-full"
              />
            </div>
          ) : item.videoUrl ? (
            <ExternalVideoCard url={item.videoUrl} />
          ) : null}

          <div className="flex flex-wrap items-center gap-2 border-b border-hairline pb-3">
            {TABS.filter((t) => availableTabs(item).includes(t.value)).map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`chip ${tab === t.value ? "chip-active" : ""}`}
              >
                <t.icon className="size-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          {!item.transcript && !item.content && tab !== "notes" && (
            <EmptyState
              icon={<Wand2 className="size-5" />}
              title="No transcript on this lesson yet"
              body="Highlights and steps are derived from the transcript. Paste it in and they appear straight away."
              action={
                <button className="btn-primary" onClick={() => setEditOpen(true)}>
                  Add a transcript
                </button>
              }
            />
          )}

          {item.transcript && tab === "highlights" && study && (
            <section className="space-y-4">
              <div className="card bg-gradient-to-br from-indigo-50 to-white p-5">
                <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-indigo-600">
                  <Sparkles className="size-3.5" />
                  In short
                </p>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-800">
                  {study.summary}
                </p>
              </div>

              <div className="card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-medium text-slate-900">Highlights</p>
                  <button
                    className="btn-quiet px-2 py-1 text-[13px]"
                    onClick={() =>
                      copy(
                        study.highlights.map((h) => `• ${h.text}`).join("\n"),
                        "highlights",
                      )
                    }
                  >
                    {copied === "highlights" ? (
                      <Check className="size-3.5" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    Copy
                  </button>
                </div>
                <ul className="space-y-3">
                  {study.highlights.map((h, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-indigo-500" />
                      <p className="text-[14px] leading-relaxed text-slate-700">
                        {h.text}
                      </p>
                    </li>
                  ))}
                  {study.highlights.length === 0 && (
                    <li className="muted">
                      Nothing stood out — the transcript may be very short.
                    </li>
                  )}
                </ul>
              </div>

              {(study.tools.length > 0 || study.terms.length > 0) && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {study.tools.length > 0 && (
                    <div className="card p-5">
                      <p className="font-medium text-slate-900">Tools mentioned</p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {study.tools.map((t) => (
                          <Tag key={t}>{t}</Tag>
                        ))}
                      </div>
                    </div>
                  )}
                  {study.terms.length > 0 && (
                    <div className="card p-5">
                      <p className="font-medium text-slate-900">Recurring terms</p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {study.terms.slice(0, 8).map((t) => (
                          <Tag key={t.term}>
                            {t.term} · {t.count}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {study.links.length > 0 && (
                <div className="card p-5">
                  <p className="font-medium text-slate-900">Links in the material</p>
                  <ul className="mt-2 space-y-1.5">
                    {study.links.map((l) => (
                      <li key={l}>
                        <a
                          href={l}
                          target="_blank"
                          rel="noreferrer"
                          className="break-all text-[13px] text-indigo-600 hover:underline"
                        >
                          {l}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {item.transcript && tab === "steps" && study && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">
                    Set it up, step by step
                  </p>
                  <p className="muted">
                    The instructions pulled out of this lesson, in order.
                  </p>
                </div>
                <button
                  className="btn-ghost"
                  onClick={() =>
                    copy(
                      study.steps.map((s) => `${s.index}. ${s.text}`).join("\n"),
                      "steps",
                    )
                  }
                >
                  {copied === "steps" ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                  Copy checklist
                </button>
              </div>

              {study.steps.length > 0 ? (
                <ol className="space-y-2">
                  {study.steps.map((s) => {
                    const done = checked.has(s.index);
                    return (
                      <li key={s.index}>
                        <button
                          onClick={() =>
                            setChecked((prev) => {
                              const next = new Set(prev);
                              next.has(s.index)
                                ? next.delete(s.index)
                                : next.add(s.index);
                              return next;
                            })
                          }
                          className={`card card-hover flex w-full gap-3.5 p-4 text-left ${
                            done ? "bg-slate-50" : ""
                          }`}
                        >
                          <span
                            className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${
                              done
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {done ? <Check className="size-3.5" /> : s.index}
                          </span>
                          <div className="min-w-0">
                            <p
                              className={`text-[14px] leading-relaxed ${
                                done
                                  ? "text-slate-400 line-through"
                                  : "text-slate-700"
                              }`}
                            >
                              {s.text}
                            </p>
                            {s.tools.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {s.tools.map((t) => (
                                  <Tag key={t}>{t}</Tag>
                                ))}
                              </div>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <EmptyState
                  title="No instructions found"
                  body="This lesson reads as explanation rather than a walkthrough. The highlights tab will be more useful."
                />
              )}
            </section>
          )}

          {tab === "lesson" && item.content && (
            <section className="card p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Lesson text</p>
                  <p className="muted mt-0.5">
                    The written material that came with the lesson.
                  </p>
                </div>
                <button
                  className="btn-quiet px-2 py-1 text-[13px]"
                  onClick={() => copy(item.content ?? "", "content")}
                >
                  {copied === "content" ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  Copy
                </button>
              </div>
              <div className="space-y-4">
                {item.content.split(/\n{2,}/).map((para, i) => (
                  <p
                    key={i}
                    className="whitespace-pre-line text-[14px] leading-[1.75] text-slate-700"
                  >
                    {para}
                  </p>
                ))}
              </div>
            </section>
          )}

          {item.transcript && tab === "transcript" && (
            <section className="card p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-medium text-slate-900">Full transcript</p>
                <button
                  className="btn-quiet px-2 py-1 text-[13px]"
                  onClick={() => copy(item.transcript, "transcript")}
                >
                  {copied === "transcript" ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  Copy
                </button>
              </div>
              <div className="space-y-4">
                {item.transcript.split(/\n{2,}/).map((para, i) => (
                  <p key={i} className="text-[14px] leading-[1.75] text-slate-700">
                    {para}
                  </p>
                ))}
              </div>
            </section>
          )}

          {tab === "notes" && (
            <section className="card p-5">
              <p className="font-medium text-slate-900">My notes</p>
              <p className="muted mt-0.5">
                Your thinking, kept apart from the source material.
              </p>
              <textarea
                className="field mt-3 min-h-[200px] resize-y leading-relaxed"
                placeholder="What you want to try, where this applies, what you disagree with…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => updateLesson(item.id, { notes })}
              />
              <p className="mt-2 text-[12px] text-slate-400">
                Saved when you click outside the box.
              </p>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <p className="text-[12px] uppercase tracking-[0.06em] text-slate-400">
              Status
            </p>
            <div className="mt-2 flex flex-col gap-1.5">
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setLessonStatus(item.id, s.value)}
                  className={`rounded-xl px-3 py-2 text-left text-[13px] font-medium transition ${
                    item.status === s.value
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <PlanControls
              priority={item.priority}
              plannedFor={item.plannedFor}
              onPriority={(priority) => updateLesson(item.id, { priority })}
              onPlannedFor={(plannedFor) => updateLesson(item.id, { plannedFor })}
            />
          </div>

          <div className="card space-y-3 p-5 text-[13px]">
            <p className="text-[12px] uppercase tracking-[0.06em] text-slate-400">
              Where this came from
            </p>
            <Row label="Creator" value={creatorName(item.creatorId ?? parent?.creatorId)} />
            {parent && (
              <div>
                <p className="text-slate-400">Course</p>
                <Link
                  href={`/course/${parent.id}`}
                  className="text-slate-900 hover:underline"
                >
                  {parent.title}
                </Link>
              </div>
            )}
            <Row label="Material" value={item.sourceKind} />
            {item.sourceFileName && <Row label="File" value={item.sourceFileName} />}
            {item.sourceUrl && (
              <div>
                <p className="text-slate-400">Original lesson</p>
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 break-all text-indigo-600 hover:underline"
                >
                  Open
                  <ExternalLink className="size-3 shrink-0" />
                </a>
              </div>
            )}
            {item.videoUrl && (
              <div>
                <p className="text-slate-400">Video</p>
                <a
                  href={item.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 break-all text-indigo-600 hover:underline"
                >
                  Open
                  <ExternalLink className="size-3 shrink-0" />
                </a>
              </div>
            )}
            <Row
              label="Added"
              value={new Date(item.createdAt).toLocaleDateString()}
            />
          </div>

          {item.transcript && (
            <button
              className="btn-ghost w-full"
              onClick={() => regenerateStudy(item.id)}
            >
              <RefreshCw className="size-4" />
              Regenerate study notes
            </button>
          )}

          <div className="flex gap-2">
            <button className="btn-ghost flex-1" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" />
              Edit
            </button>
            <button
              className="btn-ghost text-rose-600 hover:bg-rose-50"
              onClick={() => {
                if (confirm(`Delete "${item.title}"?`)) {
                  removeLesson(item.id);
                  router.push(parent ? `/course/${parent.id}` : "/library");
                }
              }}
            >
              <Trash2 className="size-4" />
            </button>
          </div>

          {study && (
            <p className="px-1 text-[11px] leading-relaxed text-slate-400">
              Study notes generated locally on{" "}
              {new Date(study.generatedAt).toLocaleDateString()} — no model call yet.
            </p>
          )}
        </aside>
      </div>

      <LessonDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        lessonId={item.id}
      />
    </div>
  );
}

/**
 * Which tabs this lesson can actually fill. Highlights, steps and the
 * transcript all need a transcript; the lesson text needs written material.
 * Notes are always offered.
 */
function availableTabs(lesson: Lesson): Tab[] {
  const tabs: Tab[] = [];
  if (lesson.transcript) tabs.push("highlights", "steps");
  if (lesson.content) tabs.push("lesson");
  if (lesson.transcript) tabs.push("transcript");
  tabs.push("notes");
  return tabs;
}

/**
 * Video that will not embed — a course platform that blocks framing, for
 * instance. Naming the host makes it obvious where the click goes.
 */
function ExternalVideoCard({ url }: { url: string }) {
  let host = "the original site";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    // A malformed URL still gets a working link, just a generic label.
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="card card-hover flex items-center gap-4 p-5"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        <PlayCircle className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="font-medium text-slate-900">Watch on {host}</p>
        <p className="muted mt-0.5">
          This video can&apos;t play inside Studiolo — your notes and transcript
          stay here while it opens in a new tab.
        </p>
      </div>
      <ExternalLink className="ml-auto size-4 shrink-0 text-slate-400" />
    </a>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-slate-400">{label}</p>
      <p className="text-slate-900">{value}</p>
    </div>
  );
}
