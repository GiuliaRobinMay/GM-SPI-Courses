import type { Database } from "./types";
import { SEED } from "./seed";
import { isSupabaseConfigured } from "./supabase/client";
import { createSupabaseAdapter } from "./supabase/adapter";

export { isSupabaseConfigured };

/**
 * The single place the app talks to storage.
 *
 * `load` returns a result, not a nullable value, and that distinction is the
 * whole point: an earlier version returned null both for "nothing is stored"
 * and for "I could not read it", the caller seeded a fresh library on null,
 * and the save that followed wrote that fresh library over a real one. A
 * single transient read failure destroyed the library. A failed read must
 * never be mistaken for an empty one.
 */
export type LoadResult =
  | { status: "ok"; db: Database }
  | { status: "empty" }
  | { status: "error"; message: string };

export interface BackupMeta {
  key: string;
  savedAt: string;
  courses: number;
  lessons: number;
}

export interface PersistenceAdapter {
  load(): Promise<LoadResult>;
  save(db: Database): Promise<void>;
  clear(): Promise<void>;
  listBackups(): Promise<BackupMeta[]>;
  readBackup(key: string): Promise<Database | null>;
}

const DB_NAME = "studiolo";
const DB_VERSION = 1;
const STORE = "library";
const RECORD_KEY = "current";
const BACKUP_PREFIX = "backup:";
const MAX_BACKUPS = 8;

/** The pre-IndexedDB location, read once so existing libraries survive. */
const LEGACY_STORAGE_KEY = "studiolo.library.v1";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const idb = request.result;
      if (!idb.objectStoreNames.contains(STORE)) idb.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("indexedDB.open failed"));
    // Another tab holding an older version would otherwise hang forever.
    request.onblocked = () =>
      reject(new Error("Another tab has this library open. Close it and reload."));
  });
}

function get<T>(idb: IDBDatabase, key: string): Promise<T | null> {
  return new Promise((resolve, reject) => {
    const request = idb.transaction(STORE, "readonly").objectStore(STORE).get(key);
    request.onsuccess = () => resolve((request.result as T) ?? null);
    request.onerror = () => reject(request.error);
  });
}

function put(idb: IDBDatabase, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function keys(idb: IDBDatabase): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const request = idb.transaction(STORE, "readonly").objectStore(STORE).getAllKeys();
    request.onsuccess = () => resolve(request.result.map(String));
    request.onerror = () => reject(request.error);
  });
}

function remove(idb: IDBDatabase, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function readLegacy(): Database | null {
  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Database;
    return typeof parsed?.version === "number" ? parsed : null;
  } catch {
    return null;
  }
}

const size = (db: Database) => db.courses.length + db.lessons.length;

/**
 * Snapshot the stored library before a write that would shrink it.
 *
 * Every real loss of work looks the same from here: something large is about
 * to be replaced by something smaller. Whether that is a bug, a misclick on
 * "Clear all", or a bad restore, the previous state is worth keeping.
 */
async function backupIfShrinking(idb: IDBDatabase, incoming: Database): Promise<void> {
  const current = await get<Database>(idb, RECORD_KEY);
  if (!current || size(current) <= size(incoming)) return;

  await put(idb, `${BACKUP_PREFIX}${new Date().toISOString()}`, current);

  const stale = (await keys(idb))
    .filter((k) => k.startsWith(BACKUP_PREFIX))
    .sort()
    .slice(0, -MAX_BACKUPS);
  for (const key of stale) await remove(idb, key);
}

export const indexedDbAdapter: PersistenceAdapter = {
  async load() {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return { status: "empty" };
    }
    try {
      const idb = await openDatabase();
      const stored = await get<Database>(idb, RECORD_KEY);
      if (stored) return { status: "ok", db: stored };

      const legacy = readLegacy();
      if (legacy) {
        await put(idb, RECORD_KEY, legacy);
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
        return { status: "ok", db: legacy };
      }
      return { status: "empty" };
    } catch (error) {
      return {
        status: "error",
        message: error instanceof Error ? error.message : "Could not read the library.",
      };
    }
  },

  async save(db) {
    if (typeof window === "undefined" || !("indexedDB" in window)) return;
    const idb = await openDatabase();
    await backupIfShrinking(idb, db);
    await put(idb, RECORD_KEY, db);
  },

  async clear() {
    if (typeof window === "undefined" || !("indexedDB" in window)) return;
    const idb = await openDatabase();
    const current = await get<Database>(idb, RECORD_KEY);
    if (current) await put(idb, `${BACKUP_PREFIX}${new Date().toISOString()}`, current);
    await remove(idb, RECORD_KEY);
  },

  async listBackups() {
    if (typeof window === "undefined" || !("indexedDB" in window)) return [];
    try {
      const idb = await openDatabase();
      const all = (await keys(idb)).filter((k) => k.startsWith(BACKUP_PREFIX)).sort().reverse();
      const metas: BackupMeta[] = [];
      for (const key of all) {
        const snapshot = await get<Database>(idb, key);
        if (!snapshot) continue;
        metas.push({
          key,
          savedAt: key.slice(BACKUP_PREFIX.length),
          courses: snapshot.courses.length,
          lessons: snapshot.lessons.length,
        });
      }
      return metas;
    } catch {
      return [];
    }
  },

  async readBackup(key) {
    if (typeof window === "undefined" || !("indexedDB" in window)) return null;
    try {
      const idb = await openDatabase();
      return await get<Database>(idb, key);
    } catch {
      return null;
    }
  },
};

export const persistence: PersistenceAdapter = isSupabaseConfigured
  ? createSupabaseAdapter()
  : indexedDbAdapter;

/** The local adapter, still reachable so a library can be migrated upward. */
export const localPersistence = indexedDbAdapter;

export async function storageReport(db: Database): Promise<{
  used: number;
  quota: number | null;
}> {
  const used = new Blob([JSON.stringify(db)]).size;
  try {
    const estimate = await navigator.storage?.estimate?.();
    return { used, quota: estimate?.quota ?? null };
  } catch {
    return { used, quota: null };
  }
}

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
