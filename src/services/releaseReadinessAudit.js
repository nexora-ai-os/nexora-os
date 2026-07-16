import { buildProductionReadiness, PRODUCTION_READINESS_SCHEMA_VERSION } from "./productionReadinessService.js";

function createAuditId(evaluationTime) {
  let hash = 2166136261;
  const text = `release-readiness:${evaluationTime}`;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `kevirio:release-audit:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function check(checkId, category, label, status, evidence, ownerActionRequired = "") {
  return { checkId, category, label, status, evidence, ownerActionRequired };
}

export function buildReleaseReadinessAudit({ evaluationTime, budget } = {}) {
  if (!evaluationTime || Number.isNaN(Date.parse(evaluationTime))) {
    return {
      ok: false,
      status: "blocked",
      errors: [{ code: "EVALUATION_TIME_REQUIRED", field: "evaluationTime", message: "Explicit evaluationTime is required." }],
    };
  }
  const readiness = buildProductionReadiness(evaluationTime, budget);
  const registry = readiness.registry;
  const gateway = readiness.gateway;
  const mockBudget = readiness.mockBudget;
  const checks = [
    check("git-build", "Git / Build", "Git・Buildは検証で確認", "notVerified", "実行結果をVerificationで確認する", "Commit前にBuildを再実行"),
    check("verification", "Verification", "既存Mock Flow検証", "notVerified", "実行結果をVerificationで確認する", "既存検証を再実行"),
    check("mock-loop", "Mock Business Flow", "Mock事業ループ", "pass", "Marketから改善提案までMockで一周済み", ""),
    check("credential-boundary", "Credential Boundary", "CredentialはClientへ出さない", readiness.credentialBoundary.status === "pass" ? "pass" : "blocked", "Credential値は読まず、禁止fieldをfail-closed", readiness.credentialBoundary.status === "pass" ? "" : "Credential Boundaryを修正"),
    check("integration-registry", "Integration Registry", "Integration一覧", registry.ok ? "pass" : "blocked", `${registry.totalProviders} Provider / ${registry.categories.length} Category`, registry.ok ? "" : "Registryを修正"),
    check("api-safety", "API Safety", "API Route安全境界", "notVerified", "今回API Routeは変更していない", "Route監査を別途実行"),
    check("gateway", "Production Gateway", "Production Gateway Locked", gateway?.status === "locked" ? "blocked" : "notVerified", "Default Locked / Unlock APIなし", "Production前Hard Gateを完了"),
    check("emergency-stop", "Emergency Stop", "Emergency Stop利用可能", gateway?.emergencyStopAvailable ? "pass" : "blocked", "safetyEngineでEmergency Stopを優先遮断", ""),
    check("budget", "Budget Guard", "Mock Budget Guard", mockBudget.status === "blocked" ? "blocked" : "pass", `Mock Budget status: ${mockBudget.status}`, mockBudget.status === "blocked" ? "Mock Budgetを設定" : ""),
    check("actual-revenue", "Actual Revenue", "Actual Revenue未接続", gateway?.actualRevenueConnected === false ? "blocked" : "notVerified", "実売上Source of Truth未定義", "Actual Revenue Source of Truthを定義"),
    check("ledger", "Ledger", "Ledger append無効", gateway?.ledgerAppendEnabled === false ? "blocked" : "notVerified", "Ledger appendは有効化していない", "Ledger設計レビュー"),
    check("external-publishing", "External Publishing", "SNS/CMS公開無効", gateway?.externalExecutionEnabled === false ? "blocked" : "notVerified", "外部公開は接続していない", "公開承認モデルを設計"),
    check("observability", "Observability", "監視・ログ", "notVerified", "本番監視未設計", "Observability要件を定義"),
    check("privacy", "Privacy", "Privacy確認", "notVerified", "Provider別Privacy確認未完了", "Privacy確認を完了"),
    check("incident-response", "Incident Response", "Incident Response", "notVerified", "インシデント手順未定義", "Incident Responseを定義"),
    check("rollback", "Rollback", "Rollback", "notVerified", "本番Rollback未検証", "Rollback手順を確認"),
  ];
  const blockingReasons = [
    ...(gateway?.blockingReasons || []),
    ...checks.filter((item) => item.status === "blocked").map((item) => item.checkId),
  ];
  return {
    ok: true,
    auditId: createAuditId(evaluationTime),
    evaluatedAt: evaluationTime,
    schemaVersion: PRODUCTION_READINESS_SCHEMA_VERSION,
    overallStatus: "productionBlocked",
    mockBusinessLoopReady: true,
    productionGatewayStatus: gateway?.status || "locked",
    checks,
    blockingReasons: [...new Set(blockingReasons)],
    ownerNextAction: readiness.ownerNextAction,
    productionExecution: false,
    externalExecution: false,
    readiness,
    errors: [],
  };
}

export function summarizeAudit(audit) {
  const checks = Array.isArray(audit?.checks) ? audit.checks : [];
  return {
    pass: checks.filter((item) => item.status === "pass").length,
    blocked: checks.filter((item) => item.status === "blocked").length,
    notVerified: checks.filter((item) => item.status === "notVerified").length,
  };
}
