import type { Database } from "./types";
import { SEED } from "./seed";

/**
 * The single place the app talks to storage.
 *
 * IndexedDB, not localStorage: localStorage caps out around 5 MB, and one
 * imported course with full transcripts runs about 0.2 MB, so a library of
 * twenty-odd courses would not fit. IndexedDB quota is typically hundreds of
 * megabytes or more.
 *
 * When Supabase arrives, implement this same interface against it
 * (`load` → select, `save` → upsert, or move to per-row mutations) and swap
 * the export at the bottom. Nothing in the UI imports storage directly, so no
 * component has to change.
 */
export interface PersistenceAdapter {
  load(): Promise<Database | null>;
  save(db: Database): Promise<void>;
  clear(): Promise<void>;
}

const DB_NAME = "studiolo";
const DB_VERSION = 1;
const STORE = "library";
const RECORD_KEY = "current";

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
    request.onerror = () => reject(request.error);
  });
}

function readRecord(idb: IDBDatabase): Promise<Database | null> {
  return new Promise((resolve, reject) => {
    const request = idb.transaction(STORE, "readonly").objectStore(STORE).get(RECORD_KEY);
    request.onsuccess = () => resolve((request.result as Database) ?? null);
    request.onerror = () => reject(request.error);
  });
}

function writeRecord(idb: IDBDatabase, db: Database): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(db, RECORD_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Anything written before the move to IndexedDB. Read once, then retired. */
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

export const indexedDbAdapter: PersistenceAdapter = {
  async load() {
    if (typeof window === "undefined" || !("indexedDB" in window)) return null;
    try {
      const idb = await openDatabase();
      const stored = await readRecord(idb);
      if (stored) return stored;

      // First run after the upgrade: carry the old library across.
      const legacy = readLegacy();
      if (legacy) {
        await writeRecord(idb, legacy);
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
        return legacy;
      }
      return null;
    } catch {
      return null;
    }
  },

  async save(db) {
    if (typeof window === "undefined" || !("indexedDB" in window)) return;
    try {
      const idb = await openDatabase();
      await writeRecord(idb, db);
    } catch {
      // Private mode, or quota. The session still works, it just won't persist.
    }
  },

  async clear() {
    if (typeof window === "undefined" || !("indexedDB" in window)) return;
    try {
      const idb = await openDatabase();
      await new Promise<void>((resolve, reject) => {
        const tx = idb.transaction(STORE, "readwrite");
        tx.objectStore(STORE).delete(RECORD_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // Nothing stored to clear.
    }
  },
};

export const persistence: PersistenceAdapter = indexedDbAdapter;

/** Bytes the library occupies, and what the browser is willing to give us. */
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
