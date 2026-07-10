import { canExecute, createPhase1Context, EXECUTION_MODES } from "./safetyEngine";

export const aiOrchestratorModes = [
  { id: "general", name: "General", provider: "Phase1-A Mock", role: "通常の判断・文章生成" },
  { id: "long", name: "Long / Review", provider: "Phase1-A Mock", role: "長文・仕様・レビュー" },
  { id: "research", name: "Research", provider: "Phase1-A Mock", role: "最新情報・競合・海外調査" },
  { id: "revenue", name: "Revenue", provider: "Phase1-A Mock", role: "収益判断・ROI・優先順位" },
  { id: "legal", name: "Legal", provider: "Phase1-A Mock", role: "法務・規約・コンプライアンス確認" },
  { id: "brand", name: "Brand", provider: "Phase1-A Mock", role: "ブランド表現・長期価値" },
  { id: "trend", name: "Trend", provider: "Phase1-A Mock", role: "トレンド・市場変化" },
  { id: "backup", name: "Backup", provider: "Phase1-A Mock", role: "障害時・無料枠活用" },
];

function blockedOrchestratorResult(guard) {
  return {
    ok: false,
    allowed: false,
    blocked: true,
    mock: false,
    noExternalRequest: true,
    reason: guard.reason,
    reasonCode: guard.reasonCode,
    approvalRequired: guard.approvalRequired,
    approvalReason: guard.approvalReason,
  };
}

function mockOrchestratorResult({ mode, guard }) {
  return {
    ok: true,
    allowed: true,
    blocked: false,
    mock: true,
    noExternalRequest: true,
    mode,
    selected: "phase1-a-internal-mock",
    fallbackUsed: false,
    provider: "local-mock",
    model: "phase1-a-mock",
    text: [
      "Phase1-A Mock Only.",
      "Safe Test is disabled in Phase1-A.",
      "No external request was sent.",
      `Guard: ${guard.reasonCode}`,
    ].join("\n"),
    governance: {
      ownerFinalDecision: true,
      externalExecution: false,
      secretsExposed: false,
      productionEnabled: false,
    },
  };
}

export async function runAIOrchestrator({
  message,
  mode = "general",
  provider = "auto",
  ownerApproved = false,
  executionMode = EXECUTION_MODES.DEVELOPMENT,
} = {}) {
  const guard = canExecute(createPhase1Context({
    executionMode,
    actionType: "ai-orchestrate",
    isExternalRequest: false,
    ownerApproved,
    approvalValid: ownerApproved === true,
    provider: { id: provider === "auto" ? "local-mock" : provider, status: "mock-only" },
    estimatedTaskCost: 0,
    estimatedWorkflowCost: 0,
    mockOnly: true,
  }));

  if (!guard.allowed) {
    return blockedOrchestratorResult(guard);
  }

  // Phase1-A intentionally returns before any network request. Do not add fetch here.
  return mockOrchestratorResult({ message, mode, provider, guard });

  /* Future network implementation must be added only after Phase1-A is closed. */
}
