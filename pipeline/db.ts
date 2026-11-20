import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { config } from './config';

export type Db = DatabaseSync;


/** Open (and create / migrate) the project database. */
export function openDb(file = config.dbPath): Db {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  db.exec(fs.readFileSync(config.schemaPath, 'utf8'));
  return db;
}

/** Run `fn` inside a transaction. */
export function tx<T>(db: Db, fn: () => T): T {
  db.exec('BEGIN');
  try {
    const out = fn();
    db.exec('COMMIT');
    return out;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

export interface Observation {
  indicator: string;
  area: string;
  period: string;
  value: number | null;
  status?: 'ok' | 'suppressed' | 'missing' | 'derived';
}

/** Insert or replace observations. Returns the number of rows written. */
export function upsertObservations(db: Db, rows: Observation[], runId: number | null): number {
  const stmt = db.prepare(`
    INSERT INTO observation (indicator_id, area_code, period, value, status, fetch_run_id, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    ON CONFLICT (indicator_id, area_code, period) DO UPDATE SET
      value = excluded.value, status = excluded.status,
      fetch_run_id = excluded.fetch_run_id, updated_at = excluded.updated_at`);
  tx(db, () => {
    for (const r of rows) {
      const status = r.status ?? (r.value === null ? 'missing' : 'ok');
      stmt.run(r.indicator, r.area, r.period, r.value, status, runId);
    }
  });
  return rows.length;
}

/** Read observations as a lookup: get(indicator, area, period). */
export function observationLookup(db: Db) {
  const stmt = db.prepare('SELECT value FROM observation WHERE indicator_id = ? AND area_code = ? AND period = ?');
  return (indicator: string, area: string, period: string): number | null | undefined => {
    const row = stmt.get(indicator, area, period) as { value: number | null } | undefined;
    return row === undefined ? undefined : row.value;
  };
}

export interface RunHandle {
  id: number;
  rows: number;
}

export function startRun(db: Db, job: string, source: string | null): RunHandle {
  const r = db.prepare('INSERT INTO fetch_run (job, source_id) VALUES (?, ?) RETURNING id').get(job, source) as { id: number };
  return { id: r.id, rows: 0 };
}

export function finishRun(db: Db, run: RunHandle, status: 'ok' | 'failed', message?: string) {
  db.prepare(
    `UPDATE fetch_run SET status = ?, finished_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), rows_written = ?, message = ? WHERE id = ?`,
  ).run(status, run.rows, message ?? null, run.id);
}
