export const OPENAI_SCHEMA_VERSION = "2.0.0";
export const OPENAI_MODEL_POLICY = Object.freeze({ provider: "openai", apiSurface: "responses", modelSelectionMode: "serverPolicy", selectedModel: null, selectionStatus: "ownerReviewRequired", liveExecutionEnabled: false });

const PURPOSES = new Set(["directServiceDraft", "affiliateDraft", "snsDraft"]);
const SECRET_KEYS = /api.?key|credential|password|access.?token|refresh.?token|authorization|bearer/i;
const PERSONAL_KEYS = /email|phone|address|full.?name|customer.?data|payment/i;
const FORBIDDEN_VALUES = /actual revenue|confirmed revenue|payment information/i;
const REQUIRED = ["requestId", "correlationId", "sourceExportId", "systemInstruction", "taskInstruction", "sourceContext", "outputSchema", "privacyClassification", "prohibitedData", "safetyRequirements", "maxOutputTokens", "timeoutMs", "retryPolicy"];

function plain(value) { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function scan(value, path = "request") {
  const errors = [];
  if (Array.isArray(value)) value.forEach((item, index) => errors.push(...scan(item, `${path}.${index}`)));
  else if (plain(value)) Object.entries(value).forEach(([key, item]) => {
    if (SECRET_KEYS.test(key)) errors.push({ code: "CREDENTIAL_FIELD_FORBIDDEN", field: `${path}.${key}` });
    if (PERSONAL_KEYS.test(key)) errors.push({ code: "PERSONAL_DATA_FORBIDDEN", field: `${path}.${key}` });
    errors.push(...scan(item, `${path}.${key}`));
  });
  else if (typeof value === "string" && FORBIDDEN_VALUES.test(value)) errors.push({ code: "PROHIBITED_DATA_FORBIDDEN", field: path });
  return errors;
}
function stable(value) { return JSON.stringify(value, Object.keys(value).sort()); }
function hash(text) { let result = 2166136261; for (const char of text) { result ^= char.charCodeAt(0); result = Math.imul(result, 16777619); } return (result >>> 0).toString(36); }

export function buildOpenAIGenerationRequest(input) {
  try {
    return { ...clone(input), schemaVersion: OPENAI_SCHEMA_VERSION, provider: "openai", apiSurface: "responses", operatingMode: "mock", externalExecution: false, productionExecution: false, liveExecutionEnabled: false };
  } catch {
    return { schemaVersion: OPENAI_SCHEMA_VERSION, provider: "openai", apiSurface: "responses", operatingMode: "mock", externalExecution: false, productionExecution: false, liveExecutionEnabled: false, contractBuildError: "INVALID_OR_CIRCULAR_INPUT" };
  }
}
export function validateOpenAIGenerationRequest(request) {
  const errors = plain(request) ? scan(request) : [{ code: "REQUEST_INVALID", field: "request" }];
  if (!plain(request)) return { valid: false, errors };
  REQUIRED.forEach((field) => { if (request[field] === undefined || request[field] === null || request[field] === "") errors.push({ code: "REQUIRED_FIELD_MISSING", field }); });
  if (request.contractBuildError) errors.push({ code: request.contractBuildError, field: "request" });
  if (request.schemaVersion !== OPENAI_SCHEMA_VERSION || request.provider !== "openai" || request.apiSurface !== "responses" || request.operatingMode !== "mock") errors.push({ code: "CONTRACT_MISMATCH", field: "provider" });
  if (!PURPOSES.has(request.purpose)) errors.push({ code: "PURPOSE_INVALID", field: "purpose" });
  if (request.externalExecution !== false || request.productionExecution !== false || request.liveExecutionEnabled !== false) errors.push({ code: "EXECUTION_FORBIDDEN", field: "execution" });
  if (!Number.isInteger(request.maxOutputTokens) || request.maxOutputTokens < 64 || request.maxOutputTokens > 8192) errors.push({ code: "TOKEN_BUDGET_INVALID", field: "maxOutputTokens" });
  if (!Number.isInteger(request.timeoutMs) || request.timeoutMs < 1000 || request.timeoutMs > 60000) errors.push({ code: "TIMEOUT_INVALID", field: "timeoutMs" });
  if (!plain(request.retryPolicy) || !Number.isInteger(request.retryPolicy.maxRetries) || request.retryPolicy.maxRetries < 0 || request.retryPolicy.maxRetries > 2) errors.push({ code: "RETRY_POLICY_INVALID", field: "retryPolicy" });
  return { valid: errors.length === 0, errors };
}
export function buildMockOpenAIResponse(request, evaluationTime = "2026-07-18T00:00:00.000Z") {
  const validation = validateOpenAIGenerationRequest(request);
  if (!validation.valid) return { ok: false, status: "invalid", errors: validation.errors };
  return { ok: true, status: "completed", schemaVersion: OPENAI_SCHEMA_VERSION, dataMode: "mock", isMock: true, requestId: request.requestId, sourceExportId: request.sourceExportId, correlationId: request.correlationId, purpose: request.purpose, generatedBy: "openai-mock-provider", liveProviderUsed: false, productionExecution: false, externalExecution: false, approvalConfirmed: false, ledgerAppend: false, actualRevenueConnected: false, output: clone(request.sourceContext), outputSchema: clone(request.outputSchema), evaluationTime, responseId: `openai-mock-${hash(stable({ requestId: request.requestId, purpose: request.purpose }))}` };
}
export function validateOpenAIGenerationResponse(response) {
  const errors = plain(response) ? scan(response) : [{ code: "RESPONSE_INVALID", field: "response" }];
  if (!plain(response)) return { valid: false, errors };
  ["schemaVersion", "requestId", "sourceExportId", "correlationId", "purpose", "generatedBy", "output"].forEach((field) => { if (response[field] === undefined || response[field] === null) errors.push({ code: "REQUIRED_FIELD_MISSING", field }); });
  if (response.schemaVersion !== OPENAI_SCHEMA_VERSION || response.dataMode !== "mock" || response.isMock !== true || response.liveProviderUsed !== false || response.productionExecution !== false || response.externalExecution !== false || response.approvalConfirmed !== false || response.ledgerAppend !== false || response.actualRevenueConnected !== false) errors.push({ code: "SAFETY_CONTRACT_MISMATCH", field: "response" });
  const properties = response.outputSchema?.properties;
  if (response.outputSchema?.additionalProperties === false && plain(properties) && plain(response.output)) {
    for (const key of Object.keys(response.output)) if (!(key in properties)) errors.push({ code: "UNKNOWN_OUTPUT_FIELD", field: `output.${key}` });
  }
  return { valid: errors.length === 0, errors };
}
export function estimateOpenAIRequestBudget(request, pricingPolicy = {}) { const inputTokens = Math.ceil(JSON.stringify(request.sourceContext || {}).length / 4); const outputTokens = request.maxOutputTokens || 0; return { currency: pricingPolicy.currency || "USD", inputTokens, maxOutputTokens: outputTokens, estimatedMaximumCost: ((inputTokens * Number(pricingPolicy.inputPerMillion || 0)) + (outputTokens * Number(pricingPolicy.outputPerMillion || 0))) / 1_000_000, isEstimate: true, actualCost: null }; }
export function evaluateOpenAIRateGuard(usageState = {}, limitPolicy = {}) { const allowed = Number(usageState.requests || 0) < Number(limitPolicy.maxRequests || 0) && Number(usageState.tokens || 0) < Number(limitPolicy.maxTokens || 0); return { allowed, reasonCode: allowed ? "WITHIN_MOCK_GUARD" : "OPENAI_RATE_GUARD_BLOCKED", externalExecution: false }; }
export function sanitizeOpenAIError(error) { return { ok: false, status: "failed", reasonCode: typeof error?.code === "string" ? error.code.slice(0, 80) : "OPENAI_PROVIDER_ERROR", message: "OpenAI provider処理を安全に完了できませんでした。", retryable: false }; }
export function createLockedLiveTransport() { return Object.freeze({ async execute() { return { ok: false, status: "blocked", reasonCode: "PROVIDER_LIVE_EXECUTION_LOCKED" }; } }); }
