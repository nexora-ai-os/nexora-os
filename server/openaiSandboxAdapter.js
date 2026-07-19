import { OPENAI_SANDBOX_BUDGET_POLICY, evaluateOpenAISandboxBudget, validateOpenAISandboxRequest } from "../src/services/openAISandboxPolicy.js";

const MODEL_POLICY = Object.freeze({ id: "sandbox-direct-v1", model: "gpt-5.6-luna", inputPerMillion: 1, outputPerMillion: 6, verified: true, pricingVerifiedAt: "2026-07-19" });
const MAX_RESPONSE_CHARACTERS = 50000;
const NORMALIZED_REASONS = new Set(["SERVER_USAGE_STORE_REQUIRED", "USAGE_RESERVATION_FAILED", "USAGE_COMMIT_FAILED", "USAGE_RELEASE_FAILED", "SANDBOX_REQUEST_ALREADY_CLAIMED"]);

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function safeError(reasonCode, status = "blocked") { return { ok: false, status, reasonCode, message: "Sandbox generation could not be completed.", productionExecution: false, publishEnabled: false, actualRevenueConnected: false, ledgerAppend: false, externalExecution: false }; }
function normalizedReason(error, fallback) { return NORMALIZED_REASONS.has(error?.reasonCode) ? error.reasonCode : fallback; }
function outputText(payload) { if (typeof payload?.output_text === "string") return payload.output_text; const text = payload?.output?.flatMap((item) => item?.content || []).find((item) => item?.type === "output_text")?.text; return typeof text === "string" ? text : null; }
function usage(payload) { const source = payload?.usage || {}; return { inputTokens: Number(source.input_tokens || 0), outputTokens: Number(source.output_tokens || 0), totalTokens: Number(source.total_tokens || 0) }; }
function attemptKey(idempotencyKey, attempt) { return `${idempotencyKey}:attempt:${attempt + 1}`; }

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
export function sanitizeProviderError() { return safeError("PROVIDER_EXECUTION_FAILED", "failed"); }

async function commitReservation(store, reservation, actualCostUsd) {
  try { await store.commitUsage({ reservationId: reservation.reservationId, actualCostUsd }); return null; }
  catch (error) { return safeError(normalizedReason(error, "USAGE_COMMIT_FAILED"), "failed"); }
}

async function releaseReservation(store, reservation) {
  try { await store.releaseReservation(reservation.reservationId); return null; }
  catch (error) { return safeError(normalizedReason(error, "USAGE_RELEASE_FAILED"), "failed"); }
}

export async function executeSandboxResponse(request, options = {}) {
  const validation = validateRequest(request); if (!validation.valid) return { ...safeError(validation.errors[0]?.code || "REQUEST_INVALID"), errors: validation.errors };
  if (options.ownerAuthenticated !== true) return safeError("LIVE_SANDBOX_AUTH_REQUIRED");
  const store = options.usageStore;
  if (!store || !["getMonthlySpendUsd", "claimIdempotencyKey", "commitUsage", "releaseReservation"].every((name) => typeof store[name] === "function")) return safeError("SERVER_USAGE_STORE_REQUIRED");
  if (options.featureEnabled !== true) return safeError("LIVE_SANDBOX_FEATURE_LOCKED");
  try {
    if (typeof store.getCachedResult === "function") {
      const cached = await store.getCachedResult(request.idempotencyKey);
      if (cached?.ok === true) return { ...cached, cacheHit: true };
    }
  } catch (error) { return safeError(normalizedReason(error, "SERVER_USAGE_STORE_REQUIRED"), "failed"); }
  const credential = options.credential;
  if (typeof credential !== "string" || !credential) return safeError("PROVIDER_CREDENTIAL_REQUIRED");

  const maxRetries = Number.isInteger(options.maxRetries) && options.maxRetries > 0 ? options.maxRetries : 0;
  const transport = options.transport || fetch;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    let budget;
    try { budget = evaluateCost(request, await store.getMonthlySpendUsd()); }
    catch (error) { return safeError(normalizedReason(error, "SERVER_USAGE_STORE_REQUIRED"), "failed"); }
    if (!budget.allowed) return { ...safeError(attempt > 0 ? "RETRY_BUDGET_EXCEEDED" : budget.reasonCode), cost: { status: budget.costEstimateStatus, estimatedUsd: budget.estimatedUsd ?? null } };

    let reservation;
    try { reservation = await store.claimIdempotencyKey(attemptKey(request.idempotencyKey, attempt), budget.estimatedUsd); }
    catch (error) { return safeError(normalizedReason(error, "USAGE_RESERVATION_FAILED"), "failed"); }
    if (!reservation?.reserved || !reservation?.reservationId) return safeError("USAGE_RESERVATION_FAILED", "failed");

    let requestBody;
    try { requestBody = buildRequest(request); await options.beforeDispatch?.({ attempt, reservation }); }
    catch {
      const releaseFailure = await releaseReservation(store, reservation);
      return releaseFailure || safeError("PROVIDER_EXECUTION_FAILED", "failed");
    }

    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), OPENAI_SANDBOX_BUDGET_POLICY.timeoutMs);
    try {
      const response = await transport("https://api.openai.com/v1/responses", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${credential}` }, body: JSON.stringify(requestBody), signal: controller.signal });
      const raw = await response.text();
      if (!response.ok) {
        const ambiguous = response.status === 408 || response.status === 429 || response.status >= 500;
        const settlementFailure = ambiguous ? await commitReservation(store, reservation, budget.estimatedUsd) : await releaseReservation(store, reservation);
        if (settlementFailure) return settlementFailure;
        if (ambiguous && attempt < maxRetries) { await sleep(options.retryDelayMs ?? 10); continue; }
        return safeError("PROVIDER_EXECUTION_FAILED", "failed");
      }
      if (raw.length > MAX_RESPONSE_CHARACTERS) { const failed = await commitReservation(store, reservation, budget.estimatedUsd); return failed || safeError("PROVIDER_EXECUTION_FAILED", "failed"); }
      let payload; try { payload = JSON.parse(raw); } catch { const failed = await commitReservation(store, reservation, budget.estimatedUsd); return failed || safeError("PROVIDER_EXECUTION_FAILED", "failed"); }
      const checked = validateProviderResponse(payload, request.outputSchema);
      const tokenUsage = extractUsage(payload);
      const validUsage = [tokenUsage.inputTokens, tokenUsage.outputTokens, tokenUsage.totalTokens].every((value) => Number.isFinite(value) && value > 0);
      const actualEstimate = validUsage ? (tokenUsage.inputTokens * MODEL_POLICY.inputPerMillion + tokenUsage.outputTokens * MODEL_POLICY.outputPerMillion) / 1_000_000 : budget.estimatedUsd;
      if (!checked.valid || !validUsage) { const failed = await commitReservation(store, reservation, actualEstimate); return failed || safeError("PROVIDER_EXECUTION_FAILED", "failed"); }
      const commitFailure = await commitReservation(store, reservation, actualEstimate); if (commitFailure) return commitFailure;
      const result = { ok: true, generationId: request.idempotencyKey, provider: "openai", generationMode: "sandboxExternal", liveProviderUsed: true, sourceExportId: request.sourceExportId, sourceRevisionId: request.sourceRevisionId, correlationId: request.correlationId, purpose: request.purpose, validatedOutput: checked.value, modelPolicyId: MODEL_POLICY.id, usage: tokenUsage, cost: { status: "estimated", estimatedUsd: actualEstimate }, productionExecution: false, publishEnabled: false, actualRevenueConnected: false, ledgerAppend: false, externalExecution: false, status: "sandboxGenerationComplete" };
      try { if (typeof store.saveCachedResult === "function") await store.saveCachedResult(request.idempotencyKey, result); }
      catch (error) { return safeError(normalizedReason(error, "SERVER_USAGE_STORE_REQUIRED"), "failed"); }
      return result;
    } catch {
      const commitFailure = await commitReservation(store, reservation, budget.estimatedUsd);
      if (commitFailure) return commitFailure;
      if (attempt < maxRetries) { await sleep(options.retryDelayMs ?? 10); continue; }
      return safeError("PROVIDER_EXECUTION_FAILED", "failed");
    } finally { clearTimeout(timer); }
  }
  return safeError("PROVIDER_EXECUTION_FAILED", "failed");
}
