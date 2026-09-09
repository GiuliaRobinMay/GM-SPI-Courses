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

export type SourceKind =
  | "transcript"
  | "video"
  | "pdf"
  | "document"
  | "article"
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

export interface Course {
  id: string;
  facultyId: string;
  title: string;
  subtitle?: string;
  description?: string;
  creatorId: string;
  /** Link back to where the course lives (Skool, Teachable, YouTube playlist…) */
  sourceUrl?: string;
  /** Free-form topics used for filtering and search */
  topics: string[];
  accent: AccentToken;
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

  /** Provenance — always keep track of where material came from */
  sourceKind: SourceKind;
  /** Direct link to the video (YouTube, Loom, Vimeo…) */
  videoUrl?: string;
  /** Link to the lesson inside the original course */
  sourceUrl?: string;
  /** Original file name when the transcript came from a PDF/Word upload */
  sourceFileName?: string;

  /** The main payload: the raw transcript or pasted document text */
  transcript: string;
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

export type AccentToken =
  | "indigo"
  | "violet"
  | "sky"
  | "emerald"
  | "amber"
  | "rose"
  | "slate";

/** Everything the app persists. One object = one Supabase-shaped snapshot. */
export interface Database {
  version: number;
  creators: Creator[];
  faculties: Faculty[];
  courses: Course[];
  lessons: Lesson[];
}
