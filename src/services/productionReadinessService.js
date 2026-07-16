import { createBudgetState, canExecute, createPhase1Context, EXECUTION_MODES } from "./safetyEngine.js";
import { buildIntegrationCapabilityRegistry } from "../data/integrationCapabilityRegistry.js";
import { buildCredentialBoundaryReport } from "./credentialSecurityBoundary.js";

export const PRODUCTION_READINESS_SCHEMA_VERSION = "2.0.0";

const GATEWAY_STATUSES = new Set(["locked", "reviewRequired", "blocked"]);
const FORBIDDEN_GATEWAY_STATUSES = new Set(["enabled", "live", "production", "connected", "activeProduction"]);

function createId(prefix, material) {
  const text = JSON.stringify(material, Object.keys(material).sort());
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `kevirio:${prefix}:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function safeNumber(value) {
  if (value === null || value === undefined || typeof value === "boolean" || Array.isArray(value) || typeof value === "object") return { ok: false, value: 0 };
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric) || Number.isNaN(numeric) || numeric < 0) return { ok: false, value: 0 };
  return { ok: true, value: numeric };
}

function evaluateMockBudget(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {
      currency: "JPY",
      dataMode: "mock",
      period: "monthly",
      mockLimit: 0,
      mockUsed: 0,
      remaining: 0,
      status: "blocked",
      externalSpendEnabled: false,
      realChargeEnabled: false,
      reason: "Mock Budgetが未定義です。",
    };
  }
  const limit = safeNumber(input.mockLimit ?? input.monthlyBudgetLimit ?? 0);
  const used = safeNumber(input.mockUsed ?? input.monthlyUsed ?? 0);
  if (!limit.ok || !used.ok || limit.value <= 0) {
    return {
      currency: "JPY",
      dataMode: "mock",
      period: "monthly",
      mockLimit: 0,
      mockUsed: 0,
      remaining: 0,
      status: "blocked",
      externalSpendEnabled: false,
      realChargeEnabled: false,
      reason: "Mock Budget値が不正です。",
    };
  }
  const remaining = Math.max(limit.value - used.value, 0);
  const usageRate = limit.value ? used.value / limit.value : 1;
  return {
    currency: "JPY",
    dataMode: "mock",
    period: "monthly",
    mockLimit: limit.value,
    mockUsed: used.value,
    remaining,
    status: used.value >= limit.value ? "blocked" : usageRate >= 0.8 ? "warning" : "withinLimit",
    externalSpendEnabled: false,
    realChargeEnabled: false,
    reason: "Mock Budgetとして評価。実課金には接続していません。",
  };
}

function chooseOwnerNextAction(blockingReasons = []) {
  const priority = [
    ["SECURITY_REVIEW_NOT_PASSED", "Security Reviewを完了する"],
    ["EMERGENCY_STOP_NOT_VERIFIED", "Emergency Stopの遮断を確認する"],
    ["BUDGET_GUARD_BLOCKED", "Mock Budget Guardを確認する"],
    ["CREDENTIAL_BOUNDARY_NOT_VERIFIED", "Credential Boundaryを確認する"],
    ["INTEGRATION_NOT_VERIFIED", "最初に接続するProviderを選ぶ"],
    ["PROVIDER_TERMS_NOT_REVIEWED", "Provider規約を確認する"],
    ["PRIVACY_NOT_REVIEWED", "Privacy確認を完了する"],
    ["OBSERVABILITY_NOT_VERIFIED", "Observability要件を定義する"],
    ["ROLLBACK_NOT_VERIFIED", "Rollback手順を確認する"],
    ["OWNER_PRODUCTION_APPROVAL_MISSING", "Production承認条件を確認する"],
  ];
  return priority.find(([code]) => blockingReasons.includes(code))?.[1] || "最初に接続するProviderを選ぶ";
}

export function buildProductionGateway(input = {}) {
  const evaluationTime = input.evaluationTime;
  if (!evaluationTime || Number.isNaN(Date.parse(evaluationTime))) {
    return { ok: false, status: "blocked", errors: [{ code: "EVALUATION_TIME_REQUIRED", field: "evaluationTime", message: "Explicit evaluationTime is required." }] };
  }
  const requestedStatus = input.status || "locked";
  if (FORBIDDEN_GATEWAY_STATUSES.has(requestedStatus) || !GATEWAY_STATUSES.has(requestedStatus)) {
    return { ok: false, status: "blocked", errors: [{ code: "GATEWAY_STATUS_FORBIDDEN", field: "status", message: "Production Gateway cannot be enabled." }] };
  }
  const mockBudget = evaluateMockBudget(input.budget);
  const emergencyStopGuard = canExecute(createPhase1Context({
    executionMode: EXECUTION_MODES.DEVELOPMENT,
    actionType: "publish",
    isExternalRequest: true,
    emergencyStop: { active: Boolean(input.emergencyStopActive) },
    budgetLimits: createBudgetState({ monthlyBudgetLimit: 5, dailyBudgetLimit: 0.2 }),
    mockOnly: false,
  }));
  const credentialBoundary = input.credentialBoundary || buildCredentialBoundaryReport();
  const integrationRegistry = input.integrationRegistry || buildIntegrationCapabilityRegistry();
  const blockingReasons = [
    "OWNER_PRODUCTION_APPROVAL_MISSING",
    "SECURITY_REVIEW_NOT_PASSED",
    credentialBoundary.status === "pass" ? null : "CREDENTIAL_BOUNDARY_NOT_VERIFIED",
    integrationRegistry.ok ? "INTEGRATION_NOT_VERIFIED" : "INTEGRATION_REGISTRY_BLOCKED",
    emergencyStopGuard.blocked ? null : "EMERGENCY_STOP_NOT_VERIFIED",
    mockBudget.status === "blocked" ? "BUDGET_GUARD_BLOCKED" : null,
    "ROLLBACK_NOT_VERIFIED",
    "OBSERVABILITY_NOT_VERIFIED",
    "PROVIDER_TERMS_NOT_REVIEWED",
    "PRIVACY_NOT_REVIEWED",
    "ACTUAL_REVENUE_SOURCE_UNDEFINED",
    "INCIDENT_RESPONSE_UNDEFINED",
  ].filter(Boolean);

  const gateway = {
    gatewayId: createId("production-gateway", { evaluationTime, status: requestedStatus }),
    schemaVersion: PRODUCTION_READINESS_SCHEMA_VERSION,
    operatingMode: "mock",
    status: blockingReasons.length ? "locked" : "locked",
    externalExecutionEnabled: false,
    productionExecutionEnabled: false,
    actualRevenueConnected: false,
    ledgerAppendEnabled: false,
    emergencyStopAvailable: true,
    emergencyStopActive: Boolean(input.emergencyStopActive),
    budgetGuardEnforced: true,
    ownerProductionApproval: false,
    securityReviewPassed: false,
    integrationVerified: false,
    rollbackVerified: false,
    observabilityVerified: false,
    blockingReasons,
    ownerNextAction: chooseOwnerNextAction(blockingReasons),
  };
  return { ok: true, status: gateway.status, gateway, mockBudget, emergencyStopGuard, credentialBoundary, integrationRegistry, errors: [] };
}

export function validateProductionGateway(gateway) {
  const errors = [];
  if (!gateway || typeof gateway !== "object" || Array.isArray(gateway)) {
    return { valid: false, errors: [{ code: "GATEWAY_INVALID", field: "gateway", message: "Gateway must be an object." }] };
  }
  if (gateway.schemaVersion !== PRODUCTION_READINESS_SCHEMA_VERSION) errors.push({ code: "SCHEMA_VERSION_MISMATCH", field: "schemaVersion", message: "schemaVersion mismatch." });
  if (gateway.operatingMode !== "mock") errors.push({ code: "MODE_FORBIDDEN", field: "operatingMode", message: "Gateway must remain mock." });
  if (!GATEWAY_STATUSES.has(gateway.status) || FORBIDDEN_GATEWAY_STATUSES.has(gateway.status)) errors.push({ code: "STATUS_FORBIDDEN", field: "status", message: "Gateway status cannot enable production." });
  if (gateway.externalExecutionEnabled !== false) errors.push({ code: "EXTERNAL_FORBIDDEN", field: "externalExecutionEnabled", message: "External execution must be false." });
  if (gateway.productionExecutionEnabled !== false) errors.push({ code: "PRODUCTION_FORBIDDEN", field: "productionExecutionEnabled", message: "Production execution must be false." });
  if (gateway.actualRevenueConnected !== false) errors.push({ code: "ACTUAL_REVENUE_FORBIDDEN", field: "actualRevenueConnected", message: "Actual Revenue must remain disconnected." });
  if (gateway.ledgerAppendEnabled !== false) errors.push({ code: "LEDGER_FORBIDDEN", field: "ledgerAppendEnabled", message: "Ledger append must be false." });
  if (gateway.ownerProductionApproval !== false) errors.push({ code: "APPROVAL_FORBIDDEN", field: "ownerProductionApproval", message: "Owner production approval is not granted." });
  if (!Array.isArray(gateway.blockingReasons) || gateway.blockingReasons.length === 0) errors.push({ code: "BLOCKING_REASONS_REQUIRED", field: "blockingReasons", message: "Blocking reasons are required." });
  return { valid: errors.length === 0, errors };
}

export function buildProductionReadiness(evaluationTime, budget = {}) {
  const registry = buildIntegrationCapabilityRegistry();
  const credentialBoundary = buildCredentialBoundaryReport();
  const gatewayResult = buildProductionGateway({ evaluationTime, budget, credentialBoundary, integrationRegistry: registry });
  return {
    evaluationTime,
    registry,
    credentialBoundary,
    gateway: gatewayResult.gateway,
    mockBudget: gatewayResult.mockBudget,
    emergencyStopGuard: gatewayResult.emergencyStopGuard,
    ownerNextAction: gatewayResult.gateway?.ownerNextAction || "Security Reviewを完了する",
  };
}
