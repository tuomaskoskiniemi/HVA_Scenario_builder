import { config } from './config';
import type { Db } from './db';

export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string,
  ) {
    super(message);
  }
}

const lastRequestAt = new Map<string, number>();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function throttle(host: string) {
  const gap = config.hostDelayMs[host] ?? config.defaultHostDelayMs;
  const wait = (lastRequestAt.get(host) ?? 0) + gap - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequestAt.set(host, Date.now());
}

export interface RequestContext {
  db: Db;
  runId: number;
}

/**
 * GET or POST JSON with per-host throttling, retries on 429 / 5xx / network errors,
 * and every response stored in `raw_response` for later inspection.
 */
export async function requestJson<T>(ctx: RequestContext, url: string, body?: unknown): Promise<T> {
  const host = new URL(url).host;
  const method = body === undefined ? 'GET' : 'POST';
  const payload = body === undefined ? undefined : JSON.stringify(body);
  let lastErr: unknown;

  for (let attempt = 0; attempt <= config.retries; attempt++) {
    if (attempt > 0) await sleep(1000 * 2 ** (attempt - 1));
    await throttle(host);
    try {
      const res = await fetch(url, {
        method,
        body: payload,
        headers: {
          'User-Agent': config.userAgent,
          Accept: 'application/json',
          ...(payload ? { 'Content-Type': 'application/json' } : {}),
        },
        signal: AbortSignal.timeout(config.timeoutMs),
      });
      const text = await res.text();
      ctx.db
        .prepare('INSERT INTO raw_response (fetch_run_id, method, url, request_body, http_status, body) VALUES (?, ?, ?, ?, ?, ?)')
        .run(ctx.runId, method, url, payload ?? null, res.status, text);

      if (res.status === 429 || res.status >= 500) {
        lastErr = new HttpError(`${method} ${url} → ${res.status}`, res.status, text);
        continue;
      }
      if (!res.ok) throw new HttpError(`${method} ${url} → ${res.status}: ${text.slice(0, 300)}`, res.status, text);
      // StatFin prefixes JSON with a UTF-8 BOM.
      return JSON.parse(text.replace(/^﻿/, '')) as T;
    } catch (e) {
      if (e instanceof HttpError && e.status < 500 && e.status !== 429) throw e;
      lastErr = e;
    }
  }
  throw lastErr;
}
