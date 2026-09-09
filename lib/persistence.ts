import type { Database } from "./types";
import { SEED } from "./seed";

/**
 * The single place the app talks to storage.
 *
 * Today it is localStorage, which keeps the template dependency-free.
 * When Supabase arrives, implement this same interface against it
 * (`load` → select, `save` → upsert, or move to per-row mutations) and
 * swap the export at the bottom. Nothing in the UI imports localStorage
 * directly, so no component has to change.
 */
export interface PersistenceAdapter {
  load(): Promise<Database | null>;
  save(db: Database): Promise<void>;
  clear(): Promise<void>;
}

const STORAGE_KEY = "studiolo.library.v1";

export const localAdapter: PersistenceAdapter = {
  async load() {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Database;
      if (typeof parsed?.version !== "number") return null;
      return parsed;
    } catch {
      return null;
    }
  },

  async save(db) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch {
      // Quota or private mode — the session still works, it just won't persist.
    }
  },

  async clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
  },
};

export const persistence: PersistenceAdapter = localAdapter;

export const emptyDatabase: Database = {
  version: 1,
  creators: [],
  faculties: [],
  courses: [],
  lessons: [],
};

export function seedDatabase(): Database {
  return structuredClone(SEED);
}
