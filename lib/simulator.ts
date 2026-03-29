// =============================================================
// OpsPulse AI — Scenario Simulator Engine
// What-if analysis for demand spikes, absenteeism, and staffing
// =============================================================

import { SimulatorInputs, SimulatorResults, ProcessStage, TrendPoint } from "@/types";
import { clamp, generateId } from "@/lib/utils";

// ─── Baseline Scenario Parameters ────────────────────────────

const BASELINE = {
  incomingOrdersPerHour: 160,
  throughputPerHour: 165,
  activeStaff: 40,
  requiredStaff: 45,
  absenteeismRate: 7,
  currentBacklog: 120,
  slaAttainment: 94.5,
  cycleTimeMinutes: 3.2,
  shiftHoursRemaining: 6,
  staffProductivityPerHead: 4.2, // units/hr per staff member
};

// ─── Stage Bottleneck Thresholds ─────────────────────────────

const STAGE_SENSITIVITY: Record<ProcessStage, number> = {
  Inbound: 0.8,   // less sensitive to demand spikes
  Picking: 1.2,   // most sensitive — highest volume
  Packing: 1.0,   // moderate sensitivity
  Dispatch: 0.9,  // downstream, absorbs upstream delays
};

// ─── Main Simulation Function ─────────────────────────────────

export function runSimulation(inputs: SimulatorInputs): SimulatorResults {
  const {
    demandIncrease,
    absenteeismIncrease,
    throughputDecrease,
    staffingChange,
    processDelayIncrease,
  } = inputs;

  // ── Adjusted Parameters ────────────────────────────────────

  // Incoming orders increase with demand
  const adjustedIncoming =
    BASELINE.incomingOrdersPerHour * (1 + demandIncrease / 100);

  // Absenteeism increases reduce active staff
  const adjustedAbsenteeism = clamp(
    BASELINE.absenteeismRate * (1 + absenteeismIncrease / 100),
    0,
    50
  );
  const absentCount = Math.round(
    (adjustedAbsenteeism / 100) * BASELINE.requiredStaff
  );
  const adjustedActiveStaff = clamp(
    BASELINE.activeStaff + staffingChange - absentCount,
    5,
    200
  );

  // Throughput affected by staffing change, throughput decrease, and process delay
  const staffRatio = adjustedActiveStaff / BASELINE.requiredStaff;
  const delayFactor = 1 / (1 + processDelayIncrease / 100);
  const adjustedThroughput = clamp(
    BASELINE.throughputPerHour *
      staffRatio *
      (1 - throughputDecrease / 100) *
      delayFactor,
    10,
    500
  );

  // ── Backlog Projection ─────────────────────────────────────

  const netFlowPerHour = adjustedIncoming - adjustedThroughput;
  const projectedBacklog = Math.max(
    BASELINE.currentBacklog +
      netFlowPerHour * BASELINE.shiftHoursRemaining,
    0
  );

  // ── SLA Projection ─────────────────────────────────────────

  const backlogPressure = Math.min(projectedBacklog / 800, 1);
  const staffingPressure = Math.max(
    (BASELINE.requiredStaff - adjustedActiveStaff) / BASELINE.requiredStaff,
    0
  );
  const demandPressure = Math.min(demandIncrease / 100, 0.5);

  const projectedSLA = clamp(
    BASELINE.slaAttainment -
      backlogPressure * 30 -
      staffingPressure * 20 -
      demandPressure * 15 -
      (throughputDecrease / 100) * 20,
    30,
    99.5
  );

  // ── Risk Score Projection ──────────────────────────────────

  let riskScore = 0;

  // Backlog contribution
  if (projectedBacklog > 800) riskScore += 30;
  else if (projectedBacklog > 500) riskScore += 22;
  else if (projectedBacklog > 300) riskScore += 15;
  else if (projectedBacklog > 150) riskScore += 8;

  // Staffing contribution
  const staffGap = Math.max(BASELINE.requiredStaff - adjustedActiveStaff, 0);
  riskScore += clamp((staffGap / BASELINE.requiredStaff) * 100 * 0.25, 0, 25);

  // Throughput contribution
  const throughputRatio = adjustedThroughput / BASELINE.throughputPerHour;
  if (throughputRatio < 0.6) riskScore += 25;
  else if (throughputRatio < 0.75) riskScore += 18;
  else if (throughputRatio < 0.85) riskScore += 12;
  else if (throughputRatio < 0.95) riskScore += 6;

  // SLA contribution
  if (projectedSLA < 70) riskScore += 20;
  else if (projectedSLA < 80) riskScore += 14;
  else if (projectedSLA < 90) riskScore += 8;

  const projectedRiskScore = clamp(Math.round(riskScore), 0, 100);

  // ── Recommended Staffing Change ────────────────────────────

  // Calculate staff needed to clear backlog + handle incoming
  const totalWorkload =
    projectedBacklog + adjustedIncoming * BASELINE.shiftHoursRemaining;
  const requiredThroughput = totalWorkload / BASELINE.shiftHoursRemaining;
  const throughputGap = Math.max(
    requiredThroughput - adjustedThroughput,
    0
  );
  const recommendedStaffingChange = Math.ceil(
    throughputGap / BASELINE.staffProductivityPerHead
  );

  // ── Expected Bottleneck ────────────────────────────────────

  const expectedBottleneck = identifyExpectedBottleneck(
    demandIncrease,
    throughputDecrease,
    processDelayIncrease,
    staffGap
  );

  // ── Trend Projections (12 intervals × 30 min) ─────────────

  const backlogTrend: TrendPoint[] = [];
  const slaTrend: TrendPoint[] = [];
  const riskTrend: TrendPoint[] = [];

  let runningBacklog = BASELINE.currentBacklog;
  let runningSLA = BASELINE.slaAttainment;

  for (let i = 0; i <= 12; i++) {
    const minutesFromNow = i * 30;
    const label = `+${minutesFromNow}m`;

    // Backlog evolves over time
    runningBacklog = Math.max(
      runningBacklog + (netFlowPerHour / 2), // per 30-min interval
      0
    );

    // SLA degrades as backlog grows
    const runningBacklogPressure = Math.min(runningBacklog / 800, 1);
    runningSLA = clamp(
      BASELINE.slaAttainment - runningBacklogPressure * 30 - staffingPressure * 20,
      30,
      99.5
    );

    // Risk score increases with backlog
    const runningRisk = clamp(
      projectedRiskScore * (runningBacklog / Math.max(projectedBacklog, 1)),
      0,
      100
    );

    backlogTrend.push({
      timestamp: new Date(Date.now() + minutesFromNow * 60 * 1000).toISOString(),
      label,
      value: Math.round(runningBacklog),
    });

    slaTrend.push({
      timestamp: new Date(Date.now() + minutesFromNow * 60 * 1000).toISOString(),
      label,
      value: Math.round(runningSLA * 10) / 10,
    });

    riskTrend.push({
      timestamp: new Date(Date.now() + minutesFromNow * 60 * 1000).toISOString(),
      label,
      value: Math.round(runningRisk),
    });
  }

  // ── Summary and Warnings ───────────────────────────────────

  const warnings = buildWarnings(
    projectedBacklog,
    projectedSLA,
    projectedRiskScore,
    staffGap,
    demandIncrease,
    absenteeismIncrease
  );

  const summary = buildSummary(
    inputs,
    projectedBacklog,
    projectedSLA,
    projectedRiskScore,
    recommendedStaffingChange,
    expectedBottleneck
  );

  return {
    projectedBacklog: Math.round(projectedBacklog),
    projectedSLA: Math.round(projectedSLA * 10) / 10,
    projectedRiskScore,
    recommendedStaffingChange,
    expectedBottleneck,
    backlogTrend,
    slaTrend,
    riskTrend,
    summary,
    warnings,
  };
}

// ─── Bottleneck Identifier ────────────────────────────────────

function identifyExpectedBottleneck(
  demandIncrease: number,
  throughputDecrease: number,
  processDelayIncrease: number,
  staffGap: number
): ProcessStage {
  // Score each stage based on sensitivity and input pressures
  const scores: Record<ProcessStage, number> = {
    Inbound: 0,
    Picking: 0,
    Packing: 0,
    Dispatch: 0,
  };

  // Demand increase hits Inbound first
  scores.Inbound += demandIncrease * STAGE_SENSITIVITY.Inbound;

  // Throughput decrease hits Picking hardest (highest volume)
  scores.Picking += throughputDecrease * STAGE_SENSITIVITY.Picking;
  scores.Packing += throughputDecrease * STAGE_SENSITIVITY.Packing * 0.8;

  // Process delay propagates to Dispatch
  scores.Dispatch += processDelayIncrease * STAGE_SENSITIVITY.Dispatch;

  // Staff gap affects Picking most (labour-intensive)
  scores.Picking += staffGap * 2;
  scores.Packing += staffGap * 1.5;

  // Return stage with highest score
  return (Object.entries(scores).reduce((a, b) =>
    a[1] > b[1] ? a : b
  )[0] as ProcessStage) ?? "Picking";
}

// ─── Warning Builder ──────────────────────────────────────────

function buildWarnings(
  projectedBacklog: number,
  projectedSLA: number,
  projectedRiskScore: number,
  staffGap: number,
  demandIncrease: number,
  absenteeismIncrease: number
): string[] {
  const warnings: string[] = [];

  if (projectedBacklog > 600) {
    warnings.push(
      `⚠ Projected backlog of ${Math.round(projectedBacklog)} units exceeds critical threshold (600). End-of-shift clearance unlikely without intervention.`
    );
  }

  if (projectedSLA < 80) {
    warnings.push(
      `⚠ Projected SLA attainment of ${projectedSLA.toFixed(1)}% is below the 95% target — SLA breach is highly likely.`
    );
  } else if (projectedSLA < 90) {
    warnings.push(
      `⚠ Projected SLA attainment of ${projectedSLA.toFixed(1)}% is at risk — corrective action recommended.`
    );
  }

  if (projectedRiskScore >= 75) {
    warnings.push(
      `⚠ Risk score of ${projectedRiskScore}/100 indicates critical operational stress. Escalation to Operations Manager recommended.`
    );
  }

  if (staffGap > 8) {
    warnings.push(
      `⚠ Staffing gap of ${staffGap} headcount will significantly reduce throughput capacity. Temporary staffing required.`
    );
  }

  if (demandIncrease > 30) {
    warnings.push(
      `⚠ ${demandIncrease}% demand increase will overwhelm current processing capacity. Pre-emptive staffing increase advised.`
    );
  }

  if (absenteeismIncrease > 50) {
    warnings.push(
      `⚠ ${absenteeismIncrease}% absenteeism increase is extreme. Contingency staffing plan should be activated.`
    );
  }

  return warnings;
}

// ─── Summary Builder ──────────────────────────────────────────

function buildSummary(
  inputs: SimulatorInputs,
  projectedBacklog: number,
  projectedSLA: number,
  projectedRiskScore: number,
  recommendedStaffingChange: number,
  expectedBottleneck: ProcessStage
): string {
  const scenarioDesc = buildScenarioDescription(inputs);

  const outcomeDesc =
    projectedRiskScore >= 75
      ? "This scenario results in critical operational stress"
      : projectedRiskScore >= 50
      ? "This scenario creates significant operational pressure"
      : projectedRiskScore >= 25
      ? "This scenario introduces moderate operational risk"
      : "This scenario has minimal operational impact";

  const actionDesc =
    recommendedStaffingChange > 0
      ? `Recommended action: add ${recommendedStaffingChange} staff to maintain SLA targets.`
      : "Current staffing is sufficient to manage this scenario.";

  return `${scenarioDesc} ${outcomeDesc} — projected backlog ${Math.round(
    projectedBacklog
  )} units, SLA ${projectedSLA.toFixed(1)}%, risk score ${projectedRiskScore}/100. Primary bottleneck expected at ${expectedBottleneck}. ${actionDesc}`;
}

function buildScenarioDescription(inputs: SimulatorInputs): string {
  const parts: string[] = [];
  if (inputs.demandIncrease > 0) parts.push(`+${inputs.demandIncrease}% demand`);
  if (inputs.absenteeismIncrease > 0) parts.push(`+${inputs.absenteeismIncrease}% absenteeism`);
  if (inputs.throughputDecrease > 0) parts.push(`-${inputs.throughputDecrease}% throughput`);
  if (inputs.staffingChange !== 0)
    parts.push(
      `${inputs.staffingChange > 0 ? "+" : ""}${inputs.staffingChange} staff`
    );
  if (inputs.processDelayIncrease > 0)
    parts.push(`+${inputs.processDelayIncrease}% process delay`);

  if (parts.length === 0) return "Baseline scenario (no changes applied).";
  return `Scenario: ${parts.join(", ")}.`;
}
