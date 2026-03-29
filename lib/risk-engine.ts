// =============================================================
// OpsPulse AI — Risk Scoring Engine
// Transparent, rule-based operational risk assessment
// =============================================================

import {
  OpsMetric,
  ProcessMetric,
  Bottleneck,
  RiskLevel,
  ProcessStage,
  SiteId,
} from "@/types";
import { clamp, generateId, getRiskLevel } from "@/lib/utils";

// ─── Risk Weight Configuration ────────────────────────────────

const RISK_WEIGHTS = {
  backlogGrowth: 0.25,      // 25% weight
  staffingGap: 0.25,        // 25% weight
  throughputShortfall: 0.20, // 20% weight
  absenteeism: 0.15,        // 15% weight
  slaDegradation: 0.15,     // 15% weight
} as const;

// ─── Throughput Targets by Site ───────────────────────────────

const THROUGHPUT_TARGETS: Record<SiteId, number> = {
  "site-1": 180,
  "site-2": 140,
};

// ─── Cycle Time Baselines by Stage ───────────────────────────

const CYCLE_TIME_BASELINES: Record<ProcessStage, number> = {
  Inbound: 2.65,
  Picking: 4.5,
  Packing: 3.25,
  Dispatch: 1.95,
};

// ─── Main Risk Score Calculator ───────────────────────────────

export interface RiskBreakdown {
  total: number;
  level: RiskLevel;
  components: {
    backlogGrowth: number;
    staffingGap: number;
    throughputShortfall: number;
    absenteeism: number;
    slaDegradation: number;
  };
  primaryDriver: string;
  explanation: string;
}

export function calculateRiskScore(
  metric: OpsMetric,
  previousMetric?: OpsMetric
): RiskBreakdown {
  // ── Component 1: Backlog Growth (0–100 raw, weighted 25%) ──
  const backlogGrowth = previousMetric
    ? metric.backlog - previousMetric.backlog
    : metric.backlog * 0.1; // assume 10% growth if no previous

  let backlogScore = 0;
  if (backlogGrowth > 300) backlogScore = 100;
  else if (backlogGrowth > 200) backlogScore = 80;
  else if (backlogGrowth > 100) backlogScore = 60;
  else if (backlogGrowth > 50) backlogScore = 40;
  else if (backlogGrowth > 20) backlogScore = 20;
  else if (backlogGrowth > 0) backlogScore = 10;

  // Also factor in absolute backlog level
  if (metric.backlog > 800) backlogScore = Math.max(backlogScore, 90);
  else if (metric.backlog > 500) backlogScore = Math.max(backlogScore, 60);
  else if (metric.backlog > 300) backlogScore = Math.max(backlogScore, 40);

  // ── Component 2: Staffing Gap (0–100 raw, weighted 25%) ────
  const staffingRatio = metric.staffingGap / Math.max(metric.requiredStaff, 1);
  const staffingScore = clamp(staffingRatio * 200, 0, 100); // 50% gap = 100 score

  // ── Component 3: Throughput Shortfall (0–100, weighted 20%) ─
  const target = THROUGHPUT_TARGETS[metric.siteId];
  const throughputRatio = metric.throughputPerHour / Math.max(target, 1);
  let throughputScore = 0;
  if (throughputRatio < 0.5) throughputScore = 100;
  else if (throughputRatio < 0.65) throughputScore = 80;
  else if (throughputRatio < 0.75) throughputScore = 60;
  else if (throughputRatio < 0.85) throughputScore = 40;
  else if (throughputRatio < 0.95) throughputScore = 20;

  // ── Component 4: Absenteeism (0–100, weighted 15%) ─────────
  let absenteeismScore = 0;
  if (metric.absenteeismRate > 30) absenteeismScore = 100;
  else if (metric.absenteeismRate > 22) absenteeismScore = 80;
  else if (metric.absenteeismRate > 15) absenteeismScore = 60;
  else if (metric.absenteeismRate > 10) absenteeismScore = 40;
  else if (metric.absenteeismRate > 6) absenteeismScore = 20;

  // ── Component 5: SLA Degradation (0–100, weighted 15%) ─────
  let slaScore = 0;
  if (metric.slaAttainment < 60) slaScore = 100;
  else if (metric.slaAttainment < 70) slaScore = 80;
  else if (metric.slaAttainment < 80) slaScore = 60;
  else if (metric.slaAttainment < 88) slaScore = 40;
  else if (metric.slaAttainment < 93) slaScore = 20;

  // ── Weighted Total ──────────────────────────────────────────
  const total = clamp(
    Math.round(
      backlogScore * RISK_WEIGHTS.backlogGrowth +
        staffingScore * RISK_WEIGHTS.staffingGap +
        throughputScore * RISK_WEIGHTS.throughputShortfall +
        absenteeismScore * RISK_WEIGHTS.absenteeism +
        slaScore * RISK_WEIGHTS.slaDegradation
    ),
    0,
    100
  );

  // ── Primary Driver ─────────────────────────────────────────
  const components = {
    backlogGrowth: Math.round(backlogScore * RISK_WEIGHTS.backlogGrowth),
    staffingGap: Math.round(staffingScore * RISK_WEIGHTS.staffingGap),
    throughputShortfall: Math.round(throughputScore * RISK_WEIGHTS.throughputShortfall),
    absenteeism: Math.round(absenteeismScore * RISK_WEIGHTS.absenteeism),
    slaDegradation: Math.round(slaScore * RISK_WEIGHTS.slaDegradation),
  };

  const primaryDriver = Object.entries(components).reduce((a, b) =>
    a[1] > b[1] ? a : b
  )[0];

  const driverLabels: Record<string, string> = {
    backlogGrowth: "Backlog Growth",
    staffingGap: "Staffing Gap",
    throughputShortfall: "Throughput Shortfall",
    absenteeism: "High Absenteeism",
    slaDegradation: "SLA Degradation",
  };

  const explanation = buildRiskExplanation(metric, components, primaryDriver);

  return {
    total,
    level: getRiskLevel(total),
    components,
    primaryDriver: driverLabels[primaryDriver] ?? primaryDriver,
    explanation,
  };
}

// ─── Risk Explanation Builder ─────────────────────────────────

function buildRiskExplanation(
  metric: OpsMetric,
  components: RiskBreakdown["components"],
  primaryDriver: string
): string {
  const parts: string[] = [];

  if (components.backlogGrowth > 15) {
    parts.push(`backlog at ${metric.backlog} units`);
  }
  if (components.staffingGap > 10) {
    parts.push(`${metric.staffingGap} staff below required headcount`);
  }
  if (components.throughputShortfall > 8) {
    parts.push(`throughput ${metric.throughputPerHour} units/hr below target`);
  }
  if (components.absenteeism > 6) {
    parts.push(`absenteeism at ${metric.absenteeismRate.toFixed(1)}%`);
  }
  if (components.slaDegradation > 6) {
    parts.push(`SLA attainment at ${metric.slaAttainment.toFixed(1)}%`);
  }

  if (parts.length === 0) return "Operations within normal parameters.";

  return `Primary driver: ${
    {
      backlogGrowth: "Backlog Growth",
      staffingGap: "Staffing Gap",
      throughputShortfall: "Throughput Shortfall",
      absenteeism: "High Absenteeism",
      slaDegradation: "SLA Degradation",
    }[primaryDriver] ?? primaryDriver
  }. Contributing factors: ${parts.join(", ")}.`;
}

// ─── Bottleneck Detector ──────────────────────────────────────

export function detectBottlenecks(
  processMetrics: ProcessMetric[],
  opsMetrics: OpsMetric | OpsMetric[]
): Bottleneck[] {
  const bottlenecks: Bottleneck[] = [];

  // Normalise to array
  const opsMetricsArray = Array.isArray(opsMetrics) ? opsMetrics : [opsMetrics];

  // Build a lookup: siteId+shiftId → OpsMetric
  const opsLookup = new Map<string, OpsMetric>();
  for (const om of opsMetricsArray) {
    opsLookup.set(`${om.siteId}-${om.shiftId}`, om);
  }

  // Group process metrics by site+shift+stage
  const byKey = processMetrics.reduce<Record<string, ProcessMetric[]>>(
    (acc, pm) => {
      const key = `${pm.siteId}-${pm.shiftId}-${pm.processStage}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(pm);
      return acc;
    },
    {}
  );

  Object.entries(byKey).forEach(([, metrics]) => {
    const latest = metrics[metrics.length - 1];
    if (!latest) return;

    // Find matching ops metric (fallback to first available)
    const opsMetric =
      opsLookup.get(`${latest.siteId}-${latest.shiftId}`) ??
      opsMetricsArray[0];

    if (!opsMetric) return;

    const stage = latest.processStage;
    const baseline = CYCLE_TIME_BASELINES[stage as ProcessStage];
    const cycleTimeSpike = ((latest.cycleTime - baseline) / baseline) * 100;
    const throughputTarget = THROUGHPUT_TARGETS[latest.siteId];
    const throughputShortfall = Math.max(
      0,
      ((throughputTarget - latest.processedVolume) / throughputTarget) * 100
    );

    // Only flag as bottleneck if risk score is meaningful
    if (latest.stageRiskScore < 20) return;

    const severity = getRiskLevel(latest.stageRiskScore);

    // Determine likely cause
    let likelyCause = "Normal operational variance";
    if (cycleTimeSpike > 40) {
      likelyCause = "Significant cycle time spike — possible equipment issue or process breakdown";
    } else if (latest.exceptionCount > 15) {
      likelyCause = "High exception rate causing rework loops and throughput degradation";
    } else if (opsMetric.staffingGap > 5) {
      likelyCause = "Understaffing reducing processing capacity at this stage";
    } else if (latest.delayMinutes > 30) {
      likelyCause = "Upstream delay propagating through the process chain";
    } else if (cycleTimeSpike > 20) {
      likelyCause = "Moderate cycle time increase — possible congestion or quality issues";
    }

    // SLA impact
    let slaImpact = "Minimal SLA impact";
    if (latest.stageRiskScore >= 75) {
      slaImpact = `Critical — estimated ${Math.round(latest.delayMinutes * 1.5)} min SLA delay if unresolved`;
    } else if (latest.stageRiskScore >= 50) {
      slaImpact = `Moderate — ${Math.round(latest.delayMinutes)} min delay risk to downstream stages`;
    } else if (latest.stageRiskScore >= 30) {
      slaImpact = `Low — ${Math.round(latest.delayMinutes * 0.5)} min potential delay if backlog grows`;
    }

    // Suggested action
    let suggestedAction = "Monitor and review at next interval";
    if (latest.stageRiskScore >= 75) {
      suggestedAction = `Immediate: Reallocate 3–5 associates to ${stage}. Escalate to shift manager. Review exception handling.`;
    } else if (latest.stageRiskScore >= 50) {
      suggestedAction = `Reallocate 2 associates to ${stage}. Review exception queue. Increase supervisor oversight.`;
    } else if (latest.stageRiskScore >= 30) {
      suggestedAction = `Monitor ${stage} closely. Pre-position 1 associate for reallocation if trend continues.`;
    }

    bottlenecks.push({
      id: generateId("bn"),
      siteId: latest.siteId,
      shiftId: latest.shiftId,
      processStage: stage as ProcessStage,
      severity,
      likelyCause,
      slaImpact,
      suggestedAction,
      cycleTimeSpike: Math.round(cycleTimeSpike * 10) / 10,
      throughputShortfall: Math.round(throughputShortfall * 10) / 10,
      backlogBuildUp: Math.round(latest.processedVolume * 0.05),
      exceptionCount: latest.exceptionCount,
      staffingShortage: opsMetric.staffingGap,
      stageRiskScore: latest.stageRiskScore,
    });
  });

  // Sort by risk score descending
  return bottlenecks.sort((a, b) => b.stageRiskScore - a.stageRiskScore);
}

// ─── Shift Risk Classifier ────────────────────────────────────

export function classifyShiftRisk(metric: OpsMetric): {
  level: RiskLevel;
  badge: string;
  color: string;
} {
  const level = getRiskLevel(metric.riskScore);

  const config: Record<RiskLevel, { badge: string; color: string }> = {
    Critical: { badge: "Critical Risk", color: "bg-red-500/10 text-red-500 border-red-500/20" },
    High: { badge: "High Risk", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
    Medium: { badge: "Medium Risk", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
    Low: { badge: "Low Risk", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  };

  return { level, ...config[level] };
}

// ─── Predicted End-of-Shift Backlog ───────────────────────────

export function predictEndOfShiftBacklog(
  currentBacklog: number,
  throughputPerHour: number,
  incomingPerHour: number,
  hoursRemaining: number
): number {
  const netFlowPerHour = incomingPerHour - throughputPerHour;
  return Math.max(currentBacklog + netFlowPerHour * hoursRemaining, 0);
}

// ─── SLA Risk Predictor ───────────────────────────────────────

export function predictSLARisk(metric: OpsMetric): {
  currentSLA: number;
  projectedSLA: number;
  atRisk: boolean;
  riskReason: string;
} {
  const backlogPressure = Math.min(metric.predictedEndShiftBacklog / 600, 1);
  const staffingPressure = metric.staffingGap / Math.max(metric.requiredStaff, 1);

  const projectedSLA = clamp(
    metric.slaAttainment - backlogPressure * 15 - staffingPressure * 10,
    40,
    99.5
  );

  const atRisk = projectedSLA < 95;

  let riskReason = "SLA on track";
  if (projectedSLA < 70) {
    riskReason = "Critical SLA breach predicted — immediate intervention required";
  } else if (projectedSLA < 80) {
    riskReason = "SLA breach likely — escalation recommended";
  } else if (projectedSLA < 90) {
    riskReason = "SLA at risk — corrective action needed within 1 hour";
  } else if (projectedSLA < 95) {
    riskReason = "SLA marginally at risk — monitor closely";
  }

  return {
    currentSLA: metric.slaAttainment,
    projectedSLA: Math.round(projectedSLA * 10) / 10,
    atRisk,
    riskReason,
  };
}

// ─── Staffing Recommendation Calculator ──────────────────────

export function calculateRequiredStaffing(
  currentBacklog: number,
  incomingPerHour: number,
  targetThroughput: number,
  hoursRemaining: number,
  currentStaff: number
): {
  requiredAdditionalStaff: number;
  targetThroughputRequired: number;
  explanation: string;
} {
  // To clear backlog + handle incoming within remaining hours
  const totalWorkload = currentBacklog + incomingPerHour * hoursRemaining;
  const targetThroughputRequired = Math.ceil(totalWorkload / Math.max(hoursRemaining, 1));

  // Assume each additional staff member adds ~8 units/hr throughput
  const throughputGap = Math.max(targetThroughputRequired - targetThroughput, 0);
  const requiredAdditionalStaff = Math.ceil(throughputGap / 8);

  const explanation =
    requiredAdditionalStaff > 0
      ? `To clear ${currentBacklog} unit backlog and process ${Math.round(
          incomingPerHour * hoursRemaining
        )} incoming orders in ${hoursRemaining}h, throughput must reach ${targetThroughputRequired} units/hr — requiring ${requiredAdditionalStaff} additional staff.`
      : "Current staffing is sufficient to meet end-of-shift targets.";

  return {
    requiredAdditionalStaff,
    targetThroughputRequired,
    explanation,
  };
}
