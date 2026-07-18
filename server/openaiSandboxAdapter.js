import { OPENAI_SANDBOX_BUDGET_POLICY, evaluateOpenAISandboxBudget, validateOpenAISandboxRequest } from "../src/services/openAISandboxPolicy.js";

const MODEL_POLICY = Object.freeze({ id: "sandbox-direct-v1", model: "gpt-5.6-luna", inputPerMillion: 1, outputPerMillion: 6, verified: true, pricingVerifiedAt: "2026-07-19" });
const MAX_RESPONSE_CHARACTERS = 50000;

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function safeError(reasonCode, status = "blocked") { return { ok: false, status, reasonCode, message: "OpenAI Sandbox生成を安全に完了できませんでした。", productionExecution: false, publishEnabled: false, actualRevenueConnected: false, ledgerAppend: false }; }
function outputText(payload) { if (typeof payload?.output_text === "string") return payload.output_text; const text = payload?.output?.flatMap((item) => item?.content || []).find((item) => item?.type === "output_text")?.text; return typeof text === "string" ? text : null; }
function usage(payload) { const source = payload?.usage || {}; return { inputTokens: Number(source.input_tokens || 0), outputTokens: Number(source.output_tokens || 0), totalTokens: Number(source.total_tokens || 0) }; }

export function buildRequest(request) {
  return { model: MODEL_POLICY.model, store: false, max_output_tokens: OPENAI_SANDBOX_BUDGET_POLICY.maxOutputTokens, input: [{ role: "system", content: [{ type: "input_text", text: "Create only a structured Direct Service draft from approved mock source data. Never claim actual results, publication, or revenue." }] }, { role: "user", content: [{ type: "input_text", text: JSON.stringify(request.input) }] }], text: { format: { type: "json_schema", name: "direct_service_sandbox_draft", strict: true, schema: request.outputSchema } } };
}
export function validateRequest(request) { return validateOpenAISandboxRequest(request); }
export function validateProviderResponse(payload, outputSchema) {
  const errors = [];
  const text = outputText(payload);
  if (payload?.status === "incomplete") errors.push({ code: "PROVIDER_RESPONSE_INCOMPLETE" });
  if (payload?.output?.flatMap((item) => item?.content || []).some((item) => item?.type === "refusal")) errors.push({ code: "PROVIDER_REFUSAL" });
  if (!text || text.length > MAX_RESPONSE_CHARACTERS) return { valid: false, errors: [{ code: "PROVIDER_RESPONSE_SIZE_INVALID" }] };
  let value; try { value = JSON.parse(text); } catch { return { valid: false, errors: [{ code: "PROVIDER_JSON_INVALID" }] }; }
  if (!value || typeof value !== "object" || Array.isArray(value)) errors.push({ code: "PROVIDER_OUTPUT_INVALID" });
  const properties = outputSchema?.properties || {};
  for (const key of Object.keys(value || {})) if (!(key in properties)) errors.push({ code: "UNKNOWN_OUTPUT_FIELD", field: key });
  for (const key of outputSchema?.required || []) if (value?.[key] === undefined) errors.push({ code: "REQUIRED_OUTPUT_FIELD_MISSING", field: key });
  return { valid: errors.length === 0, errors, value };
}
export function extractUsage(payload) { return usage(payload); }
export function evaluateCost(request, monthlySandboxSpendUsd) { return evaluateOpenAISandboxBudget({ inputCharacters: JSON.stringify(request.input).length, maxOutputTokens: OPENAI_SANDBOX_BUDGET_POLICY.maxOutputTokens, monthlySandboxSpendUsd, pricing: MODEL_POLICY }); }
export function sanitizeProviderError(error) { const code = String(error?.reasonCode || error?.code || "OPENAI_SANDBOX_FAILED"); return safeError(code.replace(/[^A-Z0-9_]/gi, "_").slice(0, 80), "failed"); }

export async function executeSandboxResponse(request, options = {}) {
  const validation = validateRequest(request); if (!validation.valid) return { ...safeError(validation.errors[0]?.code || "REQUEST_INVALID"), errors: validation.errors };
  if (options.ownerAuthenticated !== true) return safeError("LIVE_SANDBOX_AUTH_REQUIRED");
  if (!options.usageStore || typeof options.usageStore.getMonthlySpendUsd !== "function" || typeof options.usageStore.claimIdempotencyKey !== "function") return safeError("SERVER_USAGE_STORE_REQUIRED");
  if (options.featureEnabled !== true) return safeError("LIVE_SANDBOX_FEATURE_LOCKED");
  const monthlySpend = await options.usageStore.getMonthlySpendUsd();
  const budget = evaluateCost(request, monthlySpend); if (!budget.allowed) return { ...safeError(budget.reasonCode), cost: { status: budget.costEstimateStatus, estimatedUsd: budget.estimatedUsd ?? null } };
  if (typeof options.usageStore.getCachedResult === "function") {
    const cached = await options.usageStore.getCachedResult(request.idempotencyKey);
    if (cached?.ok === true) return { ...cached, cacheHit: true };
  }
  const credential = options.credential; if (typeof credential !== "string" || !credential) return safeError("PROVIDER_CREDENTIAL_REQUIRED");
  const claimed = await options.usageStore.claimIdempotencyKey(request.idempotencyKey, budget.estimatedUsd); if (claimed !== true) return safeError("SANDBOX_REQUEST_ALREADY_CLAIMED");
  const transport = options.transport || fetch;
  const requestBody = buildRequest(request);
  for (let attempt = 0; attempt <= OPENAI_SANDBOX_BUDGET_POLICY.maxRetries; attempt += 1) {
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), OPENAI_SANDBOX_BUDGET_POLICY.timeoutMs);
    try {
      const response = await transport("https://api.openai.com/v1/responses", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${credential}` }, body: JSON.stringify(requestBody), signal: controller.signal });
      const raw = await response.text(); if (raw.length > MAX_RESPONSE_CHARACTERS) return safeError("PROVIDER_RESPONSE_TOO_LARGE", "failed");
      if (!response.ok) { if (attempt < 1 && (response.status === 429 || response.status >= 500)) { const retryBudget = evaluateCost(request, await options.usageStore.getMonthlySpendUsd()); if (!retryBudget.allowed) return { ...safeError("RETRY_BUDGET_EXCEEDED"), cost: { status: retryBudget.costEstimateStatus, estimatedUsd: retryBudget.estimatedUsd ?? null } }; await sleep(options.retryDelayMs ?? 10); continue; } return safeError(response.status === 429 ? "PROVIDER_RATE_LIMITED" : "PROVIDER_REQUEST_FAILED", "failed"); }
      let payload; try { payload = JSON.parse(raw); } catch { return safeError("PROVIDER_JSON_INVALID", "failed"); }
      const checked = validateProviderResponse(payload, request.outputSchema); if (!checked.valid) return { ...safeError("PROVIDER_OUTPUT_VALIDATION_FAILED", "failed"), errors: checked.errors };
      const tokenUsage = extractUsage(payload); if (![tokenUsage.inputTokens, tokenUsage.outputTokens, tokenUsage.totalTokens].every((value) => Number.isFinite(value) && value > 0)) return safeError("PROVIDER_USAGE_REQUIRED", "failed"); const actualEstimate = (tokenUsage.inputTokens * MODEL_POLICY.inputPerMillion + tokenUsage.outputTokens * MODEL_POLICY.outputPerMillion) / 1_000_000;
      const result = { ok: true, generationId: request.idempotencyKey, provider: "openai", generationMode: "sandboxExternal", liveProviderUsed: true, sourceExportId: request.sourceExportId, correlationId: request.correlationId, purpose: request.purpose, validatedOutput: checked.value, modelPolicyId: MODEL_POLICY.id, usage: tokenUsage, cost: { status: "estimated", estimatedUsd: actualEstimate }, productionExecution: false, publishEnabled: false, actualRevenueConnected: false, ledgerAppend: false, externalExecution: false, status: "sandboxGenerationComplete" };
      if (typeof options.usageStore.saveCachedResult === "function") await options.usageStore.saveCachedResult(request.idempotencyKey, result);
      return result;
    } catch (error) { if (attempt < 1 && error?.name === "AbortError") continue; return sanitizeProviderError({ reasonCode: error?.name === "AbortError" ? "PROVIDER_TIMEOUT" : "PROVIDER_NETWORK_FAILED" }); }
    finally { clearTimeout(timer); }
  }
  return safeError("PROVIDER_RETRY_EXHAUSTED", "failed");
}
