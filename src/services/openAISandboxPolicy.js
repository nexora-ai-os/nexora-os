export const OPENAI_SANDBOX_SCHEMA_VERSION = "2.0.0";
export const OPENAI_SANDBOX_ACTION = "sandboxGenerateRevenueLanes";
export const OPENAI_SANDBOX_SCOPE = "openaiSandboxGeneration";
export const OPENAI_SANDBOX_PURPOSES = Object.freeze(["directServiceDraft", "affiliateDraft", "snsDraft"]);

export const OPENAI_SANDBOX_BUDGET_POLICY = Object.freeze({
  currency: "USD",
  maxRequestsPerOwnerAction: 1,
  maxRetries: 1,
  maxInputCharacters: 6000,
  maxOutputTokens: 800,
  timeoutMs: 30000,
  maxEstimatedCostUsd: 0.03,
  monthlySandboxLimitUsd: 1.00,
});

const BLOCKED_KEYS = /api.?key|credential|password|authorization|bearer|access.?token|refresh.?token|payment|email|phone|address|full.?name|health|personal.?data/i;
const ALLOWED_KEYS = new Set(["schemaVersion", "action", "operatingMode", "dataMode", "ownerApproved", "approvalScope", "productionExecution", "publishEnabled", "actualRevenueConnected", "ledgerAppend", "externalExecutionRequested", "externalExecutionScope", "sourceExportId", "correlationId", "sourceRevisionId", "purpose", "input", "requestedModelPolicy", "outputSchema", "idempotencyKey", "emergencyStopActive"]);

function plain(value) { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function scan(value, path = "request", seen = new Set()) {
  const errors = [];
  if (value && typeof value === "object") {
    if (seen.has(value)) return [{ code: "CIRCULAR_INPUT", field: path }];
    seen.add(value);
  }
  if (Array.isArray(value)) value.forEach((item, index) => errors.push(...scan(item, `${path}.${index}`, seen)));
  else if (plain(value)) Object.entries(value).forEach(([key, item]) => {
    if (BLOCKED_KEYS.test(key)) errors.push({ code: "PRIVATE_FIELD_FORBIDDEN", field: `${path}.${key}` });
    errors.push(...scan(item, `${path}.${key}`, seen));
  });
  return errors;
}
function finiteNonNegative(value) { return typeof value === "number" && Number.isFinite(value) && value >= 0; }

export function createOpenAISandboxIdempotencyKey(input) {
  return ["openai-sandbox-generation", input?.sourceExportId, input?.correlationId, input?.purpose, input?.sourceRevisionId || "base", input?.schemaVersion].join(":");
}

export function validateOpenAISandboxRequest(request) {
  const errors = plain(request) ? scan(request) : [{ code: "REQUEST_INVALID", field: "request" }];
  if (!plain(request)) return { valid: false, errors };
  for (const key of Object.keys(request)) if (!ALLOWED_KEYS.has(key)) errors.push({ code: "UNKNOWN_REQUEST_FIELD", field: key });
  if (request.schemaVersion !== OPENAI_SANDBOX_SCHEMA_VERSION) errors.push({ code: "SCHEMA_MISMATCH", field: "schemaVersion" });
  if (request.action !== OPENAI_SANDBOX_ACTION) errors.push({ code: "UNKNOWN_ACTION", field: "action" });
  if (request.operatingMode !== "sandbox" || request.dataMode !== "mock") errors.push({ code: "SANDBOX_MOCK_REQUIRED", field: "operatingMode" });
  if (request.ownerApproved !== true || request.approvalScope !== OPENAI_SANDBOX_SCOPE) errors.push({ code: "OWNER_APPROVAL_REQUIRED", field: "ownerApproved" });
  if (request.productionExecution !== false || request.publishEnabled !== false || request.actualRevenueConnected !== false || request.ledgerAppend !== false) errors.push({ code: "SAFETY_FLAG_FORBIDDEN", field: "execution" });
  if (request.externalExecutionRequested !== true || request.externalExecutionScope !== OPENAI_SANDBOX_SCOPE) errors.push({ code: "EXTERNAL_SCOPE_INVALID", field: "externalExecutionScope" });
  if (!request.sourceExportId || !request.correlationId || !OPENAI_SANDBOX_PURPOSES.includes(request.purpose)) errors.push({ code: "SOURCE_OR_PURPOSE_INVALID", field: "purpose" });
  let inputLength = Infinity;
  try { inputLength = JSON.stringify(request.input).length; } catch { errors.push({ code: "CIRCULAR_INPUT", field: "input" }); }
  if (!plain(request.input) || inputLength > OPENAI_SANDBOX_BUDGET_POLICY.maxInputCharacters) errors.push({ code: "INPUT_SIZE_INVALID", field: "input" });
  if (!plain(request.outputSchema) || request.outputSchema.type !== "object" || request.outputSchema.additionalProperties !== false) errors.push({ code: "OUTPUT_SCHEMA_INVALID", field: "outputSchema" });
  if (request.requestedModelPolicy !== "serverAllowlist") errors.push({ code: "MODEL_POLICY_INVALID", field: "requestedModelPolicy" });
  if (request.emergencyStopActive !== false) errors.push({ code: "EMERGENCY_STOP_ACTIVE", field: "emergencyStopActive" });
  if (request.idempotencyKey !== createOpenAISandboxIdempotencyKey(request)) errors.push({ code: "IDEMPOTENCY_KEY_INVALID", field: "idempotencyKey" });
  return { valid: errors.length === 0, errors };
}

export function evaluateOpenAISandboxBudget({ inputCharacters, maxOutputTokens, monthlySandboxSpendUsd, pricing }) {
  const numbers = [inputCharacters, maxOutputTokens, monthlySandboxSpendUsd, pricing?.inputPerMillion, pricing?.outputPerMillion];
  if (numbers.some((value) => !finiteNonNegative(value))) return { allowed: false, reasonCode: "BUDGET_INPUT_INVALID", costEstimateStatus: "notVerified" };
  if (pricing?.verified !== true) return { allowed: false, reasonCode: "MODEL_PRICING_NOT_VERIFIED", costEstimateStatus: "notVerified" };
  const estimatedInputTokens = Math.ceil(inputCharacters / 4);
  const estimatedUsd = (estimatedInputTokens * pricing.inputPerMillion + maxOutputTokens * pricing.outputPerMillion) / 1_000_000;
  if (estimatedUsd > OPENAI_SANDBOX_BUDGET_POLICY.maxEstimatedCostUsd) return { allowed: false, reasonCode: "REQUEST_COST_LIMIT_EXCEEDED", costEstimateStatus: "estimated", estimatedUsd };
  if (monthlySandboxSpendUsd + estimatedUsd > OPENAI_SANDBOX_BUDGET_POLICY.monthlySandboxLimitUsd) return { allowed: false, reasonCode: "MONTHLY_SANDBOX_LIMIT_EXCEEDED", costEstimateStatus: "estimated", estimatedUsd };
  return { allowed: true, reasonCode: "SANDBOX_BUDGET_ALLOWED", costEstimateStatus: "estimated", estimatedUsd, estimatedInputTokens };
}
