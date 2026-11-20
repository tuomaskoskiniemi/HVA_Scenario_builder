-- Etelä-Pohjanmaan hyvinvointialue: project data
-- SQLite. Applied idempotently by pipeline/db.ts (CREATE ... IF NOT EXISTS).

PRAGMA foreign_keys = ON;

-- Where data comes from (Tilastokeskus StatFin, THL Sotkanet, OSRM, Nominatim, curated).
CREATE TABLE IF NOT EXISTS source (
  id          TEXT PRIMARY KEY,           -- 'statfin', 'sotkanet', 'osrm', 'nominatim', 'curated', 'design'
  name        TEXT NOT NULL,
  url         TEXT,
  license     TEXT,
  notes       TEXT
);

-- Geographic areas: the 18 municipalities, the wellbeing services county (sum of 18),
-- the Etelä-Pohjanmaa region (maakunta, 17 municipalities) and the whole country.
CREATE TABLE IF NOT EXISTS area (
  code        TEXT PRIMARY KEY,           -- 'KU743' (Tilastokeskus municipality code), 'HVA', 'MK14', 'SSS'
  kind        TEXT NOT NULL CHECK (kind IN ('municipality', 'wellbeing_county', 'region', 'country')),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE,                -- 'seinajoki'; used by the frontend
  lat         REAL,                       -- municipality centre (Nominatim)
  lon         REAL,
  map_x       REAL,                       -- position on the schematic 800 × 920 map
  map_y       REAL,
  geocode_query TEXT,
  geocoded_at TEXT
);

-- What is measured.
CREATE TABLE IF NOT EXISTS indicator (
  id          TEXT PRIMARY KEY,           -- 'pop_total', 'proj_0_6', 'sotkanet_5641', ...
  name        TEXT NOT NULL,
  unit        TEXT NOT NULL,              -- 'persons', 'percent', 'index', 'eur', 'per_mille', 'years'
  decimals    INTEGER NOT NULL DEFAULT 0,
  source_id   TEXT NOT NULL REFERENCES source(id),
  source_ref  TEXT,                       -- StatFin table id ('11re') or Sotkanet indicator id ('5641')
  description TEXT
);

-- The fact table: one value per indicator × area × period.
-- period: '2025' (year), '2023-2025' (multi-year), '2026-08' (month).
CREATE TABLE IF NOT EXISTS observation (
  indicator_id TEXT NOT NULL REFERENCES indicator(id),
  area_code    TEXT NOT NULL REFERENCES area(code),
  period       TEXT NOT NULL,
  value        REAL,                      -- NULL when not published
  status       TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'suppressed', 'missing', 'derived')),
  fetch_run_id INTEGER REFERENCES fetch_run(id),
  updated_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (indicator_id, area_code, period)
);
CREATE INDEX IF NOT EXISTS observation_area ON observation(area_code, period);

-- Service network (curated: hyvaep.fi publishes no API).
CREATE TABLE IF NOT EXISTS service_category (
  id          TEXT PRIMARY KEY,           -- 'sairaala', 'sote', 'ta', 'piste'
  name        TEXT NOT NULL,
  plural      TEXT NOT NULL,
  sort_order  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS service_point (
  id              TEXT PRIMARY KEY,       -- 'skssairaala', 's-seinajoki', ...
  category_id     TEXT NOT NULL REFERENCES service_category(id),
  name            TEXT NOT NULL,
  municipality_code TEXT NOT NULL REFERENCES area(code),
  address         TEXT,
  note            TEXT,
  location_method TEXT NOT NULL CHECK (location_method IN ('laitos', 'osoite', 'taajama')),
  geocode_query   TEXT NOT NULL,          -- what Nominatim is asked
  lat             REAL,
  lon             REAL,
  map_x           REAL,
  map_y           REAL,
  valid_from      TEXT,
  valid_to        TEXT,
  sort_order      INTEGER NOT NULL,
  geocoded_at     TEXT
);

-- Driving time / distance from each municipality centre to each service point (OSRM).
CREATE TABLE IF NOT EXISTS drive_time (
  service_point_id TEXT NOT NULL REFERENCES service_point(id) ON DELETE CASCADE,
  origin_code      TEXT NOT NULL REFERENCES area(code),
  duration_s       REAL NOT NULL,
  distance_m       REAL NOT NULL,
  fetch_run_id     INTEGER REFERENCES fetch_run(id),
  updated_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (service_point_id, origin_code)
);

-- One row per job execution: audit trail of what was fetched, when and with what result.
CREATE TABLE IF NOT EXISTS fetch_run (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  job         TEXT NOT NULL,
  source_id   TEXT REFERENCES source(id),
  started_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  finished_at TEXT,
  status      TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'ok', 'failed')),
  rows_written INTEGER NOT NULL DEFAULT 0,
  message     TEXT
);

-- Raw API responses, so a run can be inspected or re-parsed without re-fetching.
CREATE TABLE IF NOT EXISTS raw_response (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  fetch_run_id INTEGER NOT NULL REFERENCES fetch_run(id) ON DELETE CASCADE,
  method       TEXT NOT NULL,
  url          TEXT NOT NULL,
  request_body TEXT,
  http_status  INTEGER NOT NULL,
  body         TEXT NOT NULL,
  fetched_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Latest value per indicator × area, convenient for ad-hoc queries.
CREATE VIEW IF NOT EXISTS latest_observation AS
SELECT o.*
FROM observation o
JOIN (
  SELECT indicator_id, area_code, MAX(period) AS period
  FROM observation
  GROUP BY indicator_id, area_code
) l USING (indicator_id, area_code, period);
