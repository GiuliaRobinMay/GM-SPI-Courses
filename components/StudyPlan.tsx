"use client";

import Link from "next/link";
import { CalendarDays, Flag } from "lucide-react";
import { useLibrary } from "@/lib/store";
import { accent } from "@/lib/theme";
import { FacultyIcon } from "./Icon";
import { PRIORITY_RANK, PRIORITY_STYLE } from "./PlanControls";
import { EmptyState, StatusBadge } from "./ui";
import type { Priority } from "@/lib/types";

interface PlanItem {
  id: string;
  href: string;
  title: string;
  context: string;
  icon: string;
  tone: ReturnType<typeof accent>;
  priority: Priority;
  plannedFor?: string;
  status?: "todo" | "studying" | "done";
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

function isOverdue(iso?: string): boolean {
  if (!iso) return false;
  return iso < new Date().toISOString().slice(0, 10);
}

/**
 * Everything you have flagged, in the order you said you want it: highest
 * priority first, then by the day you planned it for.
 *
 * Courses and lessons sit in one list on purpose — a course is what you plan
 * before its lessons exist, a lesson once they do, and both are "the next
 * thing to work on".
 */
export function StudyPlan() {
  const { db, course, creatorName } = useLibrary();

  const items: PlanItem[] = [
    ...db.courses
      .filter((c) => c.priority)
      .map((c) => ({
        id: c.id,
        href: `/course/${c.id}`,
        title: c.title,
        context: creatorName(c.creatorId),
        icon: c.icon ?? "book",
        tone: accent(c.accent),
        priority: c.priority!,
        plannedFor: c.plannedFor,
      })),
    ...db.lessons
      .filter((l) => l.priority && l.status !== "done")
      .map((l) => {
        const parent = course(l.courseId);
        return {
          id: l.id,
          href: `/lesson/${l.id}`,
          title: l.title,
          context: parent?.title ?? "Lesson",
          icon: parent?.icon ?? "book",
          tone: accent(parent?.accent),
          priority: l.priority!,
          plannedFor: l.plannedFor,
          status: l.status,
        };
      }),
  ].sort(
    (a, b) =>
      PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
      (a.plannedFor ?? "9999").localeCompare(b.plannedFor ?? "9999") ||
      a.title.localeCompare(b.title),
  );

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Flag className="size-5" />}
        title="Nothing on your plan yet"
        body="Open a course and set its priority to put it here. Once a course has lessons, you can prioritise those too."
      />
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const day = formatDay(item.plannedFor);
        const late = isOverdue(item.plannedFor);
        const style = PRIORITY_STYLE[item.priority];
        return (
          <Link
            key={item.id}
            href={item.href}
            className="card card-hover flex items-center gap-3.5 p-3.5"
          >
            <span
              className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${item.tone.soft} ${item.tone.softText}`}
            >
              <FacultyIcon name={item.icon} className="size-[18px]" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-slate-900">{item.title}</p>
              <p className="truncate text-[12px] text-slate-500">{item.context}</p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {day && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium ${
                    late ? "bg-brand-orange/12 text-brand-orange" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <CalendarDays className="size-3" />
                  {day}
                </span>
              )}
              {item.status && <StatusBadge status={item.status} />}
              <span
                className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${style.className}`}
              >
                {style.label}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
