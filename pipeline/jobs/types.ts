import type { Db } from '../db';

export interface JobContext {
  db: Db;
  runId: number;
  /** Re-fetch even when data is already present (geocoding). */
  force: boolean;
  log: (msg: string) => void;
}

export interface Job {
  name: string;
  source: string | null;
  description: string;
  /** Returns the number of rows written. */
  run(ctx: JobContext): Promise<number>;
}
