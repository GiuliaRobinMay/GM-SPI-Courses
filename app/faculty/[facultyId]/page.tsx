"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { useLibrary } from "@/lib/store";
import { accent } from "@/lib/theme";
import { CourseCard } from "@/components/cards";
import { CourseDialog } from "@/components/CourseDialog";
import { FacultyDialog } from "@/components/FacultyDialog";
import { FacultyIcon } from "@/components/Icon";
import { EmptyState } from "@/components/ui";

export default function FacultyPage({
  params,
}: {
  params: Promise<{ facultyId: string }>;
}) {
  const { facultyId } = use(params);
  const router = useRouter();
  const { faculty, coursesOf, removeFaculty, db } = useLibrary();
  const [courseOpen, setCourseOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const fac = faculty(facultyId);
  if (!fac) {
    return (
      <EmptyState
        title="Faculty not found"
        body="It may have been deleted."
        action={
          <Link href="/" className="btn-ghost">
            Back to Discover
          </Link>
        }
      />
    );
  }

  const a = accent(fac.accent);
  const courses = coursesOf(fac.id);
  const lessonCount = db.lessons.filter((l) =>
    courses.some((c) => c.id === l.courseId),
  ).length;

  return (
    <div className="space-y-8">
      <Link href="/" className="btn-quiet -ml-2 w-fit text-[13px]">
        <ArrowLeft className="size-4" />
        Discover
      </Link>

      <header className="flex flex-wrap items-start gap-4">
        <span
          className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${a.soft} ${a.softText}`}
        >
          <FacultyIcon name={fac.icon} className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-slate-900">
            {fac.name}
          </h1>
          <p className="muted mt-1">
            {fac.description ? `${fac.description} · ` : ""}
            {courses.length} courses · {lessonCount} lessons
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Edit
          </button>
          <button
            className="btn-ghost text-rose-600 hover:bg-rose-50"
            onClick={() => {
              if (
                confirm(
                  `Delete "${fac.name}" and its ${courses.length} course(s) and ${lessonCount} lesson(s)? This cannot be undone.`,
                )
              ) {
                removeFaculty(fac.id);
                router.push("/");
              }
            }}
          >
            <Trash2 className="size-4" />
          </button>
          <button className="btn-primary" onClick={() => setCourseOpen(true)}>
            <Plus className="size-4" />
            New course
          </button>
        </div>
      </header>

      {courses.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No courses in this faculty yet"
          body="A course is one body of material — a YouTube series, a paid programme, or something you recorded yourself."
          action={
            <button className="btn-primary" onClick={() => setCourseOpen(true)}>
              <Plus className="size-4" />
              New course
            </button>
          }
        />
      )}

      <CourseDialog
        open={courseOpen}
        onClose={() => setCourseOpen(false)}
        facultyId={fac.id}
      />
      <FacultyDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        facultyId={fac.id}
      />
    </div>
  );
}
