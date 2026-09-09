"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, GraduationCap, Plus } from "lucide-react";
import { useLibrary } from "@/lib/store";
import { CourseCard, FacultyCard, LessonRow } from "@/components/cards";
import { FacultyDialog } from "@/components/FacultyDialog";
import { LessonDialog } from "@/components/LessonDialog";
import { EmptyState } from "@/components/ui";

export default function DiscoverPage() {
  const { db } = useLibrary();
  const [facultyOpen, setFacultyOpen] = useState(false);
  const [lessonOpen, setLessonOpen] = useState(false);

  const faculties = [...db.faculties].sort((a, b) => a.order - b.order);
  const inProgress = db.lessons.filter((l) => l.status === "studying").slice(0, 4);
  const recent = [...db.lessons]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);
  const pinned = db.courses.filter((c) => c.favorite);

  if (db.faculties.length === 0) {
    return (
      <>
        <EmptyState
          icon={<GraduationCap className="size-5" />}
          title="Your university is empty"
          body="Start with a faculty — a field you keep coming back to. Courses and lessons live inside it."
          action={
            <button className="btn-primary" onClick={() => setFacultyOpen(true)}>
              <Plus className="size-4" />
              Create your first faculty
            </button>
          }
        />
        <FacultyDialog open={facultyOpen} onClose={() => setFacultyOpen(false)} />
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
            <h2 className="section-title">Faculties</h2>
            <p className="muted">Your fields of study.</p>
          </div>
          <button className="btn-quiet text-[13px]" onClick={() => setFacultyOpen(true)}>
            <Plus className="size-4" />
            New faculty
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {faculties.map((f) => (
            <FacultyCard key={f.id} faculty={f} />
          ))}
        </div>
      </section>

      {pinned.length > 0 && (
        <section>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="section-title">Pinned courses</h2>
              <p className="muted">The ones you keep open.</p>
            </div>
            <Link href="/library" className="btn-quiet text-[13px]">
              View all
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pinned.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </section>
      )}

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

      <FacultyDialog open={facultyOpen} onClose={() => setFacultyOpen(false)} />
      <LessonDialog open={lessonOpen} onClose={() => setLessonOpen(false)} />
    </div>
  );
}
