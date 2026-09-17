"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useLibrary } from "@/lib/store";
import { CourseCard } from "@/components/cards";
import { CourseDialog } from "@/components/CourseDialog";
import { EmptyState } from "@/components/ui";

export default function LibraryPage() {
  const { db } = useLibrary();
  const [facultyFilter, setFacultyFilter] = useState<string>("all");
  const [courseOpen, setCourseOpen] = useState(false);

  const courses =
    facultyFilter === "all"
      ? db.courses
      : db.courses.filter((c) => c.facultyId === facultyFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-slate-900">
            Library
          </h1>
          <p className="muted mt-1">Every course you keep, across all collections.</p>
        </div>
        <button className="btn-primary" onClick={() => setCourseOpen(true)}>
          <Plus className="size-4" />
          New course
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFacultyFilter("all")}
          className={`chip ${facultyFilter === "all" ? "chip-active" : ""}`}
        >
          All
          <span className="tabular-nums opacity-60">{db.courses.length}</span>
        </button>
        {db.faculties.map((f) => (
          <button
            key={f.id}
            onClick={() => setFacultyFilter(f.id)}
            className={`chip ${facultyFilter === f.id ? "chip-active" : ""}`}
          >
            {f.name}
            <span className="tabular-nums opacity-60">
              {db.courses.filter((c) => c.facultyId === f.id).length}
            </span>
          </button>
        ))}
      </div>

      {courses.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No courses here yet"
          body="Create one and start filing transcripts under it."
          action={
            <button className="btn-primary" onClick={() => setCourseOpen(true)}>
              <Plus className="size-4" />
              New course
            </button>
          }
        />
      )}

      <CourseDialog open={courseOpen} onClose={() => setCourseOpen(false)} />
    </div>
  );
}
