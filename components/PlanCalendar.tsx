"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useLibrary } from "@/lib/store";
import { accent } from "@/lib/theme";

interface Entry {
  id: string;
  href: string;
  title: string;
  tone: ReturnType<typeof accent>;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const iso = (date: Date) => date.toISOString().slice(0, 10);

/**
 * A month of the plan.
 *
 * Only things with a planned day appear — the study plan answers what is
 * next, this answers when. Weeks start on Monday, and days outside the month
 * are shown greyed rather than blank so the grid keeps its shape.
 */
export function PlanCalendar() {
  const { db, course } = useLibrary();
  const router = useRouter();
  const today = iso(new Date());
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const byDay = useMemo(() => {
    const map = new Map<string, Entry[]>();
    const add = (day: string, entry: Entry) => {
      map.set(day, [...(map.get(day) ?? []), entry]);
    };
    for (const c of db.courses) {
      if (!c.plannedFor) continue;
      add(c.plannedFor, {
        id: c.id,
        href: `/course/${c.id}`,
        title: c.title,
        tone: accent(c.accent),
      });
    }
    for (const l of db.lessons) {
      if (!l.plannedFor) continue;
      add(l.plannedFor, {
        id: l.id,
        href: `/lesson/${l.id}`,
        title: l.title,
        tone: accent(course(l.courseId)?.accent),
      });
    }
    return map;
  }, [db.courses, db.lessons, course]);

  // Monday-first grid covering the whole month.
  const days = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(first.getDate() - offset);
    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return date;
    });
  }, [cursor]);

  const shift = (months: number) =>
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + months, 1));

  const planned = [...byDay.values()].reduce((sum, list) => sum + list.length, 0);

  return (
    <section className="card overflow-hidden">
      <header className="flex items-center gap-3 border-b border-hairline px-5 py-3.5">
        <CalendarDays className="size-4 text-slate-500" />
        <h2 className="text-[15px] font-semibold text-slate-900">
          {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </h2>
        <span className="muted">
          {planned === 0 ? "nothing planned yet" : `${planned} planned`}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => shift(-1)} className="btn-quiet px-1.5" aria-label="Previous month">
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => setCursor(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
            className="btn-quiet px-2 py-1 text-[13px]"
          >
            Today
          </button>
          <button onClick={() => shift(1)} className="btn-quiet px-1.5" aria-label="Next month">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-7 border-b border-hairline">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((date) => {
          const key = iso(date);
          const outside = date.getMonth() !== cursor.getMonth();
          const entries = byDay.get(key) ?? [];
          return (
            <div
              key={key}
              className={`min-h-[86px] border-b border-r border-hairline p-1.5 last:border-r-0 ${
                outside ? "bg-slate-50/60" : ""
              }`}
            >
              <span
                className={`inline-flex size-6 items-center justify-center rounded-full text-[12px] tabular-nums ${
                  key === today
                    ? "bg-brand-violet font-semibold text-white"
                    : outside
                      ? "text-slate-300"
                      : "text-slate-500"
                }`}
              >
                {date.getDate()}
              </span>

              <div className="mt-1 space-y-1">
                {entries.slice(0, 3).map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => router.push(entry.href)}
                    title={entry.title}
                    className={`block w-full truncate rounded-md px-1.5 py-1 text-left text-[11px] font-medium transition hover:brightness-95 ${entry.tone.soft} ${entry.tone.softText}`}
                  >
                    {entry.title}
                  </button>
                ))}
                {entries.length > 3 && (
                  <p className="px-1.5 text-[11px] text-slate-400">
                    +{entries.length - 3} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
