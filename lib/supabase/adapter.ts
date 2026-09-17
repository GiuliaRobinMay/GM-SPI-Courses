/**
 * The Supabase implementation of PersistenceAdapter.
 *
 * `save` is called on every change, and a library with full transcripts runs
 * to several megabytes, so writing the whole snapshot each time would be
 * unusable. Instead the adapter remembers what it last wrote and sends only
 * the rows that actually changed, plus deletes for rows that disappeared.
 * The store keeps its simple "here is the whole database" interface.
 */

import type { BackupMeta, LoadResult, PersistenceAdapter } from "../persistence";
import type {
  Course, CourseKind, Creator, Database, Faculty, Lesson, LessonStatus,
  Priority, SourceKind, AccentToken, StudyOutput,
} from "../types";
import { getSupabase } from "./client";

/* ------------------------------------------------------------------ */
/* Row shapes — snake_case in Postgres, camelCase in the app          */
/* ------------------------------------------------------------------ */

type Row = Record<string, unknown>;

const facultyToRow = (f: Faculty): Row => ({
  id: f.id, name: f.name, icon: f.icon, accent: f.accent,
  description: f.description ?? null, order: f.order,
});

const rowToFaculty = (r: Row): Faculty => ({
  id: r.id as string,
  name: r.name as string,
  icon: r.icon as string,
  accent: r.accent as AccentToken,
  description: (r.description as string) ?? undefined,
  order: (r.order as number) ?? 0,
});

const creatorToRow = (c: Creator): Row => ({
  id: c.id, name: c.name, handle: c.handle ?? null, url: c.url ?? null,
  is_self: c.isSelf ?? false,
});

const rowToCreator = (r: Row): Creator => ({
  id: r.id as string,
  name: r.name as string,
  handle: (r.handle as string) ?? undefined,
  url: (r.url as string) ?? undefined,
  isSelf: Boolean(r.is_self),
});

const courseToRow = (c: Course): Row => ({
  id: c.id, faculty_id: c.facultyId, kind: c.kind ?? "course", title: c.title,
  icon: c.icon ?? null, priority: c.priority ?? null,
  planned_for: c.plannedFor ?? null, plan_order: c.planOrder ?? null,
  subtitle: c.subtitle ?? null, description: c.description ?? null,
  creator_id: c.creatorId ?? null, source_url: c.sourceUrl ?? null,
  topics: c.topics ?? [], accent: c.accent, track: c.track ?? null,
  track_order: c.trackOrder ?? null, favorite: c.favorite ?? false,
  created_at: c.createdAt, updated_at: c.updatedAt,
});

const rowToCourse = (r: Row): Course => ({
  id: r.id as string,
  facultyId: r.faculty_id as string,
  kind: (r.kind as CourseKind) ?? "course",
  title: r.title as string,
  icon: (r.icon as string) ?? undefined,
  priority: (r.priority as Priority) ?? undefined,
  plannedFor: (r.planned_for as string) ?? undefined,
  subtitle: (r.subtitle as string) ?? undefined,
  description: (r.description as string) ?? undefined,
  creatorId: (r.creator_id as string) ?? "cr-self",
  sourceUrl: (r.source_url as string) ?? undefined,
  topics: (r.topics as string[]) ?? [],
  accent: r.accent as AccentToken,
  track: (r.track as string) ?? undefined,
  trackOrder: (r.track_order as number) ?? undefined,
  favorite: Boolean(r.favorite),
  createdAt: r.created_at as string,
  updatedAt: r.updated_at as string,
});

const lessonToRow = (l: Lesson): Row => ({
  id: l.id, course_id: l.courseId, title: l.title,
  creator_id: l.creatorId ?? null, order: l.order, status: l.status,
  priority: l.priority ?? null, planned_for: l.plannedFor ?? null,
  plan_order: l.planOrder ?? null,
  source_kind: l.sourceKind, video_url: l.videoUrl ?? null,
  source_url: l.sourceUrl ?? null, source_file_name: l.sourceFileName ?? null,
  section: l.section ?? null, section_order: l.sectionOrder ?? null,
  transcript: l.transcript ?? "", content: l.content ?? null,
  notes: l.notes ?? null, topics: l.topics ?? [],
  duration_minutes: l.durationMinutes ?? null,
  recorded_at: l.recordedAt ?? null, study: l.study ?? null,
  created_at: l.createdAt, updated_at: l.updatedAt,
});

const rowToLesson = (r: Row): Lesson => ({
  id: r.id as string,
  courseId: r.course_id as string,
  title: r.title as string,
  creatorId: (r.creator_id as string) ?? undefined,
  order: (r.order as number) ?? 0,
  status: r.status as LessonStatus,
  priority: (r.priority as Priority) ?? undefined,
  plannedFor: (r.planned_for as string) ?? undefined,
  planOrder: (r.plan_order as number) ?? undefined,
  sourceKind: r.source_kind as SourceKind,
  videoUrl: (r.video_url as string) ?? undefined,
  sourceUrl: (r.source_url as string) ?? undefined,
  sourceFileName: (r.source_file_name as string) ?? undefined,
  section: (r.section as string) ?? undefined,
  sectionOrder: (r.section_order as number) ?? undefined,
  transcript: (r.transcript as string) ?? "",
  content: (r.content as string) ?? undefined,
  notes: (r.notes as string) ?? undefined,
  topics: (r.topics as string[]) ?? [],
  durationMinutes: (r.duration_minutes as number) ?? undefined,
  recordedAt: (r.recorded_at as string) ?? undefined,
  study: (r.study as StudyOutput) ?? undefined,
  createdAt: r.created_at as string,
  updatedAt: r.updated_at as string,
});

/* ------------------------------------------------------------------ */
/* Diffing                                                             */
/* ------------------------------------------------------------------ */

interface Entity {
  id: string;
}

/** Rows to upsert and ids to delete, comparing a new list against the old. */
function diff<T extends Entity>(
  previous: T[],
  next: T[],
  toRow: (item: T) => Row,
): { upserts: Row[]; deletions: string[] } {
  const before = new Map(previous.map((item) => [item.id, item]));
  const upserts: Row[] = [];

  for (const item of next) {
    const old = before.get(item.id);
    // Cheap structural comparison; these objects are plain JSON.
    if (!old || JSON.stringify(old) !== JSON.stringify(item)) {
      upserts.push(toRow(item));
    }
    before.delete(item.id);
  }

  return { upserts, deletions: [...before.keys()] };
}

const TABLES = ["faculties", "creators", "courses", "lessons"] as const;

/* ------------------------------------------------------------------ */

export function createSupabaseAdapter(): PersistenceAdapter {
  /** What we believe is currently in the database, to diff against. */
  let lastSaved: Database | null = null;

  return {
    async load(): Promise<LoadResult> {
      const supabase = getSupabase();
      if (!supabase) return { status: "empty" };

      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return { status: "empty" }; // Signed out.

      const [faculties, creators, courses, lessons] = await Promise.all(
        TABLES.map((table) => supabase.from(table).select("*")),
      );

      // A failed query is an error, never an empty library: seeding over a
      // real account because the network blipped is the bug this type exists
      // to prevent.
      const failure = [faculties, creators, courses, lessons].find((r) => r.error);
      if (failure?.error) return { status: "error", message: failure.error.message };

      const db: Database = {
        version: 1,
        faculties: (faculties.data ?? []).map(rowToFaculty),
        creators: (creators.data ?? []).map(rowToCreator),
        courses: (courses.data ?? []).map(rowToCourse),
        lessons: (lessons.data ?? []).map(rowToLesson),
      };

      lastSaved = structuredClone(db);
      return { status: "ok", db };
    },

    async save(db) {
      const supabase = getSupabase();
      if (!supabase) return;

      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const empty: Database = {
        version: 1, faculties: [], creators: [], courses: [], lessons: [],
      };
      const previous = lastSaved ?? empty;

      const plans = {
        faculties: diff(previous.faculties, db.faculties, facultyToRow),
        creators: diff(previous.creators, db.creators, creatorToRow),
        courses: diff(previous.courses, db.courses, courseToRow),
        lessons: diff(previous.lessons, db.lessons, lessonToRow),
      };

      // Parents before children on the way in, children first on the way out,
      // so composite foreign keys are never momentarily violated.
      for (const table of TABLES) {
        const { upserts } = plans[table];
        if (upserts.length === 0) continue;
        const { error } = await supabase.from(table).upsert(upserts);
        if (error) throw new Error(`${table}: ${error.message}`);
      }

      for (const table of [...TABLES].reverse()) {
        const { deletions } = plans[table];
        if (deletions.length === 0) continue;
        const { error } = await supabase.from(table).delete().in("id", deletions);
        if (error) throw new Error(`${table}: ${error.message}`);
      }

      lastSaved = structuredClone(db);
    },

    async clear() {
      const supabase = getSupabase();
      if (!supabase) return;
      // Faculties cascade to courses, which cascade to lessons.
      for (const table of ["lessons", "courses", "faculties", "creators"]) {
        await supabase.from(table).delete().neq("id", "");
      }
      lastSaved = null;
    },

    // Supabase keeps its own history; the local snapshot list does not apply.
    async listBackups(): Promise<BackupMeta[]> {
      return [];
    },

    async readBackup() {
      return null;
    },
  };
}
