"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  Course,
  Creator,
  Database,
  Faculty,
  Lesson,
  LessonStatus,
} from "./types";
import { analyzeTranscript, estimateMinutes } from "./insights";
import { emptyDatabase, persistence, seedDatabase } from "./persistence";
import { STARTER_VERSION, withStarterCourses } from "./seed";
import { mergeAll, type ImportReport } from "./importer";
import type { CoursePackage } from "./types";

function id(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function stamp(): string {
  return new Date().toISOString();
}

/**
 * Any lesson that carries a transcript but no derived study output gets one
 * here — seeded content, imported files, and anything written by an older
 * version of the app.
 */
function withStudyOutput(db: Database): Database {
  return {
    ...db,
    lessons: db.lessons.map((l) =>
      l.transcript && !l.study ? { ...l, study: analyzeTranscript(l.transcript) } : l,
    ),
  };
}

interface LibraryValue {
  ready: boolean;
  /** Set when the library could not be read or written. Nothing is seeded. */
  loadError: string | null;
  db: Database;

  /* selectors */
  faculty(facultyId: string): Faculty | undefined;
  course(courseId: string): Course | undefined;
  lesson(lessonId: string): Lesson | undefined;
  creator(creatorId?: string): Creator | undefined;
  creatorName(creatorId?: string): string;
  coursesOf(facultyId: string): Course[];
  lessonsOf(courseId: string): Lesson[];
  courseProgress(courseId: string): { done: number; total: number };
  search(query: string): {
    courses: Course[];
    lessons: Lesson[];
    faculties: Faculty[];
  };

  /* mutations */
  addFaculty(input: Partial<Faculty> & { name: string }): Faculty;
  updateFaculty(facultyId: string, patch: Partial<Faculty>): void;
  removeFaculty(facultyId: string): void;

  addCourse(input: Partial<Course> & { title: string; facultyId: string }): Course;
  updateCourse(courseId: string, patch: Partial<Course>): void;
  removeCourse(courseId: string): void;

  addLesson(input: Partial<Lesson> & { title: string; courseId: string }): Lesson;
  updateLesson(lessonId: string, patch: Partial<Lesson>): void;
  removeLesson(lessonId: string): void;
  setLessonStatus(lessonId: string, status: LessonStatus): void;
  regenerateStudy(lessonId: string): void;

  addCreator(input: Partial<Creator> & { name: string }): Creator;

  /**
   * Write a hand-set order across the study plan. Takes the full ordered
   * list, so one move renumbers everything and the result cannot drift.
   */
  reorderPlan(items: { id: string; kind: "course" | "lesson" }[]): void;
  /** Add the SPI course list, skipping any course already present. */
  addStarterCourses(): number;
  /** Merge course files into the library without removing anything. */
  importPackages(packages: CoursePackage[]): ImportReport[];
  /** Replace the whole library — used by the full-library restore. */
  replaceAll(next: Database): void;

  resetToDemo(): void;
  clearAll(): void;
}

const LibraryContext = createContext<LibraryValue | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<Database>(emptyDatabase);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    let cancelled = false;
    persistence.load().then((result) => {
      if (cancelled) return;

      if (result.status === "error") {
        // Do NOT seed and do NOT mark hydrated: saving now would write an
        // empty library over one we simply failed to read.
        setLoadError(result.message);
        setReady(true);
        return;
      }

      const base = result.status === "ok" ? result.db : seedDatabase();
      setDb(withStarterCourses(withStudyOutput(base)).db);
      hydrated.current = true;
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    void persistence.save(db).catch((error: unknown) => {
      // A write that fails silently is how work disappears without warning.
      setLoadError(
        error instanceof Error ? `Could not save: ${error.message}` : "Could not save.",
      );
    });
  }, [db]);

  /* ---------------------------- selectors ---------------------------- */

  const faculty = useCallback(
    (facultyId: string) => db.faculties.find((f) => f.id === facultyId),
    [db.faculties],
  );
  const course = useCallback(
    (courseId: string) => db.courses.find((c) => c.id === courseId),
    [db.courses],
  );
  const lesson = useCallback(
    (lessonId: string) => db.lessons.find((l) => l.id === lessonId),
    [db.lessons],
  );
  const creator = useCallback(
    (creatorId?: string) => db.creators.find((c) => c.id === creatorId),
    [db.creators],
  );
  const creatorName = useCallback(
    (creatorId?: string) => creator(creatorId)?.name ?? "Unknown creator",
    [creator],
  );
  const coursesOf = useCallback(
    (facultyId: string) =>
      db.courses
        .filter((c) => c.facultyId === facultyId)
        .sort((a, b) => Number(b.favorite ?? 0) - Number(a.favorite ?? 0)),
    [db.courses],
  );
  const lessonsOf = useCallback(
    (courseId: string) =>
      db.lessons
        .filter((l) => l.courseId === courseId)
        .sort(
          (a, b) =>
            (a.sectionOrder ?? 0) - (b.sectionOrder ?? 0) || a.order - b.order,
        ),
    [db.lessons],
  );
  const courseProgress = useCallback(
    (courseId: string) => {
      const items = db.lessons.filter((l) => l.courseId === courseId);
      return {
        done: items.filter((l) => l.status === "done").length,
        total: items.length,
      };
    },
    [db.lessons],
  );

  const search = useCallback(
    (query: string) => {
      const q = query.trim().toLowerCase();
      if (!q) return { courses: [], lessons: [], faculties: [] };
      const hit = (...parts: (string | undefined)[]) =>
        parts.filter(Boolean).join(" ").toLowerCase().includes(q);
      return {
        faculties: db.faculties.filter((f) => hit(f.name, f.description)),
        courses: db.courses.filter((c) =>
          hit(c.title, c.subtitle, c.description, c.topics.join(" ")),
        ),
        lessons: db.lessons.filter((l) =>
          hit(l.title, l.topics.join(" "), l.transcript, l.notes),
        ),
      };
    },
    [db],
  );

  /* ---------------------------- mutations ---------------------------- */

  const addFaculty: LibraryValue["addFaculty"] = useCallback((input) => {
    const created: Faculty = {
      id: id("fa"),
      name: input.name,
      icon: input.icon ?? "book",
      accent: input.accent ?? "violet",
      description: input.description,
      order: input.order ?? 999,
    };
    setDb((prev) => ({ ...prev, faculties: [...prev.faculties, created] }));
    return created;
  }, []);

  const updateFaculty: LibraryValue["updateFaculty"] = useCallback((facultyId, patch) => {
    setDb((prev) => ({
      ...prev,
      faculties: prev.faculties.map((f) =>
        f.id === facultyId ? { ...f, ...patch } : f,
      ),
    }));
  }, []);

  const removeFaculty: LibraryValue["removeFaculty"] = useCallback((facultyId) => {
    setDb((prev) => {
      const courseIds = prev.courses
        .filter((c) => c.facultyId === facultyId)
        .map((c) => c.id);
      return {
        ...prev,
        faculties: prev.faculties.filter((f) => f.id !== facultyId),
        courses: prev.courses.filter((c) => c.facultyId !== facultyId),
        lessons: prev.lessons.filter((l) => !courseIds.includes(l.courseId)),
      };
    });
  }, []);

  const addCourse: LibraryValue["addCourse"] = useCallback((input) => {
    const created: Course = {
      id: id("co"),
      facultyId: input.facultyId,
      title: input.title,
      subtitle: input.subtitle,
      description: input.description,
      creatorId: input.creatorId ?? "cr-self",
      sourceUrl: input.sourceUrl,
      topics: input.topics ?? [],
      accent: input.accent ?? "violet",
      createdAt: stamp(),
      updatedAt: stamp(),
      favorite: input.favorite,
    };
    setDb((prev) => ({ ...prev, courses: [...prev.courses, created] }));
    return created;
  }, []);

  const updateCourse: LibraryValue["updateCourse"] = useCallback((courseId, patch) => {
    setDb((prev) => ({
      ...prev,
      courses: prev.courses.map((c) =>
        c.id === courseId ? { ...c, ...patch, updatedAt: stamp() } : c,
      ),
    }));
  }, []);

  const removeCourse: LibraryValue["removeCourse"] = useCallback((courseId) => {
    setDb((prev) => ({
      ...prev,
      courses: prev.courses.filter((c) => c.id !== courseId),
      lessons: prev.lessons.filter((l) => l.courseId !== courseId),
    }));
  }, []);

  const addLesson: LibraryValue["addLesson"] = useCallback((input) => {
    const transcript = input.transcript ?? "";
    const created: Lesson = {
      id: id("le"),
      courseId: input.courseId,
      title: input.title,
      creatorId: input.creatorId,
      order: input.order ?? Date.now(),
      status: input.status ?? "todo",
      sourceKind: input.sourceKind ?? (transcript ? "transcript" : "video"),
      videoUrl: input.videoUrl,
      sourceUrl: input.sourceUrl,
      sourceFileName: input.sourceFileName,
      section: input.section,
      sectionOrder: input.sectionOrder,
      transcript,
      content: input.content,
      notes: input.notes,
      topics: input.topics ?? [],
      durationMinutes:
        input.durationMinutes ??
        (transcript ? estimateMinutes(transcript) : undefined),
      recordedAt: input.recordedAt,
      createdAt: stamp(),
      updatedAt: stamp(),
      study: transcript ? analyzeTranscript(transcript) : undefined,
    };
    setDb((prev) => ({ ...prev, lessons: [...prev.lessons, created] }));
    return created;
  }, []);

  const updateLesson: LibraryValue["updateLesson"] = useCallback((lessonId, patch) => {
    setDb((prev) => ({
      ...prev,
      lessons: prev.lessons.map((l) => {
        if (l.id !== lessonId) return l;
        const next = { ...l, ...patch, updatedAt: stamp() };
        // The cached study output belongs to a specific transcript.
        if (patch.transcript !== undefined && patch.transcript !== l.transcript) {
          next.study = patch.transcript
            ? analyzeTranscript(patch.transcript)
            : undefined;
        }
        return next;
      }),
    }));
  }, []);

  const removeLesson: LibraryValue["removeLesson"] = useCallback((lessonId) => {
    setDb((prev) => ({
      ...prev,
      lessons: prev.lessons.filter((l) => l.id !== lessonId),
    }));
  }, []);

  const setLessonStatus: LibraryValue["setLessonStatus"] = useCallback(
    (lessonId, status) => updateLesson(lessonId, { status }),
    [updateLesson],
  );

  const regenerateStudy: LibraryValue["regenerateStudy"] = useCallback((lessonId) => {
    setDb((prev) => ({
      ...prev,
      lessons: prev.lessons.map((l) =>
        l.id === lessonId
          ? {
              ...l,
              study: l.transcript ? analyzeTranscript(l.transcript) : undefined,
              updatedAt: stamp(),
            }
          : l,
      ),
    }));
  }, []);

  const addCreator: LibraryValue["addCreator"] = useCallback((input) => {
    const created: Creator = {
      id: id("cr"),
      name: input.name,
      handle: input.handle,
      url: input.url,
      isSelf: input.isSelf,
    };
    setDb((prev) => ({ ...prev, creators: [...prev.creators, created] }));
    return created;
  }, []);

  const importPackages: LibraryValue["importPackages"] = useCallback((packages) => {
    // mergeAll is pure, so the reports are computed here and the state update
    // just swaps in the result.
    let reports: ImportReport[] = [];
    setDb((prev) => {
      const result = mergeAll(prev, packages);
      reports = result.reports;
      return result.db;
    });
    return reports;
  }, []);

  const replaceAll: LibraryValue["replaceAll"] = useCallback((next) => {
    setDb(withStudyOutput(next));
  }, []);

  /**
   * Put the SPI courses into whatever library already exists. Ids are stable,
   * so running it twice adds nothing the second time and no lesson is touched.
   */
  const reorderPlan: LibraryValue["reorderPlan"] = useCallback((items) => {
    const position = new Map(items.map((item, index) => [item.id, index]));
    setDb((prev) => ({
      ...prev,
      courses: prev.courses.map((c) =>
        position.has(c.id) ? { ...c, planOrder: position.get(c.id) } : c,
      ),
      lessons: prev.lessons.map((l) =>
        position.has(l.id) ? { ...l, planOrder: position.get(l.id) } : l,
      ),
    }));
  }, []);

  const addStarterCourses: LibraryValue["addStarterCourses"] = useCallback(() => {
    let added = 0;
    setDb((prev) => {
      // Drop the marker so the merge runs even if this library already has it.
      const result = withStarterCourses({ ...prev, starterVersion: undefined });
      added = result.added;
      return result.db;
    });
    return added;
  }, []);

  const resetToDemo = useCallback(() => setDb(seedDatabase()), []);
  const clearAll = useCallback(
    () =>
      setDb({
        ...structuredClone(emptyDatabase),
        // Deliberately empty stays empty, rather than refilling on next load.
        starterVersion: STARTER_VERSION,
        creators: [{ id: "cr-self", name: "You", isSelf: true }],
      }),
    [],
  );

  const value = useMemo<LibraryValue>(
    () => ({
      ready,
      loadError,
      db,
      faculty,
      course,
      lesson,
      creator,
      creatorName,
      coursesOf,
      lessonsOf,
      courseProgress,
      search,
      addFaculty,
      updateFaculty,
      removeFaculty,
      addCourse,
      updateCourse,
      removeCourse,
      addLesson,
      updateLesson,
      removeLesson,
      setLessonStatus,
      regenerateStudy,
      addCreator,
      reorderPlan,
      addStarterCourses,
      importPackages,
      replaceAll,
      resetToDemo,
      clearAll,
    }),
    [
      ready, loadError, db, faculty, course, lesson, creator, creatorName, coursesOf,
      lessonsOf, courseProgress, search, addFaculty, updateFaculty,
      removeFaculty, addCourse, updateCourse, removeCourse, addLesson,
      updateLesson, removeLesson, setLessonStatus, regenerateStudy, addCreator,
      reorderPlan, addStarterCourses, importPackages, replaceAll, resetToDemo, clearAll,
    ],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryValue {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used inside <LibraryProvider>");
  return ctx;
}
