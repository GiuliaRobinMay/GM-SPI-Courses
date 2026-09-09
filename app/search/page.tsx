"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLibrary } from "@/lib/store";
import { CourseCard, LessonRow } from "@/components/cards";
import { EmptyState } from "@/components/ui";

function Results() {
  const params = useSearchParams();
  const query = params.get("q") ?? "";
  const { search } = useLibrary();
  const { courses, lessons, faculties } = search(query);
  const total = courses.length + lessons.length + faculties.length;

  if (!query.trim()) {
    return (
      <EmptyState
        title="Search your university"
        body="Titles, topics, notes and the full text of every transcript you have stored."
      />
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-slate-900">
          {total} result{total === 1 ? "" : "s"} for “{query}”
        </h1>
      </div>

      {faculties.length > 0 && (
        <section>
          <h2 className="section-title mb-3">Faculties</h2>
          <div className="flex flex-wrap gap-2">
            {faculties.map((f) => (
              <Link key={f.id} href={`/faculty/${f.id}`} className="chip">
                {f.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {courses.length > 0 && (
        <section>
          <h2 className="section-title mb-3">Courses</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </section>
      )}

      {lessons.length > 0 && (
        <section>
          <h2 className="section-title mb-3">Lessons and transcripts</h2>
          <div className="space-y-2">
            {lessons.map((l) => (
              <LessonRow key={l.id} lesson={l} />
            ))}
          </div>
        </section>
      )}

      {total === 0 && (
        <EmptyState
          title="Nothing matched"
          body="Try a shorter phrase — transcripts are searched in full."
        />
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <Results />
    </Suspense>
  );
}
