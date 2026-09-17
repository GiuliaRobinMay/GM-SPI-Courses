"use client";

import { useRouter } from "next/navigation";
import { CalendarDays, ChevronDown, ChevronUp, Clock, Flag } from "lucide-react";
import { useLibrary } from "@/lib/store";
import { accent } from "@/lib/theme";
import { FacultyIcon } from "./Icon";
import { PRIORITY_RANK, PRIORITY_STYLE } from "./PlanControls";
import { EmptyState, Progress } from "./ui";
import type { Priority } from "@/lib/types";

interface PlanItem {
  id: string;
  kind: "course" | "lesson";
  href: string;
  title: string;
  context: string;
  icon: string;
  tone: ReturnType<typeof accent>;
  priority: Priority;
  plannedFor?: string;
  planOrder?: number;
  /** Lessons in the course, or 1 for a single lesson. */
  total: number;
  done: number;
  /** Minutes of video across those lessons, when any are recorded. */
  minutes: number;
  /** True when at least one lesson carries a duration. */
  timed: boolean;
}

function formatDay(iso?: string): string | null {
  if (!iso) return null;
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatLength(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

const isOverdue = (iso?: string) =>
  Boolean(iso && iso < new Date().toISOString().slice(0, 10));

/**
 * Everything you have flagged, in the order you want to do it.
 *
 * A hand-set order wins when there is one; otherwise it falls back to
 * priority, then the planned day. Moving anything writes positions across the
 * whole list, so the two orderings never half-apply.
 */
export function StudyPlan() {
  const { db, course, lessonsOf, creatorName, reorderPlan } = useLibrary();
  const router = useRouter();

  const items: PlanItem[] = [
    ...db.courses
      .filter((c) => c.priority)
      .map((c) => {
        const lessons = lessonsOf(c.id);
        const minutes = lessons.reduce((sum, l) => sum + (l.durationMinutes ?? 0), 0);
        return {
          id: c.id,
          kind: "course" as const,
          href: `/course/${c.id}`,
          title: c.title,
          context: creatorName(c.creatorId),
          icon: c.icon ?? "book",
          tone: accent(c.accent),
          priority: c.priority!,
          plannedFor: c.plannedFor,
          planOrder: c.planOrder,
          total: lessons.length,
          done: lessons.filter((l) => l.status === "done").length,
          minutes,
          timed: lessons.some((l) => l.durationMinutes),
        };
      }),
    ...db.lessons
      .filter((l) => l.priority && l.status !== "done")
      .map((l) => {
        const parent = course(l.courseId);
        return {
          id: l.id,
          kind: "lesson" as const,
          href: `/lesson/${l.id}`,
          title: l.title,
          context: parent?.title ?? "Lesson",
          icon: parent?.icon ?? "book",
          tone: accent(parent?.accent),
          priority: l.priority!,
          plannedFor: l.plannedFor,
          planOrder: l.planOrder,
          total: 1,
          done: l.status === "done" ? 1 : 0,
          minutes: l.durationMinutes ?? 0,
          timed: Boolean(l.durationMinutes),
        };
      }),
  ].sort((a, b) => {
    // A hand-set position beats everything; unplaced items fall in after.
    const left = a.planOrder ?? Number.MAX_SAFE_INTEGER;
    const right = b.planOrder ?? Number.MAX_SAFE_INTEGER;
    if (left !== right) return left - right;
    return (
      PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
      (a.plannedFor ?? "9999").localeCompare(b.plannedFor ?? "9999") ||
      a.title.localeCompare(b.title)
    );
  });

  function move(index: number, delta: number) {
    const next = [...items];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    reorderPlan(next.map(({ id, kind }) => ({ id, kind })));
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Flag className="size-5" />}
        title="Nothing on your plan yet"
        body="Open a course and set its priority to put it here. Once a course has lessons, you can prioritise those too."
      />
    );
  }

  const totalLessons = items.reduce((sum, i) => sum + i.total, 0);
  const totalMinutes = items.reduce((sum, i) => sum + i.minutes, 0);

  return (
    <div className="space-y-2">
      <p className="muted pb-1">
        {items.length} on the plan · {totalLessons} lessons
        {totalMinutes > 0 && ` · about ${formatLength(totalMinutes)} of video`}
      </p>

      {items.map((item, index) => {
        const day = formatDay(item.plannedFor);
        const style = PRIORITY_STYLE[item.priority];
        const started = item.done > 0;
        return (
          <div key={item.id} className="card card-hover flex items-stretch gap-1 p-3.5">
            <div className="flex flex-col justify-center gap-0.5 pr-1">
              <button
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label={`Move ${item.title} up`}
                className="rounded-md p-0.5 text-slate-300 transition hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronUp className="size-4" />
              </button>
              <button
                onClick={() => move(index, 1)}
                disabled={index === items.length - 1}
                aria-label={`Move ${item.title} down`}
                className="rounded-md p-0.5 text-slate-300 transition hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronDown className="size-4" />
              </button>
            </div>

            <span className="w-6 shrink-0 self-center text-center text-[13px] font-semibold tabular-nums text-slate-400">
              {index + 1}
            </span>

            <button
              onClick={() => router.push(item.href)}
              className="flex min-w-0 flex-1 items-center gap-3.5 text-left"
            >
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${item.tone.soft} ${item.tone.softText}`}
              >
                <FacultyIcon name={item.icon} className="size-[18px]" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">{item.title}</p>

                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-slate-500">
                  <span className="truncate">{item.context}</span>
                  {item.kind === "course" && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span>
                        {item.total > 0
                          ? `${item.total} lesson${item.total === 1 ? "" : "s"}`
                          : "no lessons yet"}
                      </span>
                    </>
                  )}
                  {item.timed && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3" />
                        {formatLength(item.minutes)}
                      </span>
                    </>
                  )}
                </p>

                {item.kind === "course" && item.total > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="max-w-[180px] flex-1">
                      <Progress done={item.done} total={item.total} />
                    </div>
                    <span className="text-[11px] tabular-nums text-slate-400">
                      {started ? `${item.done}/${item.total}` : "not started"}
                    </span>
                  </div>
                )}
              </div>
            </button>

            <div className="flex shrink-0 items-center gap-2 self-center">
              {day && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium ${
                    isOverdue(item.plannedFor)
                      ? "bg-brand-orange/12 text-brand-orange"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <CalendarDays className="size-3" />
                  {day}
                </span>
              )}
              <span
                className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${style.className}`}
              >
                {style.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
