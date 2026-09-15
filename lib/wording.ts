import type { CourseKind } from "./types";

/**
 * A shelf of PDFs is not a syllabus, and calling its items "lessons" makes
 * the app read wrong. Same screens, same data, different nouns.
 */
export interface Wording {
  item: string;
  items: string;
  add: string;
  empty: string;
  emptyBody: string;
  todo: string;
  doing: string;
  done: string;
  progress: string;
}

const COURSE: Wording = {
  item: "lesson",
  items: "lessons",
  add: "Add material",
  empty: "No lessons yet",
  emptyBody: "Paste a transcript, drop a subtitle file, or save a video link.",
  todo: "To study",
  doing: "Studying",
  done: "Done",
  progress: "lessons done",
};

const RESOURCES: Wording = {
  item: "resource",
  items: "resources",
  add: "Add resource",
  empty: "No resources yet",
  emptyBody:
    "Add a cheat sheet, worksheet or PDF. Each one keeps its link back to where it lives.",
  todo: "To read",
  doing: "Reading",
  done: "Used",
  progress: "resources used",
};

export function wordingFor(kind: CourseKind | undefined): Wording {
  return kind === "resources" ? RESOURCES : COURSE;
}
