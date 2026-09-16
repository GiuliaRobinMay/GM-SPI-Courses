"use client";

import Link from "next/link";
import { Clock, FileText, PlayCircle, Star, User } from "lucide-react";
import { useLibrary } from "@/lib/store";
import { accent } from "@/lib/theme";
import { youtubeId } from "@/lib/transcript";
import type { Course, Faculty, Lesson } from "@/lib/types";
import { FacultyIcon } from "./Icon";
import { Progress, StatusBadge, Tag } from "./ui";

export function FacultyCard({ faculty }: { faculty: Faculty }) {
  const { coursesOf, db } = useLibrary();
  const a = accent(faculty.accent);
  const courses = coursesOf(faculty.id);
  const lessons = db.lessons.filter((l) =>
    courses.some((c) => c.id === l.courseId),
  ).length;

  return (
    <Link href={`/faculty/${faculty.id}`} className="card card-hover block p-5">
      <span
        className={`flex size-10 items-center justify-center rounded-xl ${a.soft} ${a.softText}`}
      >
        <FacultyIcon name={faculty.icon} className="size-5" />
      </span>
      <p className="mt-3.5 font-semibold text-slate-900">{faculty.name}</p>
      {faculty.description && (
        <p className="muted mt-1 line-clamp-2">{faculty.description}</p>
      )}
      <p className="mt-3 text-[12px] text-slate-400">
        {courses.length} course{courses.length === 1 ? "" : "s"} · {lessons} lesson
        {lessons === 1 ? "" : "s"}
      </p>
    </Link>
  );
}

export function CourseCard({ course }: { course: Course }) {
  const { creatorName, courseProgress, faculty } = useLibrary();
  const a = accent(course.accent);
  const progress = courseProgress(course.id);
  const fac = faculty(course.facultyId);

  return (
    <Link href={`/course/${course.id}`} className="card card-hover group block overflow-hidden">
      <div
        className={`relative flex h-28 items-end bg-gradient-to-br ${a.cover} p-4`}
      >
        {fac && (
          <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[12px] font-medium text-white backdrop-blur">
            <FacultyIcon name={fac.icon} className="size-3.5" />
            {fac.name}
          </span>
        )}
        {course.favorite && (
          <Star className="absolute right-3 top-3 size-4 fill-white text-white" />
        )}
      </div>

      <div className="p-4">
        <p className="font-semibold leading-snug text-slate-900 group-hover:text-brand-violet">
          {course.title}
        </p>
        {course.subtitle && <p className="muted mt-1 line-clamp-2">{course.subtitle}</p>}

        <div className="mt-3 flex items-center gap-1.5 text-[12px] text-slate-500">
          <User className="size-3.5" />
          {creatorName(course.creatorId)}
          <span className="ml-auto tabular-nums">
            {progress.done}/{progress.total}
          </span>
        </div>
        <div className="mt-2">
          <Progress done={progress.done} total={progress.total} />
        </div>
      </div>
    </Link>
  );
}

export function LessonRow({ lesson }: { lesson: Lesson }) {
  const { course, creatorName } = useLibrary();
  const parent = course(lesson.courseId);
  const vid = youtubeId(lesson.videoUrl);
  const creator = lesson.creatorId ?? parent?.creatorId;

  return (
    <Link
      href={`/lesson/${lesson.id}`}
      className="card card-hover flex items-center gap-4 p-3"
    >
      <div className="relative flex h-14 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-slate-400">
        {vid ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://i.ytimg.com/vi/${vid}/mqdefault.jpg`}
            alt=""
            className="size-full object-cover"
          />
        ) : lesson.transcript ? (
          <FileText className="size-5" />
        ) : (
          <PlayCircle className="size-5" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-900">{lesson.title}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-slate-500">
          <span>{creatorName(creator)}</span>
          {parent && (
            <>
              <span className="text-slate-300">·</span>
              <span className="truncate">{parent.title}</span>
            </>
          )}
          {lesson.durationMinutes && (
            <>
              <span className="text-slate-300">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" />
                {lesson.durationMinutes} min
              </span>
            </>
          )}
        </p>
      </div>

      <div className="hidden shrink-0 items-center gap-2 sm:flex">
        {lesson.topics.slice(0, 2).map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
        <StatusBadge status={lesson.status} />
      </div>
    </Link>
  );
}
