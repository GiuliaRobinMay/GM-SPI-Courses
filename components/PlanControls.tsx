"use client";

import { CalendarDays, Flag } from "lucide-react";
import type { Priority } from "@/lib/types";

const LEVELS: { value: Priority; label: string; className: string }[] = [
  { value: "high", label: "High", className: "bg-rose-600 text-white" },
  { value: "normal", label: "Normal", className: "bg-slate-900 text-white" },
  { value: "low", label: "Low", className: "bg-slate-400 text-white" },
];

export const PRIORITY_STYLE: Record<Priority, { label: string; className: string }> = {
  high: { label: "High", className: "bg-rose-100 text-rose-700" },
  normal: { label: "Normal", className: "bg-slate-100 text-slate-600" },
  low: { label: "Low", className: "bg-slate-100 text-slate-400" },
};

/** Lower sorts first, so high priority floats to the top of the plan. */
export const PRIORITY_RANK: Record<Priority, number> = { high: 0, normal: 1, low: 2 };

/**
 * Put something on the study plan, or take it off.
 *
 * The same control sits on a course and on a lesson — a course is what you
 * plan before its lessons exist, a lesson once they do.
 */
export function PlanControls({
  priority,
  plannedFor,
  onPriority,
  onPlannedFor,
}: {
  priority?: Priority;
  plannedFor?: string;
  onPriority: (value: Priority | undefined) => void;
  onPlannedFor: (value: string | undefined) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-[12px] uppercase tracking-[0.06em] text-slate-400">
          <Flag className="size-3.5" />
          Priority
        </p>
        <div className="flex gap-1.5">
          {LEVELS.map((level) => (
            <button
              key={level.value}
              onClick={() =>
                onPriority(priority === level.value ? undefined : level.value)
              }
              className={`flex-1 rounded-xl px-2 py-2 text-[13px] font-medium transition ${
                priority === level.value
                  ? level.className
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[12px] text-slate-400">
          {priority
            ? "On your study plan. Click again to remove."
            : "Pick one to add it to your study plan."}
        </p>
      </div>

      <div>
        <p className="mb-1.5 flex items-center gap-1.5 text-[12px] uppercase tracking-[0.06em] text-slate-400">
          <CalendarDays className="size-3.5" />
          Planned for
        </p>
        <input
          type="date"
          className="field"
          value={plannedFor ?? ""}
          onChange={(e) => onPlannedFor(e.target.value || undefined)}
        />
      </div>
    </div>
  );
}
