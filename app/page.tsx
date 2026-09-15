"use client";

import { useState } from "react";
import { GraduationCap, Plus } from "lucide-react";
import { useLibrary } from "@/lib/store";
import { CourseCard, LessonRow } from "@/components/cards";
import { CourseDialog } from "@/components/CourseDialog";
import { LessonDialog } from "@/components/LessonDialog";
import { EmptyState } from "@/components/ui";
import type { Course } from "@/lib/types";

export default function DiscoverPage() {
  const { db } = useLibrary();
  const [courseOpen, setCourseOpen] = useState(false);
  const [lessonOpen, setLessonOpen] = useState(false);

  const inProgress = db.lessons.filter((l) => l.status === "studying").slice(0, 4);
  const recent = [...db.lessons]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);

  if (db.courses.length === 0) {
    return (
      <>
        <EmptyState
          icon={<GraduationCap className="size-5" />}
          title="No courses yet"
          body="A course is one body of material — an SPI course, a YouTube series, or something you recorded yourself."
          action={
            <button className="btn-primary" onClick={() => setCourseOpen(true)}>
              <Plus className="size-4" />
              Create your first course
            </button>
          }
        />
        <CourseDialog open={courseOpen} onClose={() => setCourseOpen(false)} />
      </>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-slate-900">
          Good to see you
        </h1>
        <p className="muted mt-1">
          {db.courses.length} courses · {db.lessons.length} lessons ·{" "}
          {db.lessons.filter((l) => l.status === "done").length} completed
        </p>
      </div>

      {inProgress.length > 0 && (
        <section>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="section-title">Pick up where you left off</h2>
              <p className="muted">Lessons you marked as studying.</p>
            </div>
          </div>
          <div className="space-y-2">
            {inProgress.map((l) => (
              <LessonRow key={l.id} lesson={l} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="section-title">Your courses</h2>
            <p className="muted">Grouped by where they sit in the path.</p>
          </div>
          <button className="btn-quiet text-[13px]" onClick={() => setCourseOpen(true)}>
            <Plus className="size-4" />
            New course
          </button>
        </div>
        <div className="space-y-7">
          {groupByTrack(db.courses).map((group) => (
            <div key={group.name}>
              <div className="mb-2.5 flex items-baseline gap-2">
                <h3 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                  {group.name}
                </h3>
                <span className="text-[12px] tabular-nums text-slate-400">
                  {group.courses.length}
                </span>
                <span className="h-px flex-1 bg-hairline" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.courses.map((c) => (
                  <CourseCard key={c.id} course={c} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>


      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="section-title">Recently added</h2>
            <p className="muted">The last material that came in.</p>
          </div>
          <button className="btn-quiet text-[13px]" onClick={() => setLessonOpen(true)}>
            <Plus className="size-4" />
            Add material
          </button>
        </div>
        {recent.length > 0 ? (
          <div className="space-y-2">
            {recent.map((l) => (
              <LessonRow key={l.id} lesson={l} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nothing stored yet"
            body="Paste a transcript or drop in a video link to get started."
            action={
              <button className="btn-primary" onClick={() => setLessonOpen(true)}>
                <Plus className="size-4" />
                Add material
              </button>
            }
          />
        )}
      </section>

      <CourseDialog open={courseOpen} onClose={() => setCourseOpen(false)} />
      <LessonDialog open={lessonOpen} onClose={() => setLessonOpen(false)} />
    </div>
  );
}

/** Courses arranged by the track they sit in; untracked ones collect last. */
function groupByTrack(courses: Course[]): { name: string; courses: Course[] }[] {
  const groups = new Map<string, { name: string; order: number; courses: Course[] }>();
  for (const course of courses) {
    const name = course.track?.trim() || "Courses";
    const order = course.track?.trim()
      ? (course.trackOrder ?? 500)
      : Number.MAX_SAFE_INTEGER;
    const group = groups.get(name);
    if (group) {
      group.courses.push(course);
      group.order = Math.min(group.order, order);
    } else {
      groups.set(name, { name, order, courses: [course] });
    }
  }
  return [...groups.values()]
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
    .map(({ name, courses }) => ({
      name,
      courses: [...courses].sort((a, b) => a.title.localeCompare(b.title)),
    }));
}
