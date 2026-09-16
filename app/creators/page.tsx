"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useLibrary } from "@/lib/store";
import { EmptyState } from "@/components/ui";

export default function CreatorsPage() {
  const { db } = useLibrary();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-slate-900">
          Creators
        </h1>
        <p className="muted mt-1">
          Who your material came from — yours and everyone else&apos;s.
        </p>
      </div>

      {db.creators.length === 0 ? (
        <EmptyState title="No creators yet" body="They are added as you file material." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {db.creators.map((c) => {
            const courses = db.courses.filter((co) => co.creatorId === c.id);
            const lessons = db.lessons.filter(
              (l) =>
                l.creatorId === c.id ||
                (!l.creatorId && courses.some((co) => co.id === l.courseId)),
            );
            return (
              <div key={c.id} className="card p-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[13px] font-semibold text-slate-600">
                    {c.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {c.name}
                      {c.isSelf && (
                        <span className="ml-1.5 rounded-md bg-brand-violet/10 px-1.5 py-0.5 text-[11px] font-medium text-brand-violet">
                          you
                        </span>
                      )}
                    </p>
                    {c.handle && (
                      <p className="truncate text-[12px] text-slate-400">{c.handle}</p>
                    )}
                  </div>
                </div>

                <p className="muted mt-3">
                  {courses.length} course{courses.length === 1 ? "" : "s"} ·{" "}
                  {lessons.length} lesson{lessons.length === 1 ? "" : "s"}
                </p>

                {courses.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {courses.slice(0, 3).map((co) => (
                      <li key={co.id}>
                        <Link
                          href={`/course/${co.id}`}
                          className="text-[13px] text-slate-600 hover:text-brand-violet"
                        >
                          {co.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                {c.url && (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-brand-violet hover:underline"
                  >
                    Visit
                    <ExternalLink className="size-3.5" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
