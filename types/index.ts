// =============================================================
// OpsPulse AI — Core Type Definitions
// =============================================================

// ─── Enums ────────────────────────────────────────────────────

export type SiteId = "site-1" | "site-2";
export type ShiftName = "Morning" | "Afternoon" | "Night";
export type ProcessStage = "Inbound" | "Picking" | "Packing" | "Dispatch";
export type RiskLevel = "Low" | "Medium" | "High" | "Critical";
export type AlertSeverity = "info" | "warning" | "critical" | "resolved";
export type AlertStatus = "active" | "acknowledged" | "resolved";
export type RecommendationCategory =
  | "staffing"
  | "throughput"
  | "escalation"
  | "process"
  | "sla";
export type RecommendationPriority = "low" | "medium" | "high" | "urgent";

// ─── Core Entities ────────────────────────────────────────────

export interface Site {
  id: SiteId;
  name: string;
  location: string;
  type: "warehouse" | "fulfilment" | "last-mile";
}

export interface Shift {
  id: string;
  siteId: SiteId;
  name: ShiftName;
  startTime: string; // "06:00"
  endTime: string;   // "14:00"
}

// ─── Metrics ──────────────────────────────────────────────────

export interface OpsMetric {
  id: string;
  timestamp: string;
  siteId: SiteId;
  shiftId: string;
  incomingOrders: number;
  processedOrders: number;
  backlog: number;
  throughputPerHour: number;
  slaAttainment: number;       // 0–100 %
  avgProcessingTime: number;   // minutes
  activeStaff: number;
  requiredStaff: number;
  staffingGap: number;         // requiredStaff - activeStaff
  absenteeismRate: number;     // 0–100 %
  utilizationRate: number;     // 0–100 %
  riskScore: number;           // 0–100
  predictedEndShiftBacklog: number;
}

export interface ProcessMetric {
  id: string;
  timestamp: string;
  siteId: SiteId;
  shiftId: string;
  processStage: ProcessStage;
  processedVolume: number;
  cycleTime: number;           // minutes per unit
  delayMinutes: number;
  exceptionCount: number;
  stageRiskScore: number;      // 0–100
}

export interface Alert {
  id: string;
  timestamp: string;
  siteId: SiteId;
  shiftId: string;
  severity: AlertSeverity;
  alertType: string;
  message: string;
  status: AlertStatus;
  // Enriched fields from API
  siteName?: string;
  shiftName?: string;
}

export interface Recommendation {
  id: string;
  timestamp: string;
  siteId: SiteId;
  shiftId: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  message: string;
  expectedImpact: string;
  businessReason: string;
  // Enriched fields from API
  siteName?: string;
  shiftName?: string;
}

// ─── Bottleneck Analysis ──────────────────────────────────────

export interface Bottleneck {
  id: string;
  siteId: SiteId;
  shiftId: string;
  processStage: ProcessStage;
  severity: RiskLevel;
  likelyCause: string;
  slaImpact: string;
  suggestedAction: string;
  cycleTimeSpike: number;      // % above baseline
  throughputShortfall: number; // % below target
  backlogBuildUp: number;      // units
  exceptionCount: number;
  staffingShortage: number;    // headcount gap
  stageRiskScore: number;
}

// ─── Shift Summary ────────────────────────────────────────────

export interface ShiftSummary {
  shift: Shift;
  site: Site;
  metrics: OpsMetric;
  riskLevel: RiskLevel;
  statusBadge: string;
}

// ─── Dashboard KPIs ───────────────────────────────────────────

export interface DashboardKPIs {
  totalIncomingOrders: number;
  totalProcessedOrders: number;
  totalBacklog: number;
  avgThroughputPerHour: number;
  avgSlaAttainment: number;
  totalActiveStaff: number;
  totalRequiredStaff: number;
  totalStaffingGap: number;
  avgAbsenteeismRate: number;
  overallRiskScore: number;
  delayRiskScore: number;
}

// ─── Trend Data ───────────────────────────────────────────────

export interface TrendPoint {
  timestamp: string;
  label: string;
  value: number;
  value2?: number;
  site1?: number;
  site2?: number;
}

export interface ChartDataPoint {
  name: string;
  [key: string]: string | number;
}

// ─── Simulator ────────────────────────────────────────────────

export interface SimulatorInputs {
  siteId?: string;               // optional: target site for simulation (UI context only)
  shiftName?: string;            // optional: target shift for simulation (UI context only)
  demandIncrease: number;        // % increase in incoming orders
  absenteeismIncrease: number;   // % increase in absenteeism
  throughputDecrease: number;    // % decrease in throughput
  staffingChange: number;        // headcount change (+/-)
  processDelayIncrease: number;  // % increase in cycle time
}

export interface SimulatorResults {
  projectedBacklog: number;
  projectedSLA: number;
  projectedRiskScore: number;
  recommendedStaffingChange: number;
  expectedBottleneck: ProcessStage;
  backlogTrend: TrendPoint[];
  slaTrend: TrendPoint[];
  riskTrend: TrendPoint[];
  summary: string;
  warnings: string[];
}

// ─── API Response Types ───────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  timestamp: string;
}

export interface MetricsApiResponse {
  opsMetrics: OpsMetric[];
  processMetrics: ProcessMetric[];
  kpis: DashboardKPIs;
  throughputTrend: TrendPoint[];
  backlogTrend: TrendPoint[];
  slaTrend: TrendPoint[];
  staffingTrend: TrendPoint[];
  siteComparison: ChartDataPoint[];
  stageComparison: ChartDataPoint[];
}

// ─── Filter State ─────────────────────────────────────────────

export interface FilterState {
  siteId: SiteId | "all";
  shiftName: ShiftName | "all";
  processStage: ProcessStage | "all";
  dateRange: "today" | "last7days" | "last30days";
}
