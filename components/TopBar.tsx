"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { CourseDialog } from "./CourseDialog";
import { LessonDialog } from "./LessonDialog";

export function TopBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [lessonOpen, setLessonOpen] = useState(false);
  const [courseOpen, setCourseOpen] = useState(false);

  useEffect(() => {
    setQuery(params.get("q") ?? "");
  }, [params]);

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-hairline bg-canvas/85 px-6 py-3 backdrop-blur">
      <form
        className="relative mx-auto w-full max-w-md"
        onSubmit={(e) => {
          e.preventDefault();
          router.push(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : "/search");
        }}
      >
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          className="field pl-10"
          placeholder="Search lessons, transcripts, creators…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <button className="btn-ghost" onClick={() => setCourseOpen(true)}>
          New course
        </button>
        <button className="btn-primary" onClick={() => setLessonOpen(true)}>
          <Plus className="size-4" />
          Add material
        </button>
      </div>

      <LessonDialog open={lessonOpen} onClose={() => setLessonOpen(false)} />
      <CourseDialog open={courseOpen} onClose={() => setCourseOpen(false)} />
    </header>
  );
}
