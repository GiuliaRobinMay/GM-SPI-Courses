/**
 * Domain model for Studiolo.
 *
 * Hierarchy:  Faculty  →  Course  →  Lesson
 *
 * A Faculty is a broad field of study you keep in the left sidebar
 * ("Social Media", "AI & Automation", "Food & Hospitality", ...).
 * A Course is one body of material — yours or someone else's.
 * A Lesson is a single unit: a transcript, a video, a PDF, or a mix.
 */

export type LessonStatus = "todo" | "studying" | "done";

/** How urgently you want to get to something. Drives the study plan order. */
export type Priority = "high" | "normal" | "low";

export type SourceKind =
  | "transcript"
  | "video"
  | "pdf"
  | "document"
  | "article"
  | "post"
  | "note";

export interface Creator {
  id: string;
  name: string;
  /** Handle, channel or company, e.g. "@futurepedia" */
  handle?: string;
  /** Where they publish: channel, site, school */
  url?: string;
  /** True when this is the account owner's own material */
  isSelf?: boolean;
}

export interface Faculty {
  id: string;
  name: string;
  /** Lucide icon name — see components/Icon.tsx for the allow-list */
  icon: string;
  /** Tailwind-ish accent token, see lib/theme.ts */
  accent: AccentToken;
  description?: string;
  order: number;
}

/**
 * What a "course" actually holds. A course is studied in order; a shelf of
 * resources is dipped into. They share a shape, so they share a type — only
 * the wording and the ordering differ.
 */
export type CourseKind = "course" | "resources";

export interface Course {
  id: string;
  facultyId: string;
  /** Defaults to "course" when absent. */
  kind?: CourseKind;
  title: string;
  subtitle?: string;
  description?: string;
  creatorId: string;
  /** Link back to where the course lives (Skool, Teachable, YouTube playlist…) */
  sourceUrl?: string;
  /** Free-form topics used for filtering and search */
  topics: string[];
  accent: AccentToken;
  /** Lucide icon name — see components/Icon.tsx for the allow-list */
  icon?: string;

  /**
   * Where this course sits in a progression — "Level 0", "Level 2",
   * "Companion", "Onboarding". Courses are grouped under their track on the
   * faculty page, so a programme's trajectory is visible at a glance.
   * Leave empty for standalone courses; they fall under "Courses".
   */
  track?: string;
  /** Sort position of the track itself. Lower comes first. */
  trackOrder?: number;

  /** Set to put this course on the study plan. Absent means not planned. */
  priority?: Priority;
  /** The day you mean to work on it, as yyyy-mm-dd. */
  plannedFor?: string;

  createdAt: string;
  updatedAt: string;
  /** Pinned to the top of the collection */
  favorite?: boolean;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  /** Falls back to the course creator when empty */
  creatorId?: string;
  order: number;
  status: LessonStatus;

  /** Set to put this lesson on the study plan. Absent means not planned. */
  priority?: Priority;
  /** The day you mean to study it, as yyyy-mm-dd. */
  plannedFor?: string;

  /** Provenance — always keep track of where material came from */
  sourceKind: SourceKind;
  /** Direct link to the video (YouTube, Loom, Vimeo…) */
  videoUrl?: string;
  /** Link to the lesson inside the original course */
  sourceUrl?: string;
  /** Original file name when the transcript came from a PDF/Word upload */
  sourceFileName?: string;

  /**
   * The module this lesson belongs to inside its course ("1. Find your
   * idea"). Lessons are grouped by section, in sectionOrder, on the course
   * page. Empty means the course is a flat list.
   */
  section?: string;
  /** Sort position of the section itself. Lower comes first. */
  sectionOrder?: number;

  /** The main payload: the raw transcript or pasted document text */
  transcript: string;
  /**
   * The written material that came with the lesson — key points, the action
   * item, workbook links. This is the author's text, so it is kept apart from
   * both the transcript and your own notes.
   */
  content?: string;
  /** Your own notes, kept separate from the source material */
  notes?: string;

  topics: string[];
  durationMinutes?: number;
  recordedAt?: string;
  createdAt: string;
  updatedAt: string;

  /** Cached output of lib/insights.ts, regenerated when the transcript changes */
  study?: StudyOutput;
}

/* ------------------------------------------------------------------ */
/* Study output — what the app derives from a transcript              */
/* ------------------------------------------------------------------ */

export interface Highlight {
  text: string;
  /** Rough position in the transcript, 0–1, for ordering */
  position: number;
}

export interface ActionStep {
  index: number;
  text: string;
  /** Tools named in the step, if any */
  tools: string[];
}

export interface StudyOutput {
  summary: string;
  highlights: Highlight[];
  steps: ActionStep[];
  tools: string[];
  terms: { term: string; count: number }[];
  links: string[];
  /** Which engine produced this: local heuristics today, a model later */
  engine: "heuristic" | "model";
  generatedAt: string;
}

/** The four brand colours. Nothing else is allowed as an accent. */
export type AccentToken = "violet" | "red" | "green" | "orange";

/** Everything the app persists. One object = one Supabase-shaped snapshot. */
export interface Database {
  version: number;
  /**
   * Which edition of the starter course list this library has already been
   * given. Absent means it has never been offered one, so the courses are
   * merged in on load. Bumping STARTER_VERSION hands out a new set once.
   */
  starterVersion?: number;
  creators: Creator[];
  faculties: Faculty[];
  courses: Course[];
  lessons: Lesson[];
}

/* ------------------------------------------------------------------ */
/* Import format — see docs/import-format.md                          */
/* ------------------------------------------------------------------ */

/**
 * One course and its lessons, as a file that can be merged into a library
 * without disturbing what is already there. This is what a scraper or an
 * assistant writes when it lifts a course out of another platform.
 */
export interface CoursePackage {
  format: "studiolo.course";
  version: 1;
  /** Created if absent, matched by name if present. */
  faculty?: {
    name: string;
    icon?: string;
    accent?: AccentToken;
    description?: string;
  };
  creator?: {
    name: string;
    handle?: string;
    url?: string;
  };
  course: {
    /** Stable id from the source platform, used to recognise re-imports. */
    externalId?: string;
    title: string;
    subtitle?: string;
    description?: string;
    sourceUrl?: string;
    topics?: string[];
    accent?: AccentToken;
    track?: string;
    trackOrder?: number;
  };
  lessons: {
    externalId?: string;
    title: string;
    section?: string;
    sectionOrder?: number;
    order?: number;
    sourceKind?: SourceKind;
    videoUrl?: string;
    sourceUrl?: string;
    transcript?: string;
    content?: string;
    topics?: string[];
    durationMinutes?: number;
  }[];
}
