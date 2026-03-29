-- =============================================================
-- OpsPulse AI — Seed Data
-- Run AFTER 001_initial_schema.sql
-- =============================================================

-- =============================================================
-- SITES
-- =============================================================
INSERT INTO sites (id, name, location, type) VALUES
  ('site-1', 'Northgate Fulfilment Centre', 'Manchester, UK', 'fulfilment'),
  ('site-2', 'Southpark Distribution Hub',  'Birmingham, UK', 'last-mile')
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- SHIFTS
-- =============================================================
INSERT INTO shifts (id, site_id, name, start_time, end_time) VALUES
  ('shift-s1-morning',   'site-1', 'Morning',   '06:00', '14:00'),
  ('shift-s1-afternoon', 'site-1', 'Afternoon', '14:00', '22:00'),
  ('shift-s1-night',     'site-1', 'Night',     '22:00', '06:00'),
  ('shift-s2-morning',   'site-2', 'Morning',   '06:00', '14:00'),
  ('shift-s2-afternoon', 'site-2', 'Afternoon', '14:00', '22:00'),
  ('shift-s2-night',     'site-2', 'Night',     '22:00', '06:00')
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- OPS METRICS — Sample historical data (last 6 hours)
-- =============================================================

-- Site 1 — Morning Shift (healthy)
INSERT INTO ops_metrics (
  id, timestamp, site_id, shift_id,
  incoming_orders, processed_orders, backlog,
  throughput_per_hour, sla_attainment, avg_processing_time,
  active_staff, required_staff, staffing_gap,
  absenteeism_rate, utilization_rate, risk_score, predicted_end_shift_backlog
) VALUES
  ('seed-m-s1-1', NOW() - INTERVAL '6 hours', 'site-1', 'shift-s1-morning',
   1050, 1020, 80, 175, 96.2, 3.1, 43, 45, 2, 4.4, 97.1, 12, 95),
  ('seed-m-s1-2', NOW() - INTERVAL '5 hours', 'site-1', 'shift-s1-morning',
   1120, 1080, 120, 178, 95.8, 3.2, 43, 45, 2, 4.4, 96.4, 15, 140),
  ('seed-m-s1-3', NOW() - INTERVAL '4 hours', 'site-1', 'shift-s1-morning',
   1180, 1100, 200, 172, 94.1, 3.4, 42, 45, 3, 6.7, 93.2, 22, 280),
  ('seed-m-s1-4', NOW() - INTERVAL '3 hours', 'site-1', 'shift-s1-morning',
   1240, 1150, 290, 168, 92.5, 3.6, 41, 45, 4, 8.9, 92.7, 31, 380),
  ('seed-m-s1-5', NOW() - INTERVAL '2 hours', 'site-1', 'shift-s1-morning',
   1300, 1180, 410, 162, 89.3, 3.9, 40, 45, 5, 11.1, 90.8, 44, 520),
  ('seed-m-s1-6', NOW() - INTERVAL '1 hour',  'site-1', 'shift-s1-morning',
   1350, 1200, 560, 155, 85.7, 4.2, 38, 45, 7, 15.6, 88.9, 58, 680),

-- Site 1 — Afternoon Shift (stressed)
  ('seed-a-s1-1', NOW() - INTERVAL '6 hours', 'site-1', 'shift-s1-afternoon',
   1100, 1050, 150, 170, 94.5, 3.3, 42, 45, 3, 6.7, 95.5, 20, 200),
  ('seed-a-s1-2', NOW() - INTERVAL '5 hours', 'site-1', 'shift-s1-afternoon',
   1200, 1100, 250, 165, 92.1, 3.5, 41, 45, 4, 8.9, 91.7, 28, 340),
  ('seed-a-s1-3', NOW() - INTERVAL '4 hours', 'site-1', 'shift-s1-afternoon',
   1280, 1140, 390, 158, 88.4, 3.8, 39, 45, 6, 13.3, 89.1, 42, 510),
  ('seed-a-s1-4', NOW() - INTERVAL '3 hours', 'site-1', 'shift-s1-afternoon',
   1320, 1160, 550, 150, 84.2, 4.1, 37, 45, 8, 17.8, 87.9, 56, 690),
  ('seed-a-s1-5', NOW() - INTERVAL '2 hours', 'site-1', 'shift-s1-afternoon',
   1380, 1180, 750, 142, 79.6, 4.5, 35, 45, 10, 22.2, 85.5, 68, 890),
  ('seed-a-s1-6', NOW() - INTERVAL '1 hour',  'site-1', 'shift-s1-afternoon',
   1400, 1190, 960, 135, 74.1, 4.9, 33, 45, 12, 26.7, 85.0, 78, 1100),

-- Site 2 — Morning Shift (moderate)
  ('seed-m-s2-1', NOW() - INTERVAL '6 hours', 'site-2', 'shift-s2-morning',
   820, 800, 60, 138, 97.1, 2.9, 33, 35, 2, 5.7, 97.6, 10, 70),
  ('seed-m-s2-2', NOW() - INTERVAL '5 hours', 'site-2', 'shift-s2-morning',
   880, 850, 90, 135, 96.4, 3.0, 33, 35, 2, 5.7, 96.6, 13, 110),
  ('seed-m-s2-3', NOW() - INTERVAL '4 hours', 'site-2', 'shift-s2-morning',
   920, 870, 140, 132, 94.8, 3.2, 32, 35, 3, 8.6, 94.6, 19, 175),
  ('seed-m-s2-4', NOW() - INTERVAL '3 hours', 'site-2', 'shift-s2-morning',
   960, 890, 210, 128, 92.3, 3.4, 31, 35, 4, 11.4, 92.7, 26, 260),
  ('seed-m-s2-5', NOW() - INTERVAL '2 hours', 'site-2', 'shift-s2-morning',
   1000, 910, 300, 124, 89.7, 3.6, 30, 35, 5, 14.3, 91.0, 34, 360),
  ('seed-m-s2-6', NOW() - INTERVAL '1 hour',  'site-2', 'shift-s2-morning',
   1040, 930, 410, 120, 86.2, 3.9, 29, 35, 6, 17.1, 89.4, 43, 470),

-- Site 2 — Night Shift (high stress)
  ('seed-n-s2-1', NOW() - INTERVAL '6 hours', 'site-2', 'shift-s2-night',
   650, 600, 100, 115, 91.5, 3.8, 26, 35, 9, 25.7, 92.3, 38, 180),
  ('seed-n-s2-2', NOW() - INTERVAL '5 hours', 'site-2', 'shift-s2-night',
   680, 610, 170, 110, 88.2, 4.1, 25, 35, 10, 28.6, 89.7, 47, 280),
  ('seed-n-s2-3', NOW() - INTERVAL '4 hours', 'site-2', 'shift-s2-night',
   700, 620, 250, 105, 84.6, 4.4, 24, 35, 11, 31.4, 88.6, 55, 390),
  ('seed-n-s2-4', NOW() - INTERVAL '3 hours', 'site-2', 'shift-s2-night',
   720, 630, 340, 100, 80.1, 4.7, 23, 35, 12, 34.3, 87.5, 63, 510),
  ('seed-n-s2-5', NOW() - INTERVAL '2 hours', 'site-2', 'shift-s2-night',
   740, 640, 440, 95,  75.3, 5.1, 22, 35, 13, 37.1, 86.5, 71, 640),
  ('seed-n-s2-6', NOW() - INTERVAL '1 hour',  'site-2', 'shift-s2-night',
   760, 650, 550, 90,  70.8, 5.5, 21, 35, 14, 40.0, 85.5, 79, 780)
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- PROCESS METRICS — Sample data
-- =============================================================
INSERT INTO process_metrics (
  id, timestamp, site_id, shift_id,
  process_stage, processed_volume, cycle_time, delay_minutes, exception_count, stage_risk_score
) VALUES
  -- Site 1 Morning — recent snapshot
  ('seed-pm-s1-inbound',  NOW() - INTERVAL '1 hour', 'site-1', 'shift-s1-morning', 'Inbound',  1200, 2.6, 5.2,  3,  18),
  ('seed-pm-s1-picking',  NOW() - INTERVAL '1 hour', 'site-1', 'shift-s1-morning', 'Picking',  1140, 5.1, 18.4, 12, 52),
  ('seed-pm-s1-packing',  NOW() - INTERVAL '1 hour', 'site-1', 'shift-s1-morning', 'Packing',  1080, 3.8, 11.2, 7,  38),
  ('seed-pm-s1-dispatch', NOW() - INTERVAL '1 hour', 'site-1', 'shift-s1-morning', 'Dispatch', 1020, 2.1, 3.8,  2,  14),

  -- Site 1 Afternoon — stressed
  ('seed-pm-a1-inbound',  NOW() - INTERVAL '1 hour', 'site-1', 'shift-s1-afternoon', 'Inbound',  1190, 3.1, 12.4, 8,  35),
  ('seed-pm-a1-picking',  NOW() - INTERVAL '1 hour', 'site-1', 'shift-s1-afternoon', 'Picking',  1130, 6.2, 32.1, 18, 72),
  ('seed-pm-a1-packing',  NOW() - INTERVAL '1 hour', 'site-1', 'shift-s1-afternoon', 'Packing',  1070, 4.5, 22.8, 11, 58),
  ('seed-pm-a1-dispatch', NOW() - INTERVAL '1 hour', 'site-1', 'shift-s1-afternoon', 'Dispatch', 1010, 2.8, 8.4,  5,  28),

  -- Site 2 Morning
  ('seed-pm-s2-inbound',  NOW() - INTERVAL '1 hour', 'site-2', 'shift-s2-morning', 'Inbound',  930, 2.9, 4.8,  2,  15),
  ('seed-pm-s2-picking',  NOW() - INTERVAL '1 hour', 'site-2', 'shift-s2-morning', 'Picking',  885, 5.4, 16.2, 9,  44),
  ('seed-pm-s2-packing',  NOW() - INTERVAL '1 hour', 'site-2', 'shift-s2-morning', 'Packing',  840, 3.9, 9.6,  5,  32),
  ('seed-pm-s2-dispatch', NOW() - INTERVAL '1 hour', 'site-2', 'shift-s2-morning', 'Dispatch', 795, 2.3, 4.1,  2,  16),

  -- Site 2 Night — high stress
  ('seed-pm-n2-inbound',  NOW() - INTERVAL '1 hour', 'site-2', 'shift-s2-night', 'Inbound',  650, 3.8, 18.2, 9,  48),
  ('seed-pm-n2-picking',  NOW() - INTERVAL '1 hour', 'site-2', 'shift-s2-night', 'Picking',  618, 7.1, 48.6, 22, 82),
  ('seed-pm-n2-packing',  NOW() - INTERVAL '1 hour', 'site-2', 'shift-s2-night', 'Packing',  585, 5.2, 31.4, 14, 65),
  ('seed-pm-n2-dispatch', NOW() - INTERVAL '1 hour', 'site-2', 'shift-s2-night', 'Dispatch', 553, 3.1, 12.8, 6,  38)
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- ALERTS — Sample active alerts
-- =============================================================
INSERT INTO alerts (id, timestamp, site_id, shift_id, severity, alert_type, message, status) VALUES
  ('seed-alert-1', NOW() - INTERVAL '45 minutes', 'site-1', 'shift-s1-afternoon',
   'critical', 'Backlog Spike',
   'Backlog reached 960 units — critical level detected at Northgate Fulfilment Centre',
   'active'),

  ('seed-alert-2', NOW() - INTERVAL '38 minutes', 'site-1', 'shift-s1-afternoon',
   'critical', 'SLA Risk',
   'SLA attainment at 74.1% — below critical threshold. Afternoon shift requires immediate action.',
   'active'),

  ('seed-alert-3', NOW() - INTERVAL '32 minutes', 'site-2', 'shift-s2-night',
   'critical', 'High Risk Score',
   'Operations risk score at 79/100 — escalation recommended for Southpark Distribution Hub. Predicted end-of-shift backlog: 780 units.',
   'active'),

  ('seed-alert-4', NOW() - INTERVAL '28 minutes', 'site-1', 'shift-s1-afternoon',
   'warning', 'Absenteeism',
   'Absenteeism rate at 26.7% — 12 staff below required headcount. Operational capacity at risk.',
   'active'),

  ('seed-alert-5', NOW() - INTERVAL '22 minutes', 'site-2', 'shift-s2-night',
   'critical', 'Stage Bottleneck',
   'Picking stage bottleneck detected — cycle time 7.1m/unit with 22 exceptions. Delay impact: 49 minutes.',
   'active'),

  ('seed-alert-6', NOW() - INTERVAL '18 minutes', 'site-1', 'shift-s1-afternoon',
   'warning', 'Throughput Below Target',
   'Throughput at 135 units/hr — 25% below target of 180 units/hr.',
   'active'),

  ('seed-alert-7', NOW() - INTERVAL '15 minutes', 'site-2', 'shift-s2-night',
   'warning', 'Absenteeism',
   'Absenteeism rate at 40.0% — 14 staff below required headcount. Night shift severely understaffed.',
   'active'),

  ('seed-alert-8', NOW() - INTERVAL '10 minutes', 'site-1', 'shift-s1-morning',
   'warning', 'Backlog Spike',
   'Backlog reached 560 units — elevated level detected at Northgate Fulfilment Centre',
   'active'),

  ('seed-alert-9', NOW() - INTERVAL '8 minutes', 'site-2', 'shift-s2-morning',
   'info', 'SLA Risk',
   'SLA attainment at 86.2% — below warning threshold. Morning shift monitoring required.',
   'acknowledged'),

  ('seed-alert-10', NOW() - INTERVAL '5 minutes', 'site-1', 'shift-s1-afternoon',
   'critical', 'Stage Bottleneck',
   'Picking stage bottleneck detected — cycle time 6.2m/unit with 18 exceptions. Delay impact: 32 minutes.',
   'active')
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- RECOMMENDATIONS — Sample recommendations
-- =============================================================
INSERT INTO recommendations (
  id, timestamp, site_id, shift_id, category, priority, message, expected_impact, business_reason
) VALUES
  ('seed-rec-1', NOW() - INTERVAL '40 minutes', 'site-1', 'shift-s1-afternoon',
   'staffing', 'urgent',
   'Add 12 temporary associates to Northgate Fulfilment Centre for Afternoon shift to close staffing gap.',
   'Throughput increase of ~96 units/hr. Backlog reduction of ~720 units by end of shift.',
   'Current staffing gap of 12 headcount is reducing throughput by an estimated 27% and contributing to backlog growth.'),

  ('seed-rec-2', NOW() - INTERVAL '35 minutes', 'site-1', 'shift-s1-afternoon',
   'staffing', 'high',
   'Reallocate 3 associates from Dispatch to Picking to address bottleneck at Northgate Fulfilment Centre.',
   'Picking cycle time reduction of ~15%. Exception count expected to drop by 30%.',
   'Picking stage has a risk score of 72/100 with cycle time 6.2m/unit — 107% above baseline.'),

  ('seed-rec-3', NOW() - INTERVAL '30 minutes', 'site-1', 'shift-s1-afternoon',
   'escalation', 'urgent',
   'Escalate Northgate Fulfilment Centre to Operations Manager — risk score 78/100 requires senior intervention.',
   'Faster resource mobilisation. Estimated 25% risk score reduction within 1 hour with management intervention.',
   'Multiple risk factors converging: backlog 960 units, SLA 74.1%, staffing gap 12. Automated recovery insufficient.'),

  ('seed-rec-4', NOW() - INTERVAL '25 minutes', 'site-2', 'shift-s2-night',
   'staffing', 'urgent',
   'Add 14 temporary associates to Southpark Distribution Hub for Night shift to close staffing gap.',
   'Throughput increase of ~112 units/hr. Backlog reduction of ~840 units by end of shift.',
   'Current staffing gap of 14 headcount is reducing throughput by an estimated 40% and contributing to backlog growth.'),

  ('seed-rec-5', NOW() - INTERVAL '20 minutes', 'site-2', 'shift-s2-night',
   'throughput', 'urgent',
   'Increase throughput target by 18% for Night shift to recover SLA attainment above 95%.',
   'SLA attainment recovery to ~82.8% within 2 hours. Backlog clearance by end of shift.',
   'SLA attainment at 70.8% is below the 95% target. Current backlog of 550 units requires accelerated processing.'),

  ('seed-rec-6', NOW() - INTERVAL '15 minutes', 'site-2', 'shift-s2-night',
   'process', 'medium',
   'Review Picking exception handling process — 22 exceptions detected this interval.',
   'Exception reduction of ~40%. Cycle time improvement of ~0.5 min/unit. Throughput gain of ~10 units/hr.',
   'High exception count in Picking is causing rework loops and increasing average cycle time from baseline.'),

  ('seed-rec-7', NOW() - INTERVAL '10 minutes', 'site-1', 'shift-s1-morning',
   'throughput', 'medium',
   'Increase throughput target by 12% for Morning shift to recover SLA attainment above 95%.',
   'SLA attainment recovery to ~91.7% within 2 hours. Backlog clearance by end of shift.',
   'SLA attainment at 85.7% is below the 95% target. Current backlog of 560 units requires accelerated processing.'),

  ('seed-rec-8', NOW() - INTERVAL '5 minutes', 'site-2', 'shift-s2-morning',
   'sla', 'medium',
   'Pre-position 2 associates for reallocation to Picking if SLA continues to decline at Southpark Distribution Hub.',
   'Preventive action to maintain SLA above 90%. Estimated 8% throughput buffer created.',
   'SLA attainment trending down from 97.1% to 86.2% over last 6 hours. Early intervention prevents escalation.')
ON CONFLICT (id) DO NOTHING;
