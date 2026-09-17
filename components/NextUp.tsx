"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { useLibrary } from "@/lib/store";
import { accent } from "@/lib/theme";
import { FacultyIcon } from "./Icon";
import { PRIORITY_RANK } from "./PlanControls";
import type { Lesson } from "@/lib/types";

/**
 * The single next thing to watch.
 *
 * Walks the study plan in its own order and returns the first lesson still to
 * do — a lesson planned directly, or the first unfinished lesson of the first
 * course on the plan. One answer, not a list to choose from again.
 */
export function NextUp() {
  const { db, course, lessonsOf } = useLibrary();

  const planned = [
    ...db.courses.filter((c) => c.priority).map((c) => ({ kind: "course" as const, item: c })),
    ...db.lessons
      .filter((l) => l.priority && l.status !== "done")
      .map((l) => ({ kind: "lesson" as const, item: l })),
  ].sort((a, b) => {
    const left = a.item.planOrder ?? Number.MAX_SAFE_INTEGER;
    const right = b.item.planOrder ?? Number.MAX_SAFE_INTEGER;
    return (
      left - right ||
      PRIORITY_RANK[a.item.priority!] - PRIORITY_RANK[b.item.priority!]
    );
  });

  let next: Lesson | undefined;
  for (const entry of planned) {
    if (entry.kind === "lesson") {
      next = entry.item;
      break;
    }
    const pending = lessonsOf(entry.item.id).find((l) => l.status !== "done");
    if (pending) {
      next = pending;
      break;
    }
  }

  if (!next) return null;

  const parent = course(next.courseId);
  const tone = accent(parent?.accent);

  return (
    <Link
      href={`/lesson/${next.id}`}
      className="card card-hover group block overflow-hidden p-5"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
        Next up
      </p>
      <div className="mt-3 flex items-center gap-4">
        <span
          className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${tone.soft} ${tone.softText}`}
        >
          <FacultyIcon name={parent?.icon ?? "book"} className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[19px] font-semibold tracking-[-0.01em] text-slate-900">
            {next.title}
          </p>
          <p className="muted mt-0.5 truncate">
            {parent?.title}
            {next.section ? ` · ${next.section}` : ""}
            {next.durationMinutes ? ` · ${next.durationMinutes} min` : ""}
          </p>
        </div>
        <span className="btn-primary shrink-0">
          <Play className="size-4" />
          Start
          <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
