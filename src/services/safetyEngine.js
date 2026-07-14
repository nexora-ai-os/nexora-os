export const EXECUTION_MODES = Object.freeze({
  DEVELOPMENT: "development",
  FREE: "free",
  SAFE_TEST: "safe-test",
  PRODUCTION: "production",
});

export const DEFAULT_BUDGET_LIMITS = Object.freeze({
  monthlyBudgetLimit: 5,
  dailyBudgetLimit: 0.2,
  perTaskLimit: 0.01,
  perWorkflowLimit: 0.05,
  highCostApprovalRequired: true,
  autoStopWhenBudgetExceeded: true,
});

export const defaultBudgetConfig = DEFAULT_BUDGET_LIMITS;

export const ALERT_LEVELS = Object.freeze({
  NORMAL: "normal",
  CAUTION: "caution",
  WARNING: "warning",
  CRITICAL: "critical",
  EMERGENCY: "emergency",
});

export const BLOCK_REASONS = Object.freeze({
  MISSING_CONTEXT: "missing_context",
  EMERGENCY_STOP: "emergency_stop",
  UNKNOWN_MODE: "unknown_execution_mode",
  PRODUCTION_DISABLED: "production_disabled",
  EXTERNAL_REQUEST_BLOCKED: "external_request_blocked",
  INVALID_PROVIDER: "invalid_provider",
  INVALID_BUDGET: "invalid_budget",
  INVALID_USAGE: "invalid_usage",
  DAILY_BUDGET_EXCEEDED: "daily_budget_exceeded",
  MONTHLY_BUDGET_EXCEEDED: "monthly_budget_exceeded",
  TASK_LIMIT_EXCEEDED: "task_limit_exceeded",
  WORKFLOW_LIMIT_EXCEEDED: "workflow_limit_exceeded",
  OWNER_APPROVAL_REQUIRED: "owner_approval_required",
  APPROVAL_INVALID: "approval_invalid",
  MOCK_ONLY_REQUIRED: "mock_only_required",
  UNKNOWN_ACTION: "unknown_action",
  OWNER_REQUIRED_ACTION: "owner_required_action",
  UNKNOWN_WORKFLOW_TYPE: "unknown_workflow_type",
  GUARD_ERROR: "guard_error",
});

const PHASE1_MOCK_ACTIONS = new Set([
  "api-status",
  "ai-chat",
  "ai-orchestrate",
  "workflow-execute",
  "workflow-auto-flow",
  "cost-estimate",
  "mock-campaign-create",
  "revenue.package.mock.generate",
  "content.revision.mock.generate",
  "publish.sandbox.mock.prepare",
]);

const OWNER_REQUIRED_ACTIONS = new Set([
  "api-connection-test",
  "external-api",
  "publish",
  "send",
  "webhook",
  "payment",
  "production",
  "delete",
  "contract",
  "customer-contact",
  "budget-limit-change",
  "emergency-stop-release",
]);

const ALLOWED_WORKFLOW_TYPES = new Set([
  "mock",
  "internal-mock",
  "workflow-execute",
  "workflow-auto-flow",
  "trend-to-revenue",
  "work-to-approval",
]);

const ALLOWED_PROVIDER_STATES = new Set([
  "mock-only",
  "configured-unverified",
  "not-configured",
  "planned",
  "disabled",
]);

function blockedResult(context = {}, reasonCode, reason, extra = {}) {
  const externalExecution = Boolean(context.isExternalRequest || extra.externalExecution);
  const approvalRequired = Boolean(extra.approvalRequired || extra.requiresApproval);
  return {
    allowed: false,
    blocked: true,
    approvalRequired,
    approvalReason: extra.approvalReason || (approvalRequired ? reason : ""),
    requiresApproval: approvalRequired,
    reason,
    reasonCode,
    alertLevel: extra.alertLevel || ALERT_LEVELS.NORMAL,
    usagePercentage: Number.isFinite(extra.usagePercentage) ? extra.usagePercentage : 0,
    emergencyStopTriggered: Boolean(extra.emergencyStopTriggered),
    executionMode: context.executionMode || EXECUTION_MODES.DEVELOPMENT,
    mockOnly: context.mockOnly !== false,
    mockExecution: false,
    externalExecution,
    checkedAt: new Date().toISOString(),
  };
}

function allowedResult(context, budgetState) {
  return {
    allowed: true,
    blocked: false,
    approvalRequired: false,
    approvalReason: "",
    requiresApproval: false,
    reason: "Phase1-A mock-only execution allowed.",
    reasonCode: "allowed_mock_only",
    alertLevel: budgetState.alertLevel,
    usagePercentage: budgetState.monthlyRate,
    emergencyStopTriggered: false,
    executionMode: context.executionMode,
    mockOnly: true,
    mockExecution: true,
    externalExecution: false,
    checkedAt: new Date().toISOString(),
  };
}

export function toSafeNumber(value) {
  if (value === null || value === undefined) return { ok: false, value: 0 };
  if (Array.isArray(value) || typeof value === "object" || typeof value === "boolean") return { ok: false, value: 0 };
  if (typeof value === "string" && value.trim() === "") return { ok: false, value: 0 };

  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric) || Number.isNaN(numeric) || numeric < 0) return { ok: false, value: 0 };
  return { ok: true, value: numeric };
}

function readSafeNumber(value) {
  const result = toSafeNumber(value);
  if (!result.ok) throw new Error(BLOCK_REASONS.INVALID_USAGE);
  return result.value;
}

function normalizeBudgetLimits(limits) {
  if (!limits || typeof limits !== "object" || Array.isArray(limits)) {
    return { ok: false, limits: null };
  }

  const monthly = toSafeNumber(limits.monthlyBudgetLimit);
  const daily = toSafeNumber(limits.dailyBudgetLimit);
  const task = toSafeNumber(limits.perTaskLimit);
  const workflow = toSafeNumber(limits.perWorkflowLimit);

  if (!monthly.ok || !daily.ok || !task.ok || !workflow.ok) return { ok: false, limits: null };
  if (monthly.value <= 0 || daily.value <= 0 || task.value <= 0 || workflow.value <= 0) return { ok: false, limits: null };

  return {
    ok: true,
    limits: {
      monthlyBudgetLimit: monthly.value,
      dailyBudgetLimit: daily.value,
      perTaskLimit: task.value,
      perWorkflowLimit: workflow.value,
      highCostApprovalRequired: limits.highCostApprovalRequired === true,
      autoStopWhenBudgetExceeded: limits.autoStopWhenBudgetExceeded !== false,
    },
  };
}

export function getAlertLevel(usagePercentage = 0) {
  const usage = toSafeNumber(usagePercentage);
  if (!usage.ok) return ALERT_LEVELS.EMERGENCY;
  if (usage.value >= 100) return ALERT_LEVELS.EMERGENCY;
  if (usage.value >= 95) return ALERT_LEVELS.CRITICAL;
  if (usage.value >= 80) return ALERT_LEVELS.WARNING;
  if (usage.value >= 50) return ALERT_LEVELS.CAUTION;
  return ALERT_LEVELS.NORMAL;
}

export function createBudgetState(overrides = {}) {
  const rawLimits = normalizeBudgetLimits({ ...DEFAULT_BUDGET_LIMITS, ...overrides });
  if (!rawLimits.ok) {
    return {
      ...DEFAULT_BUDGET_LIMITS,
      monthlyUsed: 0,
      dailyUsed: 0,
      monthlyRemaining: 0,
      dailyRemaining: 0,
      monthlyRate: 100,
      dailyRate: 100,
      alertLevel: ALERT_LEVELS.EMERGENCY,
      alertMessage: getBudgetAlertMessage(ALERT_LEVELS.EMERGENCY),
      emergencyStop: true,
    };
  }

  const monthlyUsed = toSafeNumber(overrides.monthlyUsed).ok ? toSafeNumber(overrides.monthlyUsed).value : 0;
  const dailyUsed = toSafeNumber(overrides.dailyUsed).ok ? toSafeNumber(overrides.dailyUsed).value : 0;
  const { limits } = rawLimits;
  const monthlyRemaining = Math.max(limits.monthlyBudgetLimit - monthlyUsed, 0);
  const dailyRemaining = Math.max(limits.dailyBudgetLimit - dailyUsed, 0);
  const monthlyRate = Math.min(100, (monthlyUsed / limits.monthlyBudgetLimit) * 100);
  const dailyRate = Math.min(100, (dailyUsed / limits.dailyBudgetLimit) * 100);
  const alertLevel = getAlertLevel(monthlyRate);
  const emergencyStop = Boolean(overrides.emergencyStop || alertLevel === ALERT_LEVELS.EMERGENCY);

  return {
    ...limits,
    monthlyUsed,
    dailyUsed,
    monthlyRemaining,
    dailyRemaining,
    monthlyRate,
    dailyRate,
    alertLevel,
    alertMessage: getBudgetAlertMessage(alertLevel),
    emergencyStop,
  };
}

export function getBudgetAlertMessage(alertLevel = ALERT_LEVELS.NORMAL) {
  if (alertLevel === ALERT_LEVELS.EMERGENCY) return "Emergency Stop: budget limit reached. Phase1-A blocks execution.";
  if (alertLevel === ALERT_LEVELS.CRITICAL) return "Budget critical: 95% reached. High-cost execution is blocked.";
  if (alertLevel === ALERT_LEVELS.WARNING) return "Budget warning: 80% reached. Monitor before continuing.";
  if (alertLevel === ALERT_LEVELS.CAUTION) return "Budget caution: 50% reached.";
  return "Budget is normal.";
}

export function evaluateBudgetState(state = {}, delta = 0) {
  const currentMonthly = readSafeNumber(state.monthlyUsed || 0);
  const currentDaily = readSafeNumber(state.dailyUsed || 0);
  const safeDelta = readSafeNumber(delta);
  return createBudgetState({
    ...state,
    monthlyUsed: currentMonthly + safeDelta,
    dailyUsed: currentDaily + safeDelta,
  });
}

function buildBudgetStateFromContext(context) {
  const normalized = normalizeBudgetLimits(context.budgetLimits);
  if (!normalized.ok) return { ok: false, state: null };

  const monthlyUsage = toSafeNumber(context.monthlyUsage);
  const dailyUsage = toSafeNumber(context.dailyUsage);
  if (!monthlyUsage.ok || !dailyUsage.ok) return { ok: false, state: null };

  return {
    ok: true,
    state: createBudgetState({
      ...normalized.limits,
      monthlyUsed: monthlyUsage.value,
      dailyUsed: dailyUsage.value,
      emergencyStop: Boolean(context.emergencyStop?.active || context.emergencyStop === true),
    }),
  };
}

function providerIsValid(provider) {
  if (!provider || typeof provider !== "object" || Array.isArray(provider)) return false;
  if (typeof provider.id !== "string" || !provider.id.trim()) return false;
  return ALLOWED_PROVIDER_STATES.has(provider.status);
}

function modeIsKnown(mode) {
  return Object.values(EXECUTION_MODES).includes(mode);
}

function workflowTypeIsKnown(type) {
  if (type === null || type === undefined || type === "") return true;
  return typeof type === "string" && ALLOWED_WORKFLOW_TYPES.has(type);
}

function actionRequiresOwner(actionType) {
  if (OWNER_REQUIRED_ACTIONS.has(actionType)) return true;
  return typeof actionType === "string" && OWNER_REQUIRED_ACTIONS.has(actionType.split(":")[0]);
}

export function canExecute(context) {
  try {
    if (!context || typeof context !== "object" || Array.isArray(context)) {
      return blockedResult({}, BLOCK_REASONS.MISSING_CONTEXT, "Execution context is required.", { emergencyStopTriggered: true, alertLevel: ALERT_LEVELS.EMERGENCY });
    }

    const executionMode = context.executionMode || EXECUTION_MODES.DEVELOPMENT;
    const checkedContext = { ...context, executionMode };

    if (checkedContext.emergencyStop?.active === true || checkedContext.emergencyStop === true) {
      return blockedResult(checkedContext, BLOCK_REASONS.EMERGENCY_STOP, "Emergency Stop is active.", {
        emergencyStopTriggered: true,
        alertLevel: ALERT_LEVELS.EMERGENCY,
        usagePercentage: 100,
      });
    }

    const budget = buildBudgetStateFromContext(checkedContext);

    if (!budget.ok) {
      return blockedResult(checkedContext, BLOCK_REASONS.EMERGENCY_STOP, "Budget state is invalid, so execution is blocked fail-closed.", {
        emergencyStopTriggered: true,
        alertLevel: ALERT_LEVELS.EMERGENCY,
        usagePercentage: 100,
      });
    }

    const budgetState = budget.state;
    if (budgetState.emergencyStop || budgetState.monthlyUsed >= budgetState.monthlyBudgetLimit || budgetState.dailyUsed >= budgetState.dailyBudgetLimit) {
      return blockedResult(checkedContext, BLOCK_REASONS.EMERGENCY_STOP, "Emergency Stop is active or budget is exhausted.", {
        emergencyStopTriggered: true,
        alertLevel: ALERT_LEVELS.EMERGENCY,
        usagePercentage: budgetState.monthlyRate,
      });
    }

    if (!modeIsKnown(executionMode)) {
      return blockedResult(checkedContext, BLOCK_REASONS.UNKNOWN_MODE, "Unknown execution mode is blocked.");
    }

    if (executionMode === EXECUTION_MODES.PRODUCTION) {
      return blockedResult(checkedContext, BLOCK_REASONS.PRODUCTION_DISABLED, "Production Mode is disabled in Phase1-A.", {
        approvalRequired: true,
        approvalReason: "Production Mode always requires Owner approval and is disabled in Phase1-A.",
      });
    }

    if (checkedContext.isExternalRequest === true) {
      return blockedResult(checkedContext, BLOCK_REASONS.EXTERNAL_REQUEST_BLOCKED, "External requests are blocked in Phase1-A.", {
        approvalRequired: true,
        approvalReason: "External execution requires Owner approval, Approval validity, Budget Guard, and a later phase.",
        externalExecution: true,
      });
    }

    if (!providerIsValid(checkedContext.provider)) {
      return blockedResult(checkedContext, BLOCK_REASONS.INVALID_PROVIDER, "Provider is not configured for safe Phase1-A execution.");
    }

    if (!PHASE1_MOCK_ACTIONS.has(checkedContext.actionType) && !actionRequiresOwner(checkedContext.actionType)) {
      return blockedResult(checkedContext, BLOCK_REASONS.UNKNOWN_ACTION, "Unknown action type is blocked fail-closed.");
    }

    if (!workflowTypeIsKnown(checkedContext.workflowType)) {
      return blockedResult(checkedContext, BLOCK_REASONS.UNKNOWN_WORKFLOW_TYPE, "Unknown workflow type is blocked fail-closed.");
    }

    if (actionRequiresOwner(checkedContext.actionType)) {
      return blockedResult(checkedContext, BLOCK_REASONS.OWNER_REQUIRED_ACTION, "This action requires Owner approval and is disabled in Phase1-A.", {
        approvalRequired: true,
        approvalReason: "External, production, send, payment, delete, or high-risk actions require Owner approval.",
      });
    }

    const estimatedTaskCost = toSafeNumber(checkedContext.estimatedTaskCost);
    const estimatedWorkflowCost = toSafeNumber(checkedContext.estimatedWorkflowCost);
    if (!estimatedTaskCost.ok || !estimatedWorkflowCost.ok) {
      return blockedResult(checkedContext, BLOCK_REASONS.INVALID_USAGE, "Estimated costs must be safe finite non-negative numbers.");
    }

    if (budgetState.dailyUsed + estimatedTaskCost.value + estimatedWorkflowCost.value >= budgetState.dailyBudgetLimit) {
      return blockedResult(checkedContext, BLOCK_REASONS.DAILY_BUDGET_EXCEEDED, "Daily budget would be exceeded.", {
        alertLevel: ALERT_LEVELS.EMERGENCY,
        usagePercentage: budgetState.dailyRate,
      });
    }

    if (budgetState.monthlyUsed + estimatedTaskCost.value + estimatedWorkflowCost.value >= budgetState.monthlyBudgetLimit) {
      return blockedResult(checkedContext, BLOCK_REASONS.MONTHLY_BUDGET_EXCEEDED, "Monthly budget would be exceeded.", {
        alertLevel: ALERT_LEVELS.EMERGENCY,
        usagePercentage: budgetState.monthlyRate,
      });
    }

    if (estimatedTaskCost.value > budgetState.perTaskLimit) {
      return blockedResult(checkedContext, BLOCK_REASONS.TASK_LIMIT_EXCEEDED, "Per-task budget limit would be exceeded.", {
        approvalRequired: true,
        approvalReason: "High-cost task requires Owner approval and Budget Guard.",
      });
    }

    if (estimatedWorkflowCost.value > budgetState.perWorkflowLimit) {
      return blockedResult(checkedContext, BLOCK_REASONS.WORKFLOW_LIMIT_EXCEEDED, "Per-workflow budget limit would be exceeded.", {
        approvalRequired: true,
        approvalReason: "High-cost workflow requires Owner approval and Budget Guard.",
      });
    }

    if (checkedContext.mockOnly !== true) {
      return blockedResult(checkedContext, BLOCK_REASONS.MOCK_ONLY_REQUIRED, "Phase1-A allows mock-only execution.");
    }

    if (executionMode !== EXECUTION_MODES.DEVELOPMENT) {
      return blockedResult(checkedContext, BLOCK_REASONS.MOCK_ONLY_REQUIRED, "Phase1-A mock execution is limited to Development Mode.");
    }

    return allowedResult(checkedContext, budgetState);
  } catch {
    return blockedResult({}, BLOCK_REASONS.GUARD_ERROR, "Safety Guard failed closed.", {
      emergencyStopTriggered: true,
      alertLevel: ALERT_LEVELS.EMERGENCY,
      usagePercentage: 100,
    });
  }
}

export function getRouterRecommendation(taskType = "general", mode = EXECUTION_MODES.DEVELOPMENT) {
  if (mode === EXECUTION_MODES.PRODUCTION) return { provider: "disabled", model: "production-disabled", requiresApproval: true };
  if (mode === EXECUTION_MODES.SAFE_TEST) return { provider: "local-mock", model: "safe-test-disabled", requiresApproval: true };
  if (mode === EXECUTION_MODES.FREE) return { provider: "local-mock", model: "free-mode-mock", requiresApproval: false };
  if (taskType === "research") return { provider: "local-mock", model: "mock-research", requiresApproval: false };
  if (taskType === "image") return { provider: "local-mock", model: "mock-render", requiresApproval: false };
  if (taskType === "audio") return { provider: "local-mock", model: "mock-audio", requiresApproval: false };
  return { provider: "local-mock", model: "mock", requiresApproval: false };
}

export function buildCostEstimate({ workflow = "mock", provider = "mock", amount = 1 }) {
  const safeAmount = toSafeNumber(amount);
  const normalizedAmount = safeAmount.ok ? safeAmount.value : 0;
  const multiplier = provider === "openai" ? 0.08 : provider === "claude" ? 0.09 : provider === "perplexity" ? 0.05 : provider === "gemini" ? 0.04 : 0.001;
  const cost = normalizedAmount * multiplier;
  return {
    workflow,
    provider,
    amount: normalizedAmount,
    estimatedCost: cost.toFixed(4),
    safeToRun: safeAmount.ok && cost <= DEFAULT_BUDGET_LIMITS.perTaskLimit,
    requiresApproval: !safeAmount.ok || cost > DEFAULT_BUDGET_LIMITS.perTaskLimit,
  };
}

export function createPhase1Context(overrides = {}) {
  return {
    executionMode: EXECUTION_MODES.DEVELOPMENT,
    actionType: "cost-estimate",
    isExternalRequest: false,
    ownerApproved: false,
    approvalValid: false,
    emergencyStop: { active: false },
    provider: { id: "local-mock", status: "mock-only" },
    estimatedTaskCost: 0,
    estimatedWorkflowCost: 0,
    dailyUsage: 0,
    monthlyUsage: 0,
    budgetLimits: DEFAULT_BUDGET_LIMITS,
    mockOnly: true,
    workflowId: null,
    employeeId: null,
    ...overrides,
  };
}
