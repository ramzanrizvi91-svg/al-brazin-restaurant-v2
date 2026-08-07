// ==========================================================================
// db.ts — Lightweight embedded persistence layer
// ==========================================================================
// Why not Postgres/MySQL/SQLite here?
// This project is deployed by uploading a plain folder/zip to a hosting
// platform, with no guarantee that native binaries (like better-sqlite3) or
// an external database service are available. To guarantee it works
// reliably on ANY Node.js host out of the box, we use a small dependency-free
// JSON-file datastore instead of in-memory arrays.
//
// Every write is persisted to disk immediately (synchronously) inside the
// `data/` folder, so orders, menu edits, users, loyalty points, etc. all
// SURVIVE server restarts — unlike the previous version of this app, which
// lost everything in memory whenever the process restarted.
//
// Upgrade path: if you later want a "real" SQL database (Postgres via
// Supabase/Neon/Railway is recommended), you only need to re-implement the
// methods of the Collection class below — every route in server.ts calls
// through this same small API (all/find/insert/update/remove/replaceAll),
// so the rest of the app does not need to change.
// ==========================================================================

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function filePathFor(name: string) {
  return path.join(DATA_DIR, `${name}.json`);
}

function atomicWrite(filePath: string, data: unknown) {
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpPath, filePath);
}

export class Collection<T extends { id?: string }> {
  private name: string;
  private filePath: string;
  private items: T[];

  constructor(name: string, seed: T[] = []) {
    this.name = name;
    this.filePath = filePathFor(name);

    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.items = JSON.parse(raw);
      } catch (err) {
        console.error(`[db] Failed to read ${name}.json, reseeding.`, err);
        this.items = JSON.parse(JSON.stringify(seed));
        this.persist();
      }
    } else {
      this.items = JSON.parse(JSON.stringify(seed));
      this.persist();
    }
  }

  private persist() {
    atomicWrite(this.filePath, this.items);
  }

  all(): T[] {
    return this.items;
  }

  find(predicate: (item: T) => boolean): T | undefined {
    return this.items.find(predicate);
  }

  filter(predicate: (item: T) => boolean): T[] {
    return this.items.filter(predicate);
  }

  insert(item: T): T {
    this.items.push(item);
    this.persist();
    return item;
  }

  insertMany(newItems: T[]): T[] {
    this.items.push(...newItems);
    this.persist();
    return newItems;
  }

  update(id: string, patch: Partial<T>): T | null {
    const idx = this.items.findIndex((i) => (i as any).id === id);
    if (idx === -1) return null;
    this.items[idx] = { ...this.items[idx], ...patch };
    this.persist();
    return this.items[idx];
  }

  upsertBy(key: keyof T, value: any, patch: Partial<T>, createIfMissing: () => T): T {
    const idx = this.items.findIndex((i) => (i as any)[key] === value);
    if (idx === -1) {
      const created = { ...createIfMissing(), ...patch };
      this.items.push(created);
      this.persist();
      return created;
    }
    this.items[idx] = { ...this.items[idx], ...patch };
    this.persist();
    return this.items[idx];
  }

  remove(id: string): T | null {
    const idx = this.items.findIndex((i) => (i as any).id === id);
    if (idx === -1) return null;
    const [removed] = this.items.splice(idx, 1);
    this.persist();
    return removed;
  }

  replaceAll(newItems: T[]) {
    this.items = newItems;
    this.persist();
  }

  save() {
    // Call after directly mutating an object returned from find()/all().
    this.persist();
  }
}
