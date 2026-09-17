"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ChevronRight, FolderPlus, LayoutDashboard, PanelLeft, PanelLeftClose,
  ChevronDown, ChevronUp, Pencil, Plus, Settings,
} from "lucide-react";
import { useLibrary } from "@/lib/store";
import { accent } from "@/lib/theme";
import { CourseDialog } from "./CourseDialog";
import { FacultyDialog } from "./FacultyDialog";
import type { Course } from "@/lib/types";
import { FacultyIcon } from "./Icon";

/**
 * Studiolo at the top, every course in the middle, settings and you at the
 * bottom. The course list is the navigation — there is nothing above it.
 */
export function Sidebar() {
  const pathname = usePathname();
  const { db, reorderCollections, reorderCourses } = useLibrary();
  const [collapsed, setCollapsed] = useState(false);
  const [courseFor, setCourseFor] = useState<string | null>(null);
  const [facultyEdit, setFacultyEdit] = useState<string | null>(null);
  const [newCollection, setNewCollection] = useState(false);
  const [dragCourse, setDragCourse] = useState<{ faculty: string; index: number } | null>(null);
  const [shut, setShut] = useState<Set<string>>(loadShut);

  const you = db.creators.find((c) => c.isSelf);

  /**
   * Courses live in collections — SPI today, another community or your own
   * material tomorrow. Each collection collapses on its own, so a second
   * collection does not make the first one harder to use.
   */
  const collections = [...db.faculties]
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
    .map((faculty) => ({
      faculty,
      // A hand-set position wins; anything never moved falls back to title.
      courses: db.courses
        .filter((c) => c.facultyId === faculty.id)
        .sort(
          (a, b) =>
            (a.sortOrder ?? Number.MAX_SAFE_INTEGER) -
              (b.sortOrder ?? Number.MAX_SAFE_INTEGER) ||
            a.title.localeCompare(b.title),
        ),
    }));

  const orphans = db.courses
    .filter((c) => !db.faculties.some((f) => f.id === c.facultyId))
    .sort((a, b) => a.title.localeCompare(b.title));

  /** Drop a collection, or a course within its collection, at a new spot. */
  function move<T>(list: T[], from: number, to: number): T[] {
    const next = [...list];
    const [lifted] = next.splice(from, 1);
    next.splice(to, 0, lifted);
    return next;
  }

  function moveCollection(index: number, delta: number) {
    const to = index + delta;
    if (to < 0 || to >= collections.length) return;
    reorderCollections(move(collections, index, to).map((g) => g.faculty.id));
  }

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

      <nav className="px-3 pb-2">
        <Link
          href="/"
          title={collapsed ? "Dashboard" : undefined}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            pathname === "/"
              ? "bg-slate-100 text-slate-900"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <LayoutDashboard className="size-[18px] shrink-0" strokeWidth={1.8} />
          {!collapsed && <span>Dashboard</span>}
        </Link>
      </nav>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-col gap-3 overflow-y-auto px-3 pb-4">
          {collections.map(({ faculty, courses }, index) => {
            const open = !shut.has(faculty.id);
            return (
              <div key={faculty.id}>
                {!collapsed && (
                  <div className="group/head flex items-center gap-0.5 px-3 pb-1">
                    <span className="flex shrink-0 flex-col opacity-0 transition group-hover/head:opacity-100">
                      <button
                        onClick={() => moveCollection(index, -1)}
                        disabled={index === 0}
                        aria-label={`Move ${faculty.name} up`}
                        className="text-slate-400 hover:text-slate-900 disabled:opacity-25"
                      >
                        <ChevronUp className="size-3" />
                      </button>
                      <button
                        onClick={() => moveCollection(index, 1)}
                        disabled={index === collections.length - 1}
                        aria-label={`Move ${faculty.name} down`}
                        className="text-slate-400 hover:text-slate-900 disabled:opacity-25"
                      >
                        <ChevronDown className="size-3" />
                      </button>
                    </span>
                    <button
                      onClick={() => toggle(faculty.id)}
                      className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg py-1 text-left"
                      aria-expanded={open}
                    >
                      <ChevronRight
                        className={`size-3.5 shrink-0 text-slate-500 transition-transform ${
                          open ? "rotate-90" : ""
                        }`}
                      />
                      <span className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                        {faculty.name}
                      </span>
                      <span className="text-[11px] tabular-nums text-slate-400">
                        {courses.length}
                      </span>
                    </button>
                    <button
                      onClick={() => setFacultyEdit(faculty.id)}
                      className="btn-quiet px-1 py-1 opacity-0 transition group-hover/head:opacity-100"
                      aria-label={`Rename ${faculty.name}`}
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={() => setCourseFor(faculty.id)}
                      className="btn-quiet px-1 py-1"
                      aria-label={`New course in ${faculty.name}`}
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                )}

                {(open || collapsed) && (
                  <div className="flex flex-col gap-0.5">
                    {courses.map((course, courseIndex) => (
                      <div
                        key={course.id}
                        draggable={!collapsed}
                        onDragStart={(e) => {
                          e.stopPropagation();
                          setDragCourse({ faculty: faculty.id, index: courseIndex });
                        }}
                        onDragEnd={() => setDragCourse(null)}
                        onDragOver={(e) =>
                          dragCourse?.faculty === faculty.id && e.preventDefault()
                        }
                        onDrop={(e) => {
                          if (dragCourse?.faculty !== faculty.id) return;
                          e.preventDefault();
                          e.stopPropagation();
                          reorderCourses(
                            move(courses, dragCourse.index, courseIndex).map((c) => c.id),
                          );
                          setDragCourse(null);
                        }}
                        className={
                          dragCourse?.faculty === faculty.id &&
                          dragCourse.index === courseIndex
                            ? "opacity-40"
                            : undefined
                        }
                      >
                        <CourseLink
                          course={course}
                          collapsed={collapsed}
                          active={pathname === `/course/${course.id}`}
                        />
                      </div>
                    ))}

                    {!collapsed && courses.length === 0 && (
                      <button
                        onClick={() => setCourseFor(faculty.id)}
                        className="rounded-xl px-3 py-2 text-left text-[13px] text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
                      >
                        No courses yet — add one
                      </button>
                    )}
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
                />
              ))}
            </div>
          )}

          {collapsed ? (
            <button
              onClick={() => setCourseFor(db.faculties[0]?.id ?? "")}
              className="mx-auto flex size-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-900"
              aria-label="New course"
            >
              <Plus className="size-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-auto border-t border-hairline px-3 py-3">
        <div className="mb-1 flex flex-col gap-0.5">
          <button
            onClick={() => setNewCollection(true)}
            title={collapsed ? "New collection" : undefined}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <FolderPlus className="size-[18px] shrink-0" strokeWidth={1.8} />
            {!collapsed && <span>New collection</span>}
          </button>
        </div>

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
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[12px] font-semibold text-brand-violet">
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
        open={courseFor !== null}
        onClose={() => setCourseFor(null)}
        facultyId={courseFor ?? undefined}
      />
      <FacultyDialog
        open={facultyEdit !== null}
        onClose={() => setFacultyEdit(null)}
        facultyId={facultyEdit ?? undefined}
      />
      <FacultyDialog open={newCollection} onClose={() => setNewCollection(false)} />
    </aside>
  );
}

/** One course row in the sidebar. */
function CourseLink({
  course,
  collapsed,
  active,
}: {
  course: Course;
  collapsed: boolean;
  active: boolean;
}) {
  const tone = accent(course.accent);
  return (
    <Link
      href={`/course/${course.id}`}
      draggable={false}
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
      {!collapsed && <span className="truncate">{course.title}</span>}
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
