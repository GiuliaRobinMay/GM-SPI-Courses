"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronRight, PanelLeft, PanelLeftClose, Plus, Settings } from "lucide-react";
import { useLibrary } from "@/lib/store";
import { accent } from "@/lib/theme";
import { CourseDialog } from "./CourseDialog";
import type { Course } from "@/lib/types";
import { FacultyIcon } from "./Icon";

/**
 * Studiolo at the top, every course in the middle, settings and you at the
 * bottom. The course list is the navigation — there is nothing above it.
 */
export function Sidebar() {
  const pathname = usePathname();
  const { db, lessonsOf } = useLibrary();
  const [collapsed, setCollapsed] = useState(false);
  const [dialogFor, setDialogFor] = useState<string | null>(null);
  const [shut, setShut] = useState<Set<string>>(loadShut);

  const you = db.creators.find((c) => c.isSelf);

  /**
   * Courses live in collections — SPI today, another community or your own
   * material tomorrow. Each collection collapses on its own, so a second
   * collection does not make the first one harder to use.
   */
  const collections = [...db.faculties]
    .sort((a, b) => a.order - b.order)
    .map((faculty) => ({
      faculty,
      courses: db.courses
        .filter((c) => c.facultyId === faculty.id)
        .sort((a, b) => a.title.localeCompare(b.title)),
    }))
    .filter((group) => group.courses.length > 0);

  const orphans = db.courses
    .filter((c) => !db.faculties.some((f) => f.id === c.facultyId))
    .sort((a, b) => a.title.localeCompare(b.title));

  function toggle(id: string) {
    setShut((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveShut(next);
      return next;
    });
  }

  return (
    <aside
      className={`sticky top-0 flex h-dvh shrink-0 flex-col border-r border-hairline bg-white transition-[width] ${
        collapsed ? "w-[68px]" : "w-[276px]"
      }`}
    >
      <div className="flex items-center gap-2 px-4 py-4">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-[13px] font-bold text-white">
            St
          </span>
          {!collapsed && (
            <span className="truncate text-[15px] font-semibold tracking-[-0.01em]">
              Studiolo
            </span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="btn-quiet ml-auto px-1.5"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-col gap-3 overflow-y-auto px-3 pb-4">
          {collections.map(({ faculty, courses }) => {
            const open = !shut.has(faculty.id);
            return (
              <div key={faculty.id}>
                {!collapsed && (
                  <div className="flex items-center gap-1 px-3 pb-1">
                    <button
                      onClick={() => toggle(faculty.id)}
                      className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg py-1 text-left"
                      aria-expanded={open}
                    >
                      <ChevronRight
                        className={`size-3.5 shrink-0 text-slate-400 transition-transform ${
                          open ? "rotate-90" : ""
                        }`}
                      />
                      <span className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                        {faculty.name}
                      </span>
                      <span className="text-[11px] tabular-nums text-slate-300">
                        {courses.length}
                      </span>
                    </button>
                    <button
                      onClick={() => setDialogFor(faculty.id)}
                      className="btn-quiet px-1 py-1"
                      aria-label={`New course in ${faculty.name}`}
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                )}

                {(open || collapsed) && (
                  <div className="flex flex-col gap-0.5">
                    {courses.map((course) => (
                      <CourseLink
                        key={course.id}
                        course={course}
                        collapsed={collapsed}
                        active={pathname === `/course/${course.id}`}
                        lessons={lessonsOf(course.id).length}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {orphans.length > 0 && (
            <div className="flex flex-col gap-0.5">
              {orphans.map((course) => (
                <CourseLink
                  key={course.id}
                  course={course}
                  collapsed={collapsed}
                  active={pathname === `/course/${course.id}`}
                  lessons={lessonsOf(course.id).length}
                />
              ))}
            </div>
          )}

          {collapsed && (
            <button
              onClick={() => setDialogFor(db.faculties[0]?.id ?? "")}
              className="mx-auto flex size-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-900"
              aria-label="New course"
            >
              <Plus className="size-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-auto border-t border-hairline px-3 py-3">
        <Link
          href="/settings"
          title={collapsed ? "Settings" : undefined}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            pathname.startsWith("/settings")
              ? "bg-slate-100 text-slate-900"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <Settings className="size-[18px] shrink-0" strokeWidth={1.8} />
          {!collapsed && <span>Settings</span>}
        </Link>

        <div className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[12px] font-semibold text-indigo-700">
            {(you?.name ?? "You").slice(0, 2)}
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-slate-900">
                {you?.name ?? "You"}
              </p>
              <p className="truncate text-[12px] text-slate-400">
                {db.lessons.length} lessons stored
              </p>
            </div>
          )}
        </div>
      </div>

      <CourseDialog
        open={dialogFor !== null}
        onClose={() => setDialogFor(null)}
        facultyId={dialogFor ?? undefined}
      />
    </aside>
  );
}

/** One course row in the sidebar. */
function CourseLink({
  course,
  collapsed,
  active,
  lessons,
}: {
  course: Course;
  collapsed: boolean;
  active: boolean;
  lessons: number;
}) {
  const tone = accent(course.accent);
  return (
    <Link
      href={`/course/${course.id}`}
      title={collapsed ? course.title : undefined}
      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
        active
          ? "bg-slate-100 font-medium text-slate-900"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <span
        className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${tone.soft} ${tone.softText}`}
      >
        <FacultyIcon name={course.icon ?? "book"} className="size-4" />
      </span>
      {!collapsed && (
        <>
          <span className="truncate">{course.title}</span>
          <span className="ml-auto text-[12px] tabular-nums text-slate-400">
            {lessons}
          </span>
        </>
      )}
    </Link>
  );
}

const SHUT_KEY = "studiolo.collapsed-collections";

/** Which collections are shut — a per-browser convenience, not library data. */
function loadShut(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(SHUT_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveShut(value: Set<string>) {
  try {
    window.localStorage.setItem(SHUT_KEY, JSON.stringify([...value]));
  } catch {
    // Private mode. The toggle still works for this session.
  }
}
