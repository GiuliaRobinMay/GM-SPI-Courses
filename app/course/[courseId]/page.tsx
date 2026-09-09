"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ExternalLink, Pencil, Plus, Star, Trash2,
} from "lucide-react";
import { useLibrary } from "@/lib/store";
import { accent } from "@/lib/theme";
import { LessonRow } from "@/components/cards";
import { CourseDialog } from "@/components/CourseDialog";
import { LessonDialog } from "@/components/LessonDialog";
import { FacultyIcon } from "@/components/Icon";
import { EmptyState, Progress, Tag } from "@/components/ui";
import type { LessonStatus } from "@/lib/types";

const FILTERS: { value: LessonStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "todo", label: "To study" },
  { value: "studying", label: "Studying" },
  { value: "done", label: "Done" },
];

export default function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const router = useRouter();
  const {
    course, faculty, creator, creatorName, lessonsOf, courseProgress,
    updateCourse, removeCourse,
  } = useLibrary();

  const [filter, setFilter] = useState<LessonStatus | "all">("all");
  const [lessonOpen, setLessonOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const item = course(courseId);
  if (!item) {
    return (
      <EmptyState
        title="Course not found"
        body="It may have been deleted."
        action={
          <Link href="/library" className="btn-ghost">
            Back to Library
          </Link>
        }
      />
    );
  }

  const a = accent(item.accent);
  const fac = faculty(item.facultyId);
  const author = creator(item.creatorId);
  const lessons = lessonsOf(item.id);
  const progress = courseProgress(item.id);
  const visible =
    filter === "all" ? lessons : lessons.filter((l) => l.status === filter);

  const counts = {
    all: lessons.length,
    todo: lessons.filter((l) => l.status === "todo").length,
    studying: lessons.filter((l) => l.status === "studying").length,
    done: lessons.filter((l) => l.status === "done").length,
  };

  return (
    <div className="space-y-7">
      {fac && (
        <Link href={`/faculty/${fac.id}`} className="btn-quiet -ml-2 w-fit text-[13px]">
          <ArrowLeft className="size-4" />
          {fac.name}
        </Link>
      )}

      <div className={`overflow-hidden rounded-2xl bg-gradient-to-br ${a.cover}`}>
        <div className="flex flex-wrap items-end justify-between gap-4 p-6 pt-16">
          <div className="min-w-0">
            {fac && (
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[12px] font-medium text-white backdrop-blur">
                <FacultyIcon name={fac.icon} className="size-3.5" />
                {fac.name}
              </span>
            )}
            <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.02em] text-white">
              {item.title}
            </h1>
            {item.subtitle && (
              <p className="mt-1 text-[14px] text-white/80">{item.subtitle}</p>
            )}
          </div>
          <button
            onClick={() => updateCourse(item.id, { favorite: !item.favorite })}
            className="rounded-xl bg-white/20 p-2.5 text-white backdrop-blur transition hover:bg-white/30"
            aria-label={item.favorite ? "Unpin course" : "Pin course"}
          >
            <Star className={`size-4 ${item.favorite ? "fill-white" : ""}`} />
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`chip ${filter === f.value ? "chip-active" : ""}`}
              >
                {f.label}
                <span className="tabular-nums opacity-60">{counts[f.value]}</span>
              </button>
            ))}
            <button
              className="btn-primary ml-auto"
              onClick={() => setLessonOpen(true)}
            >
              <Plus className="size-4" />
              Add material
            </button>
          </div>

          {visible.length > 0 ? (
            <div className="space-y-2">
              {visible.map((l) => (
                <LessonRow key={l.id} lesson={l} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={
                lessons.length === 0
                  ? "No lessons yet"
                  : "Nothing in this filter"
              }
              body={
                lessons.length === 0
                  ? "Paste a transcript, drop a subtitle file, or save a video link."
                  : undefined
              }
              action={
                lessons.length === 0 ? (
                  <button className="btn-primary" onClick={() => setLessonOpen(true)}>
                    <Plus className="size-4" />
                    Add material
                  </button>
                ) : undefined
              }
            />
          )}
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <p className="text-[13px] font-medium text-slate-900">Progress</p>
            <p className="muted mt-0.5">
              {progress.done} of {progress.total} lessons done
            </p>
            <div className="mt-3">
              <Progress done={progress.done} total={progress.total} />
            </div>
          </div>

          <div className="card space-y-3 p-5">
            <div>
              <p className="text-[12px] uppercase tracking-[0.06em] text-slate-400">
                Creator
              </p>
              <p className="mt-0.5 text-[14px] font-medium text-slate-900">
                {creatorName(item.creatorId)}
                {author?.isSelf && (
                  <span className="ml-1.5 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[11px] font-medium text-indigo-600">
                    yours
                  </span>
                )}
              </p>
              {author?.handle && (
                <p className="text-[12px] text-slate-400">{author.handle}</p>
              )}
            </div>

            {item.sourceUrl && (
              <div>
                <p className="text-[12px] uppercase tracking-[0.06em] text-slate-400">
                  Source
                </p>
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-0.5 inline-flex items-center gap-1.5 break-all text-[13px] text-indigo-600 hover:underline"
                >
                  Open original
                  <ExternalLink className="size-3.5 shrink-0" />
                </a>
              </div>
            )}

            {item.description && (
              <div>
                <p className="text-[12px] uppercase tracking-[0.06em] text-slate-400">
                  About
                </p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-slate-600">
                  {item.description}
                </p>
              </div>
            )}

            {item.topics.length > 0 && (
              <div>
                <p className="text-[12px] uppercase tracking-[0.06em] text-slate-400">
                  Topics
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {item.topics.map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button className="btn-ghost flex-1" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" />
              Edit
            </button>
            <button
              className="btn-ghost text-rose-600 hover:bg-rose-50"
              onClick={() => {
                if (
                  confirm(
                    `Delete "${item.title}" and its ${lessons.length} lesson(s)?`,
                  )
                ) {
                  removeCourse(item.id);
                  router.push(fac ? `/faculty/${fac.id}` : "/library");
                }
              }}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </aside>
      </div>

      <LessonDialog
        open={lessonOpen}
        onClose={() => setLessonOpen(false)}
        courseId={item.id}
      />
      <CourseDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        courseId={item.id}
      />
    </div>
  );
}
