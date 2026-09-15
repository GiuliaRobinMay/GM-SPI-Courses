/**
 * Merging course files into an existing library.
 *
 * The rule that matters: an import ADDS, it never wipes. Re-importing the
 * same course updates it in place rather than creating a duplicate, so a
 * course can be re-pulled after its transcripts are filled in.
 *
 * Identity is `externalId` — the id the source platform uses. When a file
 * has none, the course is matched on title within the same faculty, and a
 * lesson on title within the same course.
 *
 * See docs/import-format.md for the file format.
 */

import type { Course, CoursePackage, Database, Faculty, Lesson } from "./types";
import { analyzeTranscript, estimateMinutes } from "./insights";

export interface ImportReport {
  ok: boolean;
  /** Set when the file could not be used at all. */
  error?: string;
  courseTitle?: string;
  facultyName?: string;
  lessonsAdded: number;
  lessonsUpdated: number;
  courseCreated: boolean;
  facultyCreated: boolean;
}

function id(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function stamp(): string {
  return new Date().toISOString();
}

function norm(text: string): string {
  return text.trim().toLowerCase();
}

/**
 * A stable id built from the source platform's own id.
 *
 * Ids end up in the URL (/course/<id>), so anything outside the unreserved
 * set is folded to a dash — a colon or slash here would break the route.
 */
function stableId(prefix: string, externalId: string): string {
  const safe = externalId.trim().replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return safe ? `${prefix}-ext-${safe}` : id(prefix);
}

/**
 * Validate an unknown parsed JSON value as a course package.
 * Returns the reason it is unusable, or null when it is fine.
 */
export function validatePackage(value: unknown): string | null {
  if (typeof value !== "object" || value === null) return "The file is not a JSON object.";
  const pkg = value as Partial<CoursePackage>;
  if (pkg.format !== "studiolo.course") {
    return 'Missing `"format": "studiolo.course"` — this does not look like a course file.';
  }
  if (pkg.version !== 1) return `Unsupported version: ${String(pkg.version)}. This app reads version 1.`;
  if (!pkg.course || typeof pkg.course.title !== "string" || !pkg.course.title.trim()) {
    return "The course needs a title.";
  }
  if (!Array.isArray(pkg.lessons)) return "`lessons` must be an array (it may be empty).";
  for (const [i, lesson] of pkg.lessons.entries()) {
    if (typeof lesson?.title !== "string" || !lesson.title.trim()) {
      return `Lesson ${i + 1} has no title.`;
    }
  }
  return null;
}

/**
 * Merge one package into a database, returning the new database and a report.
 * Pure: the input database is not modified.
 */
export function mergePackage(
  db: Database,
  pkg: CoursePackage,
): { db: Database; report: ImportReport } {
  const report: ImportReport = {
    ok: true,
    courseTitle: pkg.course.title,
    facultyName: pkg.faculty?.name,
    lessonsAdded: 0,
    lessonsUpdated: 0,
    courseCreated: false,
    facultyCreated: false,
  };

  const faculties = [...db.faculties];
  const creators = [...db.creators];
  const courses = [...db.courses];
  const lessons = [...db.lessons];

  /* -- faculty: matched by name, created when missing -------------------- */
  let faculty: Faculty | undefined;
  if (pkg.faculty?.name) {
    faculty = faculties.find((f) => norm(f.name) === norm(pkg.faculty!.name));
    if (!faculty) {
      faculty = {
        id: id("fa"),
        name: pkg.faculty.name,
        icon: pkg.faculty.icon ?? "cap",
        accent: pkg.faculty.accent ?? "indigo",
        description: pkg.faculty.description,
        order: faculties.length,
      };
      faculties.push(faculty);
      report.facultyCreated = true;
    }
  }
  faculty ??= faculties[0];
  if (!faculty) {
    // An empty library with no faculty named in the file: make somewhere to put it.
    faculty = { id: id("fa"), name: "Imported", icon: "cap", accent: "indigo", order: 0 };
    faculties.push(faculty);
    report.facultyCreated = true;
  }
  report.facultyName = faculty.name;

  /* -- creator: matched by name ------------------------------------------ */
  let creatorId = creators.find((c) => c.isSelf)?.id ?? "cr-self";
  if (pkg.creator?.name) {
    const existing = creators.find((c) => norm(c.name) === norm(pkg.creator!.name));
    if (existing) {
      creatorId = existing.id;
    } else {
      const created = {
        id: id("cr"),
        name: pkg.creator.name,
        handle: pkg.creator.handle,
        url: pkg.creator.url,
      };
      creators.push(created);
      creatorId = created.id;
    }
  }

  /* -- course: matched on externalId, else title within the faculty ------ */
  const externalCourseId = pkg.course.externalId
    ? stableId("co", pkg.course.externalId)
    : undefined;

  let course = courses.find(
    (c) =>
      (externalCourseId && c.id === externalCourseId) ||
      (c.facultyId === faculty!.id && norm(c.title) === norm(pkg.course.title)),
  );

  if (course) {
    const updated: Course = {
      ...course,
      subtitle: pkg.course.subtitle ?? course.subtitle,
      description: pkg.course.description ?? course.description,
      sourceUrl: pkg.course.sourceUrl ?? course.sourceUrl,
      topics: pkg.course.topics ?? course.topics,
      track: pkg.course.track ?? course.track,
      trackOrder: pkg.course.trackOrder ?? course.trackOrder,
      updatedAt: stamp(),
    };
    courses[courses.indexOf(course)] = updated;
    course = updated;
  } else {
    course = {
      id: externalCourseId ?? id("co"),
      facultyId: faculty.id,
      title: pkg.course.title,
      subtitle: pkg.course.subtitle,
      description: pkg.course.description,
      creatorId,
      sourceUrl: pkg.course.sourceUrl,
      topics: pkg.course.topics ?? [],
      accent: pkg.course.accent ?? faculty.accent,
      track: pkg.course.track,
      trackOrder: pkg.course.trackOrder,
      createdAt: stamp(),
      updatedAt: stamp(),
    };
    courses.push(course);
    report.courseCreated = true;
  }

  /* -- lessons ----------------------------------------------------------- */
  pkg.lessons.forEach((incoming, index) => {
    const externalLessonId = incoming.externalId
      ? stableId("le", incoming.externalId)
      : undefined;
    const existing = lessons.find(
      (l) =>
        (externalLessonId && l.id === externalLessonId) ||
        (l.courseId === course!.id && norm(l.title) === norm(incoming.title)),
    );

    const transcript = incoming.transcript?.trim() ?? "";
    const base = {
      title: incoming.title,
      section: incoming.section,
      sectionOrder: incoming.sectionOrder,
      order: incoming.order ?? index,
      sourceKind:
        incoming.sourceKind ??
        (transcript ? "transcript" : incoming.videoUrl ? "video" : "post"),
      videoUrl: incoming.videoUrl,
      sourceUrl: incoming.sourceUrl,
      transcript,
      content: incoming.content?.trim() || undefined,
      topics: incoming.topics ?? [],
      durationMinutes:
        incoming.durationMinutes ?? (transcript ? estimateMinutes(transcript) : undefined),
      updatedAt: stamp(),
    } satisfies Partial<Lesson>;

    if (existing) {
      lessons[lessons.indexOf(existing)] = {
        ...existing,
        ...base,
        // Never overwrite what the reader has done with the lesson.
        status: existing.status,
        notes: existing.notes,
        study:
          transcript && transcript !== existing.transcript
            ? analyzeTranscript(transcript)
            : existing.study,
      };
      report.lessonsUpdated += 1;
    } else {
      lessons.push({
        ...base,
        id: externalLessonId ?? id("le"),
        courseId: course!.id,
        creatorId,
        status: "todo",
        createdAt: stamp(),
        study: transcript ? analyzeTranscript(transcript) : undefined,
      });
      report.lessonsAdded += 1;
    }
  });

  return {
    db: { ...db, faculties, creators, courses, lessons },
    report,
  };
}

/** Merge a batch of packages in order, collecting one report per file. */
export function mergeAll(
  db: Database,
  packages: CoursePackage[],
): { db: Database; reports: ImportReport[] } {
  let current = db;
  const reports: ImportReport[] = [];
  for (const pkg of packages) {
    const result = mergePackage(current, pkg);
    current = result.db;
    reports.push(result.report);
  }
  return { db: current, reports };
}
