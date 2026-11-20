/**
 * Data pipeline CLI.
 *
 *   npm run data -- seed                      reference data + curated service points + design baseline
 *   npm run data -- fetch [job ...|all]       fetch from external services (see `list`)
 *   npm run data -- derive                    recompute county totals and shares
 *   npm run data -- export                    write src/data/*.json for the frontend
 *   npm run data -- update                    fetch all → derive → export
 *   npm run data -- status                    recent runs and row counts
 *   npm run data -- list                      available jobs
 *
 * Flags: --force (re-geocode everything), --db <file>
 */
import { config } from './config';
import { finishRun, openDb, startRun, type Db } from './db';
import { loadReference } from './reference';
import { derive, driveTimes, geocodeJob, health } from './jobs/other';
import { exportJob, seed } from './jobs/seed-export';
import { education, employment, income, population, projection } from './jobs/statfin';
import type { Job } from './jobs/types';

/** Fetch jobs in dependency order (geocode before drivetimes). */
const FETCH_JOBS: Job[] = [population, projection, employment, education, income, health, geocodeJob, driveTimes];
const ALL_JOBS: Job[] = [seed, ...FETCH_JOBS, derive, exportJob];

async function runJob(db: Db, job: Job, force: boolean): Promise<boolean> {
  const run = startRun(db, job.name, job.source);
  const t0 = Date.now();
  const log = (msg: string) => console.log(`  [${job.name}] ${msg}`);
  console.log(`▶ ${job.name} – ${job.description}`);
  try {
    run.rows = await job.run({ db, runId: run.id, force, log });
    finishRun(db, run, 'ok');
    console.log(`✓ ${job.name}: ${run.rows} rows in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    finishRun(db, run, 'failed', msg);
    console.error(`✗ ${job.name} failed: ${msg}`);
    return false;
  }
}

function status(db: Db) {
  console.log(`Database: ${config.dbPath}\n`);
  const counts = db
    .prepare(
      `SELECT i.source_id AS source, COUNT(*) AS n, SUM(o.status = 'derived') AS derived, MAX(o.updated_at) AS updated
       FROM observation o JOIN indicator i ON i.id = o.indicator_id GROUP BY i.source_id`,
    )
    .all();
  console.table(counts);
  console.table(db.prepare(`SELECT (SELECT COUNT(*) FROM service_point) AS service_points, (SELECT COUNT(*) FROM service_point WHERE lat IS NOT NULL) AS geocoded, (SELECT COUNT(*) FROM drive_time) AS drive_times`).all());
  console.log('Recent runs:');
  console.table(db.prepare(`SELECT id, job, status, rows_written AS rows, started_at, substr(message, 1, 80) AS message FROM fetch_run ORDER BY id DESC LIMIT 15`).all());
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const dbIdx = args.indexOf('--db');
  if (dbIdx >= 0) config.dbPath = args[dbIdx + 1];
  const positional = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--db');
  const [cmd = 'status', ...rest] = positional;

  const db = openDb();
  loadReference(db);
  let ok = true;

  const runAll = async (jobs: Job[]) => {
    for (const j of jobs) ok = (await runJob(db, j, force)) && ok;
  };

  switch (cmd) {
    case 'list':
      for (const j of ALL_JOBS) console.log(`${j.name.padEnd(12)} ${(j.source ?? '-').padEnd(10)} ${j.description}`);
      break;
    case 'status':
      status(db);
      break;
    case 'seed':
      await runAll([seed, derive]);
      break;
    case 'derive':
      await runAll([derive]);
      break;
    case 'export':
      await runAll([exportJob]);
      break;
    case 'fetch': {
      const names = rest.length === 0 || rest.includes('all') ? FETCH_JOBS.map((j) => j.name) : rest;
      const unknown = names.filter((n) => !FETCH_JOBS.some((j) => j.name === n));
      if (unknown.length) throw new Error(`Unknown job(s): ${unknown.join(', ')}. Run "list".`);
      await runAll(FETCH_JOBS.filter((j) => names.includes(j.name)));
      await runAll([derive]);
      break;
    }
    case 'update':
      await runAll([...FETCH_JOBS, derive, exportJob]);
      break;
    default:
      throw new Error(`Unknown command "${cmd}". Commands: seed, fetch, derive, export, update, status, list`);
  }
  db.close();
  process.exitCode = ok ? 0 : 1;
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
