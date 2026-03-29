-- =============================================================
-- OpsPulse AI — Initial Database Schema
-- Run this in your Supabase SQL Editor or via migrations
-- =============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- TABLE: sites
-- =============================================================
CREATE TABLE IF NOT EXISTS sites (
  id          TEXT PRIMARY KEY,                    -- e.g. 'site-1'
  name        TEXT NOT NULL,
  location    TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('warehouse', 'fulfilment', 'last-mile')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE sites IS 'Operational sites (warehouses, fulfilment centres, hubs)';

-- =============================================================
-- TABLE: shifts
-- =============================================================
CREATE TABLE IF NOT EXISTS shifts (
  id          TEXT PRIMARY KEY,                    -- e.g. 'shift-s1-morning'
  site_id     TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name        TEXT NOT NULL CHECK (name IN ('Morning', 'Afternoon', 'Night')),
  start_time  TEXT NOT NULL,                       -- e.g. '06:00'
  end_time    TEXT NOT NULL,                       -- e.g. '14:00'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE shifts IS 'Shift definitions per site (Morning/Afternoon/Night)';

CREATE INDEX IF NOT EXISTS idx_shifts_site_id ON shifts(site_id);

-- =============================================================
-- TABLE: ops_metrics
-- Core operational metrics snapshot per site/shift/timestamp
-- =============================================================
CREATE TABLE IF NOT EXISTS ops_metrics (
  id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  timestamp                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  site_id                     TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  shift_id                    TEXT NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  incoming_orders             INTEGER NOT NULL DEFAULT 0,
  processed_orders            INTEGER NOT NULL DEFAULT 0,
  backlog                     INTEGER NOT NULL DEFAULT 0,
  throughput_per_hour         INTEGER NOT NULL DEFAULT 0,
  sla_attainment              NUMERIC(5,2) NOT NULL DEFAULT 0,   -- 0.00–100.00
  avg_processing_time         NUMERIC(6,2) NOT NULL DEFAULT 0,   -- minutes
  active_staff                INTEGER NOT NULL DEFAULT 0,
  required_staff              INTEGER NOT NULL DEFAULT 0,
  staffing_gap                INTEGER NOT NULL DEFAULT 0,
  absenteeism_rate            NUMERIC(5,2) NOT NULL DEFAULT 0,   -- 0.00–100.00
  utilization_rate            NUMERIC(5,2) NOT NULL DEFAULT 0,   -- 0.00–100.00
  risk_score                  INTEGER NOT NULL DEFAULT 0,         -- 0–100
  predicted_end_shift_backlog INTEGER NOT NULL DEFAULT 0,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE ops_metrics IS 'Time-series operational metrics per site and shift';

CREATE INDEX IF NOT EXISTS idx_ops_metrics_site_id    ON ops_metrics(site_id);
CREATE INDEX IF NOT EXISTS idx_ops_metrics_shift_id   ON ops_metrics(shift_id);
CREATE INDEX IF NOT EXISTS idx_ops_metrics_timestamp  ON ops_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ops_metrics_site_ts    ON ops_metrics(site_id, timestamp DESC);

-- =============================================================
-- TABLE: process_metrics
-- Per-stage process performance metrics
-- =============================================================
CREATE TABLE IF NOT EXISTS process_metrics (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  timestamp        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  site_id          TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  shift_id         TEXT NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  process_stage    TEXT NOT NULL CHECK (process_stage IN ('Inbound', 'Picking', 'Packing', 'Dispatch')),
  processed_volume INTEGER NOT NULL DEFAULT 0,
  cycle_time       NUMERIC(6,2) NOT NULL DEFAULT 0,    -- minutes per unit
  delay_minutes    NUMERIC(6,1) NOT NULL DEFAULT 0,
  exception_count  INTEGER NOT NULL DEFAULT 0,
  stage_risk_score INTEGER NOT NULL DEFAULT 0,          -- 0–100
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE process_metrics IS 'Per-stage process performance: cycle time, exceptions, delays';

CREATE INDEX IF NOT EXISTS idx_process_metrics_site_id      ON process_metrics(site_id);
CREATE INDEX IF NOT EXISTS idx_process_metrics_shift_id     ON process_metrics(shift_id);
CREATE INDEX IF NOT EXISTS idx_process_metrics_stage        ON process_metrics(process_stage);
CREATE INDEX IF NOT EXISTS idx_process_metrics_timestamp    ON process_metrics(timestamp DESC);

-- =============================================================
-- TABLE: alerts
-- Operational alerts feed
-- =============================================================
CREATE TABLE IF NOT EXISTS alerts (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  site_id     TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  shift_id    TEXT NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  severity    TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical', 'resolved')),
  alert_type  TEXT NOT NULL,
  message     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE alerts IS 'Live operational alerts with severity and status tracking';

CREATE INDEX IF NOT EXISTS idx_alerts_site_id   ON alerts(site_id);
CREATE INDEX IF NOT EXISTS idx_alerts_shift_id  ON alerts(shift_id);
CREATE INDEX IF NOT EXISTS idx_alerts_severity  ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_status    ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp DESC);

-- =============================================================
-- TABLE: recommendations
-- AI-generated operational recommendations
-- =============================================================
CREATE TABLE IF NOT EXISTS recommendations (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  site_id         TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  shift_id        TEXT NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  category        TEXT NOT NULL CHECK (category IN ('staffing', 'throughput', 'escalation', 'process', 'sla')),
  priority        TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  message         TEXT NOT NULL,
  expected_impact TEXT NOT NULL,
  business_reason TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE recommendations IS 'Rule-based operational recommendations with business context';

CREATE INDEX IF NOT EXISTS idx_recommendations_site_id   ON recommendations(site_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_shift_id  ON recommendations(shift_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_priority  ON recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_recommendations_timestamp ON recommendations(timestamp DESC);

-- =============================================================
-- ROW LEVEL SECURITY (RLS)
-- Enable for production — allows public read for dashboard
-- =============================================================

ALTER TABLE sites            ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_metrics      ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_metrics  ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations  ENABLE ROW LEVEL SECURITY;

-- Public read policies (dashboard is read-only for anon users)
CREATE POLICY "Allow public read on sites"
  ON sites FOR SELECT USING (true);

CREATE POLICY "Allow public read on shifts"
  ON shifts FOR SELECT USING (true);

CREATE POLICY "Allow public read on ops_metrics"
  ON ops_metrics FOR SELECT USING (true);

CREATE POLICY "Allow public read on process_metrics"
  ON process_metrics FOR SELECT USING (true);

CREATE POLICY "Allow public read on alerts"
  ON alerts FOR SELECT USING (true);

CREATE POLICY "Allow public read on recommendations"
  ON recommendations FOR SELECT USING (true);

-- Service role write policies (for seed scripts and API)
CREATE POLICY "Allow service role insert on ops_metrics"
  ON ops_metrics FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role insert on process_metrics"
  ON process_metrics FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role insert on alerts"
  ON alerts FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role insert on recommendations"
  ON recommendations FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role update on alerts"
  ON alerts FOR UPDATE USING (true);
