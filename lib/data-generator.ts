// =============================================================
// OpsPulse AI — Synthetic Data Generator
// Generates realistic, time-evolving operational data
// =============================================================

import {
  Site,
  Shift,
  OpsMetric,
  ProcessMetric,
  Alert,
  Recommendation,
  SiteId,
  ShiftName,
  ProcessStage,
  AlertSeverity,
  AlertStatus,
  RecommendationCategory,
  RecommendationPriority,
} from "@/types";
import { generateId, randomBetween, randomInt, jitter, clamp } from "@/lib/utils";

// ─── Static Reference Data ────────────────────────────────────

export const SITES: Site[] = [
  {
    id: "site-1",
    name: "Northgate Fulfilment Centre",
    location: "Manchester, UK",
    type: "fulfilment",
  },
  {
    id: "site-2",
    name: "Southpark Distribution Hub",
    location: "Birmingham, UK",
    type: "last-mile",
  },
];

export const SHIFTS: Shift[] = [
  { id: "shift-s1-morning", siteId: "site-1", name: "Morning", startTime: "06:00", endTime: "14:00" },
  { id: "shift-s1-afternoon", siteId: "site-1", name: "Afternoon", startTime: "14:00", endTime: "22:00" },
  { id: "shift-s1-night", siteId: "site-1", name: "Night", startTime: "22:00", endTime: "06:00" },
  { id: "shift-s2-morning", siteId: "site-2", name: "Morning", startTime: "06:00", endTime: "14:00" },
  { id: "shift-s2-afternoon", siteId: "site-2", name: "Afternoon", startTime: "14:00", endTime: "22:00" },
  { id: "shift-s2-night", siteId: "site-2", name: "Night", startTime: "22:00", endTime: "06:00" },
];

export const PROCESS_STAGES: ProcessStage[] = ["Inbound", "Picking", "Packing", "Dispatch"];

// ─── Baseline Configuration ───────────────────────────────────

interface SiteBaseline {
  incomingOrders: { min: number; max: number };
  throughputTarget: number;
  requiredStaff: number;
  cycleTimeBaseline: Record<ProcessStage, number>; // minutes per unit
}

const SITE_BASELINES: Record<SiteId, SiteBaseline> = {
  "site-1": {
    incomingOrders: { min: 800, max: 1400 },
    throughputTarget: 180,
    requiredStaff: 45,
    cycleTimeBaseline: {
      Inbound: 2.5,
      Picking: 4.2,
      Packing: 3.1,
      Dispatch: 1.8,
    },
  },
  "site-2": {
    incomingOrders: { min: 600, max: 1100 },
    throughputTarget: 140,
    requiredStaff: 35,
    cycleTimeBaseline: {
      Inbound: 2.8,
      Picking: 4.8,
      Packing: 3.4,
      Dispatch: 2.1,
    },
  },
};

// ─── Time-of-Day Demand Multiplier ────────────────────────────

function getDemandMultiplier(hour: number): number {
  // Peak hours: 08:00–12:00 and 14:00–18:00
  if (hour >= 8 && hour < 12) return 1.3;
  if (hour >= 14 && hour < 18) return 1.2;
  if (hour >= 22 || hour < 4) return 0.6; // Night slowdown
  return 1.0;
}

// ─── Shift Stress Factor ──────────────────────────────────────
// Simulates fatigue / backlog accumulation within a shift

function getShiftStressFactor(shiftName: ShiftName): number {
  switch (shiftName) {
    case "Morning":   return 1.0;
    case "Afternoon": return 1.1; // slightly more stressed
    case "Night":     return 1.25; // reduced staff, higher stress
  }
}

// ─── Generate Single OpsMetric ────────────────────────────────

export function generateOpsMetric(
  siteId: SiteId,
  shiftId: string,
  shiftName: ShiftName,
  timestamp: Date,
  previousBacklog = 0,
  stressOverride?: number
): OpsMetric {
  const baseline = SITE_BASELINES[siteId];
  const hour = timestamp.getHours();
  const demandMult = getDemandMultiplier(hour);
  const stressFactor = stressOverride ?? getShiftStressFactor(shiftName);

  // Incoming orders — demand-driven with jitter
  const incomingOrders = Math.round(
    jitter(
      randomBetween(baseline.incomingOrders.min, baseline.incomingOrders.max) *
        demandMult,
      0.1
    )
  );

  // Absenteeism — higher at night, random spikes
  const baseAbsenteeism = shiftName === "Night" ? 12 : 6;
  const absenteeismRate = clamp(
    jitter(baseAbsenteeism * stressFactor, 0.3),
    0,
    35
  );

  // Active staff — reduced by absenteeism
  const requiredStaff = baseline.requiredStaff;
  const absentCount = Math.round((absenteeismRate / 100) * requiredStaff);
  const activeStaff = Math.max(requiredStaff - absentCount, 5);
  const staffingGap = Math.max(requiredStaff - activeStaff, 0);

  // Throughput — affected by staffing and stress
  const staffRatio = activeStaff / requiredStaff;
  const throughputPerHour = Math.round(
    jitter(baseline.throughputTarget * staffRatio * (1 / stressFactor), 0.12)
  );

  // Processed orders — throughput × time window (1 hour snapshot)
  const processedOrders = Math.min(
    throughputPerHour + previousBacklog > 0
      ? Math.round(jitter(throughputPerHour, 0.08))
      : throughputPerHour,
    incomingOrders + previousBacklog
  );

  // Backlog — accumulates when processed < incoming
  const backlog = Math.max(
    previousBacklog + incomingOrders - processedOrders,
    0
  );

  // SLA attainment — degrades with backlog and staffing gap
  const backlogPressure = Math.min(backlog / 500, 1); // normalised 0–1
  const staffingPressure = staffingGap / requiredStaff;
  const slaAttainment = clamp(
    jitter(
      98 - backlogPressure * 25 - staffingPressure * 20 - (stressFactor - 1) * 15,
      0.05
    ),
    40,
    99.5
  );

  // Avg processing time — increases with stress and backlog
  const avgProcessingTime = clamp(
    jitter(3.5 * stressFactor * (1 + backlogPressure * 0.5), 0.1),
    1.5,
    12
  );

  // Utilization rate
  const utilizationRate = clamp(
    (processedOrders / Math.max(incomingOrders, 1)) * 100,
    30,
    100
  );

  // Predicted end-of-shift backlog (simple linear projection)
  const hoursRemaining = 8 - (hour % 8); // rough hours left in shift
  const netFlowPerHour = incomingOrders - throughputPerHour;
  const predictedEndShiftBacklog = Math.max(
    backlog + netFlowPerHour * hoursRemaining,
    0
  );

  // Risk score — computed by risk engine (simplified inline here)
  const riskScore = computeRiskScore({
    backlog,
    previousBacklog,
    staffingGap,
    requiredStaff,
    throughputPerHour,
    throughputTarget: baseline.throughputTarget,
    absenteeismRate,
    slaAttainment,
    stressFactor,
  });

  return {
    id: generateId("metric"),
    timestamp: timestamp.toISOString(),
    siteId,
    shiftId,
    incomingOrders,
    processedOrders,
    backlog,
    throughputPerHour,
    slaAttainment: Math.round(slaAttainment * 10) / 10,
    avgProcessingTime: Math.round(avgProcessingTime * 10) / 10,
    activeStaff,
    requiredStaff,
    staffingGap,
    absenteeismRate: Math.round(absenteeismRate * 10) / 10,
    utilizationRate: Math.round(utilizationRate * 10) / 10,
    riskScore: Math.round(riskScore),
    predictedEndShiftBacklog: Math.round(predictedEndShiftBacklog),
  };
}

// ─── Inline Risk Score (used during generation) ───────────────

function computeRiskScore(params: {
  backlog: number;
  previousBacklog: number;
  staffingGap: number;
  requiredStaff: number;
  throughputPerHour: number;
  throughputTarget: number;
  absenteeismRate: number;
  slaAttainment: number;
  stressFactor: number;
}): number {
  let score = 0;

  // Backlog growth (0–25 pts)
  const backlogGrowth = params.backlog - params.previousBacklog;
  if (backlogGrowth > 200) score += 25;
  else if (backlogGrowth > 100) score += 18;
  else if (backlogGrowth > 50) score += 10;
  else if (backlogGrowth > 0) score += 5;

  // Staffing gap (0–25 pts)
  const staffingRatio = params.staffingGap / Math.max(params.requiredStaff, 1);
  score += clamp(staffingRatio * 100, 0, 25);

  // Throughput shortfall (0–20 pts)
  const throughputRatio =
    params.throughputPerHour / Math.max(params.throughputTarget, 1);
  if (throughputRatio < 0.7) score += 20;
  else if (throughputRatio < 0.85) score += 12;
  else if (throughputRatio < 0.95) score += 6;

  // Absenteeism (0–15 pts)
  if (params.absenteeismRate > 20) score += 15;
  else if (params.absenteeismRate > 12) score += 10;
  else if (params.absenteeismRate > 8) score += 5;

  // SLA degradation (0–15 pts)
  if (params.slaAttainment < 70) score += 15;
  else if (params.slaAttainment < 80) score += 10;
  else if (params.slaAttainment < 90) score += 5;

  return clamp(score, 0, 100);
}

// ─── Generate Process Metrics ─────────────────────────────────

export function generateProcessMetrics(
  siteId: SiteId,
  shiftId: string,
  timestamp: Date,
  opsMetric: OpsMetric
): ProcessMetric[] {
  const baseline = SITE_BASELINES[siteId];
  const stressFactor = opsMetric.riskScore / 50 + 0.8; // derived from risk

  return PROCESS_STAGES.map((stage) => {
    const baseCycleTime = baseline.cycleTimeBaseline[stage];
    const cycleTime = clamp(
      jitter(baseCycleTime * stressFactor, 0.15),
      baseCycleTime * 0.7,
      baseCycleTime * 2.5
    );

    // Volume distribution across stages (Picking is typically highest)
    const stageVolumeMultiplier: Record<ProcessStage, number> = {
      Inbound: 1.0,
      Picking: 0.95,
      Packing: 0.9,
      Dispatch: 0.85,
    };

    const processedVolume = Math.round(
      opsMetric.processedOrders * stageVolumeMultiplier[stage] * jitter(1, 0.08)
    );

    const delayMinutes = clamp(
      (cycleTime - baseCycleTime) * processedVolume * 0.01,
      0,
      120
    );

    const exceptionCount = randomInt(
      0,
      Math.round(processedVolume * 0.02 * stressFactor)
    );

    // Stage risk score
    const cycleTimeSpike = ((cycleTime - baseCycleTime) / baseCycleTime) * 100;
    const stageRiskScore = clamp(
      cycleTimeSpike * 0.4 +
        (exceptionCount / Math.max(processedVolume, 1)) * 1000 +
        (delayMinutes / 60) * 20,
      0,
      100
    );

    return {
      id: generateId("proc"),
      timestamp: timestamp.toISOString(),
      siteId,
      shiftId,
      processStage: stage,
      processedVolume,
      cycleTime: Math.round(cycleTime * 100) / 100,
      delayMinutes: Math.round(delayMinutes * 10) / 10,
      exceptionCount,
      stageRiskScore: Math.round(stageRiskScore),
    };
  });
}

// ─── Generate Alerts ──────────────────────────────────────────

export function generateAlerts(
  opsMetric: OpsMetric,
  processMetrics: ProcessMetric[],
  existingAlerts: Alert[] = []
): Alert[] {
  const alerts: Alert[] = [];
  const ts = new Date(opsMetric.timestamp);

  // Backlog spike alert
  if (opsMetric.backlog > 400) {
    alerts.push({
      id: generateId("alert"),
      timestamp: ts.toISOString(),
      siteId: opsMetric.siteId,
      shiftId: opsMetric.shiftId,
      severity: opsMetric.backlog > 700 ? "critical" : "warning",
      alertType: "Backlog Spike",
      message: `Backlog reached ${opsMetric.backlog} units — ${
        opsMetric.backlog > 700 ? "critical" : "elevated"
      } level detected at ${SITES.find((s) => s.id === opsMetric.siteId)?.name}`,
      status: "active",
    });
  }

  // SLA risk alert
  if (opsMetric.slaAttainment < 85) {
    alerts.push({
      id: generateId("alert"),
      timestamp: ts.toISOString(),
      siteId: opsMetric.siteId,
      shiftId: opsMetric.shiftId,
      severity: opsMetric.slaAttainment < 75 ? "critical" : "warning",
      alertType: "SLA Risk",
      message: `SLA attainment at ${opsMetric.slaAttainment.toFixed(1)}% — below ${
        opsMetric.slaAttainment < 75 ? "critical" : "warning"
      } threshold. Shift ${
        SHIFTS.find((s) => s.id === opsMetric.shiftId)?.name
      } requires immediate action.`,
      status: "active",
    });
  }

  // Absenteeism alert
  if (opsMetric.absenteeismRate > 15) {
    alerts.push({
      id: generateId("alert"),
      timestamp: ts.toISOString(),
      siteId: opsMetric.siteId,
      shiftId: opsMetric.shiftId,
      severity: opsMetric.absenteeismRate > 22 ? "critical" : "warning",
      alertType: "Absenteeism",
      message: `Absenteeism rate at ${opsMetric.absenteeismRate.toFixed(1)}% — ${
        opsMetric.staffingGap
      } staff below required headcount. Operational capacity at risk.`,
      status: "active",
    });
  }

  // Throughput below threshold
  const baseline = SITE_BASELINES[opsMetric.siteId];
  if (opsMetric.throughputPerHour < baseline.throughputTarget * 0.8) {
    alerts.push({
      id: generateId("alert"),
      timestamp: ts.toISOString(),
      siteId: opsMetric.siteId,
      shiftId: opsMetric.shiftId,
      severity: "warning",
      alertType: "Throughput Below Target",
      message: `Throughput at ${opsMetric.throughputPerHour} units/hr — ${Math.round(
        ((baseline.throughputTarget - opsMetric.throughputPerHour) /
          baseline.throughputTarget) *
          100
      )}% below target of ${baseline.throughputTarget} units/hr.`,
      status: "active",
    });
  }

  // Process stage bottleneck alerts
  processMetrics.forEach((pm) => {
    if (pm.stageRiskScore > 65) {
      alerts.push({
        id: generateId("alert"),
        timestamp: ts.toISOString(),
        siteId: pm.siteId,
        shiftId: pm.shiftId,
        severity: pm.stageRiskScore > 80 ? "critical" : "warning",
        alertType: "Stage Bottleneck",
        message: `${pm.processStage} stage bottleneck detected — cycle time ${pm.cycleTime.toFixed(
          1
        )}m/unit with ${pm.exceptionCount} exceptions. Delay impact: ${pm.delayMinutes.toFixed(
          0
        )} minutes.`,
        status: "active",
      });
    }
  });

  // High risk score alert
  if (opsMetric.riskScore >= 75) {
    alerts.push({
      id: generateId("alert"),
      timestamp: ts.toISOString(),
      siteId: opsMetric.siteId,
      shiftId: opsMetric.shiftId,
      severity: "critical",
      alertType: "High Risk Score",
      message: `Operations risk score at ${opsMetric.riskScore}/100 — escalation recommended for ${
        SITES.find((s) => s.id === opsMetric.siteId)?.name
      }. Predicted end-of-shift backlog: ${opsMetric.predictedEndShiftBacklog} units.`,
      status: "active",
    });
  }

  return alerts;
}

// ─── Generate Recommendations ─────────────────────────────────

export function generateRecommendations(
  opsMetric: OpsMetric,
  processMetrics: ProcessMetric[]
): Recommendation[] {
  const recs: Recommendation[] = [];
  const ts = new Date(opsMetric.timestamp);
  const site = SITES.find((s) => s.id === opsMetric.siteId);
  const shift = SHIFTS.find((s) => s.id === opsMetric.shiftId);

  // Staffing reallocation
  if (opsMetric.staffingGap > 3) {
    recs.push({
      id: generateId("rec"),
      timestamp: ts.toISOString(),
      siteId: opsMetric.siteId,
      shiftId: opsMetric.shiftId,
      category: "staffing",
      priority: opsMetric.staffingGap > 6 ? "urgent" : "high",
      message: `Add ${opsMetric.staffingGap} temporary associates to ${site?.name} for ${shift?.name} shift to close staffing gap.`,
      expectedImpact: `Throughput increase of ~${Math.round(
        opsMetric.staffingGap * 8
      )} units/hr. Backlog reduction of ~${Math.round(
        opsMetric.staffingGap * 60
      )} units by end of shift.`,
      businessReason: `Current staffing gap of ${opsMetric.staffingGap} headcount is reducing throughput by an estimated ${Math.round(
        (opsMetric.staffingGap / opsMetric.requiredStaff) * 100
      )}% and contributing to backlog growth.`,
    });
  }

  // Bottleneck reallocation
  const worstStage = processMetrics.reduce((a, b) =>
    a.stageRiskScore > b.stageRiskScore ? a : b
  );
  const bestStage = processMetrics.reduce((a, b) =>
    a.stageRiskScore < b.stageRiskScore ? a : b
  );

  if (worstStage.stageRiskScore > 50 && worstStage.processStage !== bestStage.processStage) {
    recs.push({
      id: generateId("rec"),
      timestamp: ts.toISOString(),
      siteId: opsMetric.siteId,
      shiftId: opsMetric.shiftId,
      category: "staffing",
      priority: "high",
      message: `Reallocate 3 associates from ${bestStage.processStage} to ${worstStage.processStage} to address bottleneck at ${site?.name}.`,
      expectedImpact: `${worstStage.processStage} cycle time reduction of ~15%. Exception count expected to drop by 30%.`,
      businessReason: `${worstStage.processStage} stage has a risk score of ${worstStage.stageRiskScore}/100 with cycle time ${worstStage.cycleTime.toFixed(
        1
      )}m/unit — ${Math.round(
        ((worstStage.cycleTime - 3) / 3) * 100
      )}% above baseline.`,
    });
  }

  // SLA recovery
  if (opsMetric.slaAttainment < 88) {
    const requiredThroughputIncrease = Math.round(
      ((opsMetric.backlog / 8) / Math.max(opsMetric.throughputPerHour, 1)) * 100
    );
    recs.push({
      id: generateId("rec"),
      timestamp: ts.toISOString(),
      siteId: opsMetric.siteId,
      shiftId: opsMetric.shiftId,
      category: "throughput",
      priority: opsMetric.slaAttainment < 78 ? "urgent" : "medium",
      message: `Increase throughput target by ${Math.min(requiredThroughputIncrease, 20)}% for ${shift?.name} shift to recover SLA attainment above 95%.`,
      expectedImpact: `SLA attainment recovery to ~${Math.min(
        opsMetric.slaAttainment + 12,
        98
      ).toFixed(1)}% within 2 hours. Backlog clearance by end of shift.`,
      businessReason: `SLA attainment at ${opsMetric.slaAttainment.toFixed(
        1
      )}% is below the 95% target. Current backlog of ${
        opsMetric.backlog
      } units requires accelerated processing.`,
    });
  }

  // Escalation recommendation
  if (opsMetric.riskScore >= 70) {
    recs.push({
      id: generateId("rec"),
      timestamp: ts.toISOString(),
      siteId: opsMetric.siteId,
      shiftId: opsMetric.shiftId,
      category: "escalation",
      priority: "urgent",
      message: `Escalate ${site?.name} to Operations Manager — risk score ${opsMetric.riskScore}/100 requires senior intervention.`,
      expectedImpact: `Faster resource mobilisation. Estimated 25% risk score reduction within 1 hour with management intervention.`,
      businessReason: `Multiple risk factors converging: backlog ${opsMetric.backlog} units, SLA ${opsMetric.slaAttainment.toFixed(
        1
      )}%, staffing gap ${opsMetric.staffingGap}. Automated recovery insufficient.`,
    });
  }

  // Process improvement
  if (worstStage.exceptionCount > 10) {
    recs.push({
      id: generateId("rec"),
      timestamp: ts.toISOString(),
      siteId: opsMetric.siteId,
      shiftId: opsMetric.shiftId,
      category: "process",
      priority: "medium",
      message: `Review ${worstStage.processStage} exception handling process — ${worstStage.exceptionCount} exceptions detected this interval.`,
      expectedImpact: `Exception reduction of ~40%. Cycle time improvement of ~0.5 min/unit. Throughput gain of ~10 units/hr.`,
      businessReason: `High exception count in ${worstStage.processStage} is causing rework loops and increasing average cycle time from baseline.`,
    });
  }

  return recs;
}

// ─── Generate Historical Time Series ─────────────────────────

export function generateHistoricalData(hoursBack = 24): {
  opsMetrics: OpsMetric[];
  processMetrics: ProcessMetric[];
  alerts: Alert[];
  recommendations: Recommendation[];
} {
  const opsMetrics: OpsMetric[] = [];
  const processMetrics: ProcessMetric[] = [];
  const alerts: Alert[] = [];
  const recommendations: Recommendation[] = [];

  const now = new Date();
  const startTime = new Date(now.getTime() - hoursBack * 60 * 60 * 1000);

  // Generate data every 30 minutes for each site/shift combination
  const activeShifts = SHIFTS;

  for (let i = 0; i <= hoursBack * 2; i++) {
    const timestamp = new Date(startTime.getTime() + i * 30 * 60 * 1000);

    activeShifts.forEach((shift) => {
      const prevMetric = opsMetrics
        .filter((m) => m.siteId === shift.siteId && m.shiftId === shift.id)
        .slice(-1)[0];

      const metric = generateOpsMetric(
        shift.siteId,
        shift.id,
        shift.name,
        timestamp,
        prevMetric?.backlog ?? 0
      );

      opsMetrics.push(metric);

      const procMetrics = generateProcessMetrics(
        shift.siteId,
        shift.id,
        timestamp,
        metric
      );
      processMetrics.push(...procMetrics);

      // Generate alerts and recommendations only for recent data (last 4 hours)
      if (i >= hoursBack * 2 - 8) {
        const newAlerts = generateAlerts(metric, procMetrics);
        alerts.push(...newAlerts);

        if (metric.riskScore > 30) {
          const newRecs = generateRecommendations(metric, procMetrics);
          recommendations.push(...newRecs);
        }
      }
    });
  }

  return { opsMetrics, processMetrics, alerts, recommendations };
}

// ─── Generate Current Snapshot ────────────────────────────────

export function generateCurrentSnapshot() {
  const now = new Date();
  const opsMetrics: OpsMetric[] = [];
  const processMetrics: ProcessMetric[] = [];

  SHIFTS.forEach((shift) => {
    const metric = generateOpsMetric(shift.siteId, shift.id, shift.name, now);
    opsMetrics.push(metric);
    const procMetrics = generateProcessMetrics(shift.siteId, shift.id, now, metric);
    processMetrics.push(...procMetrics);
  });

  const alerts = opsMetrics.flatMap((m, i) =>
    generateAlerts(m, processMetrics.slice(i * 4, i * 4 + 4))
  );

  const recommendations = opsMetrics.flatMap((m, i) =>
    m.riskScore > 25
      ? generateRecommendations(m, processMetrics.slice(i * 4, i * 4 + 4))
      : []
  );

  return { opsMetrics, processMetrics, alerts, recommendations };
}

// ─── Generate Trend Data ──────────────────────────────────────

export function generateTrendData(
  opsMetrics: OpsMetric[],
  intervalMinutes = 30,
  pointCount = 24
): {
  throughputTrend: Array<{ timestamp: string; label: string; site1: number; site2: number }>;
  backlogTrend: Array<{ timestamp: string; label: string; site1: number; site2: number }>;
  slaTrend: Array<{ timestamp: string; label: string; site1: number; site2: number }>;
  staffingTrend: Array<{ timestamp: string; label: string; active: number; required: number }>;
} {
  const now = new Date();
  const throughputTrend = [];
  const backlogTrend = [];
  const slaTrend = [];
  const staffingTrend = [];

  for (let i = pointCount - 1; i >= 0; i--) {
    const ts = new Date(now.getTime() - i * intervalMinutes * 60 * 1000);
    const label = ts.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    // Find closest metrics for each site
    const site1Metrics = opsMetrics.filter((m) => m.siteId === "site-1");
    const site2Metrics = opsMetrics.filter((m) => m.siteId === "site-2");

    const s1 = site1Metrics[Math.max(0, site1Metrics.length - 1 - i)] ?? site1Metrics[0];
    const s2 = site2Metrics[Math.max(0, site2Metrics.length - 1 - i)] ?? site2Metrics[0];

    if (s1 && s2) {
      throughputTrend.push({
        timestamp: ts.toISOString(),
        label,
        site1: s1.throughputPerHour,
        site2: s2.throughputPerHour,
      });

      backlogTrend.push({
        timestamp: ts.toISOString(),
        label,
        site1: s1.backlog,
        site2: s2.backlog,
      });

      slaTrend.push({
        timestamp: ts.toISOString(),
        label,
        site1: s1.slaAttainment,
        site2: s2.slaAttainment,
      });

      staffingTrend.push({
        timestamp: ts.toISOString(),
        label,
        active: s1.activeStaff + s2.activeStaff,
        required: s1.requiredStaff + s2.requiredStaff,
      });
    }
  }

  return { throughputTrend, backlogTrend, slaTrend, staffingTrend };
}

// ─── Compute Dashboard KPIs ───────────────────────────────────

export function computeKPIs(opsMetrics: OpsMetric[]) {
  if (opsMetrics.length === 0) {
    return {
      totalIncomingOrders: 0,
      totalProcessedOrders: 0,
      totalBacklog: 0,
      avgThroughputPerHour: 0,
      avgSlaAttainment: 0,
      totalActiveStaff: 0,
      totalRequiredStaff: 0,
      totalStaffingGap: 0,
      avgAbsenteeismRate: 0,
      overallRiskScore: 0,
      delayRiskScore: 0,
    };
  }

  const total = opsMetrics.length;

  return {
    totalIncomingOrders: opsMetrics.reduce((s, m) => s + m.incomingOrders, 0),
    totalProcessedOrders: opsMetrics.reduce((s, m) => s + m.processedOrders, 0),
    totalBacklog: opsMetrics.reduce((s, m) => s + m.backlog, 0),
    avgThroughputPerHour: Math.round(
      opsMetrics.reduce((s, m) => s + m.throughputPerHour, 0) / total
    ),
    avgSlaAttainment:
      Math.round(
        (opsMetrics.reduce((s, m) => s + m.slaAttainment, 0) / total) * 10
      ) / 10,
    totalActiveStaff: opsMetrics.reduce((s, m) => s + m.activeStaff, 0),
    totalRequiredStaff: opsMetrics.reduce((s, m) => s + m.requiredStaff, 0),
    totalStaffingGap: opsMetrics.reduce((s, m) => s + m.staffingGap, 0),
    avgAbsenteeismRate:
      Math.round(
        (opsMetrics.reduce((s, m) => s + m.absenteeismRate, 0) / total) * 10
      ) / 10,
    overallRiskScore: Math.round(
      opsMetrics.reduce((s, m) => s + m.riskScore, 0) / total
    ),
    delayRiskScore: Math.round(
      opsMetrics.reduce((s, m) => s + m.riskScore, 0) / total
    ),
  };
}
