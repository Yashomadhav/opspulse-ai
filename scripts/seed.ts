/**
 * OpsPulse AI — Database Seed Script
 *
 * Populates Supabase with initial sites, shifts, ops_metrics,
 * process_metrics, alerts, and recommendations.
 *
 * Usage:
 *   npm run seed
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import {
  generateOpsMetric,
  generateProcessMetrics,
  generateAlerts,
  generateRecommendations,
  SITES,
  SHIFTS,
} from "../lib/data-generator";

// ─── Supabase Admin Client ────────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ─── Seed Functions ───────────────────────────────────────────

async function seedSites() {
  console.log("🏭 Seeding sites...");
  const rows = SITES.map((s) => ({
    id: s.id,
    name: s.name,
    location: s.location,
    type: s.type,
  }));
  const { error } = await supabase.from("sites").upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`Sites seed failed: ${error.message}`);
  console.log(`   ✅ ${rows.length} sites seeded`);
}

async function seedShifts() {
  console.log("🕐 Seeding shifts...");
  const rows = SHIFTS.map((s) => ({
    id: s.id,
    site_id: s.siteId,
    name: s.name,
    start_time: s.startTime,
    end_time: s.endTime,
  }));
  const { error } = await supabase.from("shifts").upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`Shifts seed failed: ${error.message}`);
  console.log(`   ✅ ${rows.length} shifts seeded`);
}

async function seedOpsMetrics() {
  console.log("📊 Seeding ops_metrics (last 24 hours)...");

  const metrics = [];
  const now = new Date();

  // Generate 24 hours of data, one record per hour per shift
  for (let h = 23; h >= 0; h--) {
    const ts = new Date(now.getTime() - h * 60 * 60 * 1000);

    for (const shift of SHIFTS) {
      const metric = generateOpsMetric(
        shift.siteId,
        shift.id,
        shift.name,
        ts
      );

      metrics.push({
        id: metric.id,
        timestamp: metric.timestamp,
        site_id: metric.siteId,
        shift_id: metric.shiftId,
        incoming_orders: metric.incomingOrders,
        processed_orders: metric.processedOrders,
        backlog: metric.backlog,
        throughput_per_hour: metric.throughputPerHour,
        sla_attainment: metric.slaAttainment,
        avg_processing_time: metric.avgProcessingTime,
        active_staff: metric.activeStaff,
        required_staff: metric.requiredStaff,
        staffing_gap: metric.staffingGap,
        absenteeism_rate: metric.absenteeismRate,
        utilization_rate: metric.utilizationRate,
        risk_score: metric.riskScore,
        predicted_end_shift_backlog: metric.predictedEndShiftBacklog,
      });
    }
  }

  const { error } = await supabase.from("ops_metrics").upsert(metrics, { onConflict: "id" });
  if (error) throw new Error(`Ops metrics seed failed: ${error.message}`);
  console.log(`   ✅ ${metrics.length} ops metric records seeded`);
}

async function seedProcessMetrics() {
  console.log("⚙️  Seeding process_metrics (last 24 hours)...");

  const allProcessMetrics = [];
  const now = new Date();

  for (let h = 23; h >= 0; h--) {
    const ts = new Date(now.getTime() - h * 60 * 60 * 1000);

    for (const shift of SHIFTS) {
      const opsMetric = generateOpsMetric(shift.siteId, shift.id, shift.name, ts);
      const processMetrics = generateProcessMetrics(shift.siteId, shift.id, ts, opsMetric);

      for (const pm of processMetrics) {
        allProcessMetrics.push({
          id: pm.id,
          timestamp: pm.timestamp,
          site_id: pm.siteId,
          shift_id: pm.shiftId,
          process_stage: pm.processStage,
          processed_volume: pm.processedVolume,
          cycle_time: pm.cycleTime,
          delay_minutes: pm.delayMinutes,
          exception_count: pm.exceptionCount,
          stage_risk_score: pm.stageRiskScore,
        });
      }
    }
  }

  const { error } = await supabase.from("process_metrics").upsert(allProcessMetrics, { onConflict: "id" });
  if (error) throw new Error(`Process metrics seed failed: ${error.message}`);
  console.log(`   ✅ ${allProcessMetrics.length} process metric records seeded`);
}

async function seedAlerts() {
  console.log("🚨 Seeding alerts...");

  const allAlerts = [];
  const now = new Date();

  for (const shift of SHIFTS) {
    const opsMetric = generateOpsMetric(shift.siteId, shift.id, shift.name, now);
    const processMetrics = generateProcessMetrics(shift.siteId, shift.id, now, opsMetric);
    const alerts = generateAlerts(opsMetric, processMetrics);

    for (const alert of alerts) {
      allAlerts.push({
        id: alert.id,
        timestamp: alert.timestamp,
        site_id: alert.siteId,
        shift_id: alert.shiftId,
        severity: alert.severity,
        alert_type: alert.alertType,
        message: alert.message,
        status: alert.status,
      });
    }
  }

  const { error } = await supabase.from("alerts").upsert(allAlerts, { onConflict: "id" });
  if (error) throw new Error(`Alerts seed failed: ${error.message}`);
  console.log(`   ✅ ${allAlerts.length} alert records seeded`);
}

async function seedRecommendations() {
  console.log("💡 Seeding recommendations...");

  const allRecs = [];
  const now = new Date();

  for (const shift of SHIFTS) {
    const opsMetric = generateOpsMetric(shift.siteId, shift.id, shift.name, now);
    const processMetrics = generateProcessMetrics(shift.siteId, shift.id, now, opsMetric);
    const recs = generateRecommendations(opsMetric, processMetrics);

    for (const rec of recs) {
      allRecs.push({
        id: rec.id,
        timestamp: rec.timestamp,
        site_id: rec.siteId,
        shift_id: rec.shiftId,
        category: rec.category,
        priority: rec.priority,
        message: rec.message,
        expected_impact: rec.expectedImpact,
        business_reason: rec.businessReason,
      });
    }
  }

  const { error } = await supabase.from("recommendations").upsert(allRecs, { onConflict: "id" });
  if (error) throw new Error(`Recommendations seed failed: ${error.message}`);
  console.log(`   ✅ ${allRecs.length} recommendation records seeded`);
}

// ─── Main ─────────────────────────────────────────────────────

async function main() {
  console.log("\n🚀 OpsPulse AI — Database Seed Script");
  console.log("=====================================\n");

  try {
    await seedSites();
    await seedShifts();
    await seedOpsMetrics();
    await seedProcessMetrics();
    await seedAlerts();
    await seedRecommendations();

    console.log("\n✅ Database seeded successfully!\n");
  } catch (err) {
    console.error("\n❌ Seed failed:", err);
    process.exit(1);
  }
}

main();
