import assert from "node:assert/strict";
import { buildRequest, evaluateCost, executeSandboxResponse, validateProviderResponse, validateRequest } from "../server/openaiSandboxAdapter.js";
import { OPENAI_SANDBOX_BUDGET_POLICY, createOpenAISandboxIdempotencyKey } from "../src/services/openAISandboxPolicy.js";

let passed = 0;
const check = async (name, fn) => { await fn(); passed += 1; console.log(`PASS ${name}`); };
function request(overrides = {}) {
  const value = { schemaVersion: "2.0.0", action: "sandboxGenerateRevenueLanes", operatingMode: "sandbox", dataMode: "mock", ownerApproved: true, approvalScope: "openaiSandboxGeneration", productionExecution: false, publishEnabled: false, actualRevenueConnected: false, ledgerAppend: false, externalExecutionRequested: true, externalExecutionScope: "openaiSandboxGeneration", sourceExportId: "export-1", correlationId: "correlation-1", sourceRevisionId: "revision-1", purpose: "directServiceDraft", input: { serviceName: "Mock service", proposalSummary: "Safe proposal", deliverables: ["draft"], riskNotes: ["not guaranteed"] }, requestedModelPolicy: "serverAllowlist", outputSchema: { type: "object", additionalProperties: false, properties: { serviceName: { type: "string" }, proposalSummary: { type: "string" }, deliverables: { type: "array" }, riskNotes: { type: "array" } }, required: ["serviceName", "proposalSummary", "deliverables", "riskNotes"] }, emergencyStopActive: false, ...overrides };
  value.idempotencyKey = createOpenAISandboxIdempotencyKey(value); return value;
}
function reason(reasonCode) { return Object.assign(new Error("private detail"), { reasonCode }); }
function usageStore(options = {}) {
  const events = []; let spendRead = 0; let reservationNumber = 0;
  return {
    events,
    async getMonthlySpendUsd() { events.push("budget"); const values = options.spendValues || [0]; return values[Math.min(spendRead++, values.length - 1)]; },
    async getCachedResult() { events.push("cache-read"); if (options.cacheError) throw reason("SERVER_USAGE_STORE_REQUIRED"); return options.cached || null; },
    async claimIdempotencyKey(idempotencyKey, estimatedCostUsd) { events.push(`reserve:${idempotencyKey}`); if (options.reserveError) throw reason(options.reserveError); reservationNumber += 1; return { reserved: true, reservationId: `reservation-${reservationNumber}`, estimatedCostUsd, idempotencyKey }; },
    async commitUsage(input) { events.push(`commit:${input.reservationId}`); if (options.commitError) throw reason("USAGE_COMMIT_FAILED"); return true; },
    async releaseReservation(reservationId) { events.push(`release:${reservationId}`); if (options.releaseError) throw reason("USAGE_RELEASE_FAILED"); return true; },
    async saveCachedResult() { events.push("cache-write"); if (options.cacheWriteError) throw reason("SERVER_USAGE_STORE_REQUIRED"); },
  };
}
const valid = request();
const output = { serviceName: "OpenAI service", proposalSummary: "Sandbox proposal", deliverables: ["draft"], riskNotes: ["not guaranteed"] };
const payload = { output_text: JSON.stringify(output), usage: { input_tokens: 100, output_tokens: 50, total_tokens: 150 } };
const okTransport = async () => ({ ok: true, status: 200, text: async () => JSON.stringify(payload) });
const gates = (store, overrides = {}) => ({ ownerAuthenticated: true, featureEnabled: true, usageStore: store, credential: "test-only", ...overrides });

await check("budget policy remains bounded", () => assert.equal(OPENAI_SANDBOX_BUDGET_POLICY.maxRetries, 1));
await check("request validates", () => assert.equal(validateRequest(valid).valid, true));
await check("request uses strict schema and store false", () => { const body = buildRequest(valid); assert.equal(body.store, false); assert.equal(body.text.format.strict, true); });
await check("cost stays under request limit", () => assert.equal(evaluateCost(valid, 0).allowed, true));
let blockedProviderCalls = 0; const forbidden = async () => { blockedProviderCalls += 1; throw new Error("must not execute"); };
await check("server auth required", async () => assert.equal((await executeSandboxResponse(valid, { ownerAuthenticated: false, transport: forbidden })).reasonCode, "LIVE_SANDBOX_AUTH_REQUIRED"));
const lockedStore = usageStore();
await check("feature false blocks before usage and provider", async () => assert.equal((await executeSandboxResponse(valid, gates(lockedStore, { featureEnabled: false, transport: forbidden }))).reasonCode, "LIVE_SANDBOX_FEATURE_LOCKED"));
const noCredentialStore = usageStore();
await check("credential absent blocks before reserve/provider", async () => assert.equal((await executeSandboxResponse(valid, gates(noCredentialStore, { credential: "", transport: forbidden }))).reasonCode, "PROVIDER_CREDENTIAL_REQUIRED"));
await check("blocked gates call provider zero times", () => assert.equal(blockedProviderCalls, 0));
await check("credential absence makes no reservation", () => assert.equal(noCredentialStore.events.some((event) => event.startsWith("reserve:")), false));

const successStore = usageStore(); const successEvents = successStore.events;
const success = await executeSandboxResponse(valid, gates(successStore, { transport: async (...args) => { successEvents.push("provider"); return okTransport(...args); } }));
await check("reservation precedes provider", () => assert.ok(successEvents.findIndex((x) => x.startsWith("reserve:")) < successEvents.indexOf("provider")));
await check("reservation id retained through commit", () => assert.ok(successEvents.includes("commit:reservation-1")));
await check("success commits once and never releases", () => assert.equal(successEvents.filter((x) => x.startsWith("commit:")).length === 1 && successEvents.filter((x) => x.startsWith("release:")).length === 0, true));
await check("production flags remain false", () => assert.equal(success.productionExecution || success.publishEnabled || success.actualRevenueConnected || success.ledgerAppend || success.externalExecution, false));

const preDispatchStore = usageStore();
const preDispatch = await executeSandboxResponse(valid, gates(preDispatchStore, { beforeDispatch: () => { throw new Error("private"); }, transport: forbidden }));
await check("pre-dispatch failure releases once", () => assert.equal(preDispatch.reasonCode === "PROVIDER_EXECUTION_FAILED" && preDispatchStore.events.filter((x) => x.startsWith("release:")).length === 1, true));
const releaseFailureStore = usageStore({ releaseError: true });
await check("release failure is not success", async () => assert.equal((await executeSandboxResponse(valid, gates(releaseFailureStore, { beforeDispatch: () => { throw new Error("private"); } }))).reasonCode, "USAGE_RELEASE_FAILED"));
const definitiveStore = usageStore(); let definitiveCalls = 0;
const definitiveResult = await executeSandboxResponse(valid, gates(definitiveStore, { transport: async () => { definitiveCalls += 1; return { ok: false, status: 400, text: async () => "{}" }; } }));
await check("definitive 4xx releases exactly once", () => assert.equal(definitiveResult.reasonCode === "PROVIDER_EXECUTION_FAILED" && definitiveCalls === 1 && definitiveStore.events.filter((x) => x.startsWith("release:")).length === 1 && definitiveStore.events.some((x) => x.startsWith("commit:")) === false, true));
const commitFailureStore = usageStore({ commitError: true });
await check("commit failure is not success", async () => assert.equal((await executeSandboxResponse(valid, gates(commitFailureStore, { transport: okTransport }))).reasonCode, "USAGE_COMMIT_FAILED"));
const duplicateStore = usageStore({ reserveError: "SANDBOX_REQUEST_ALREADY_CLAIMED" });
await check("duplicate reservation rejected", async () => assert.equal((await executeSandboxResponse(valid, gates(duplicateStore, { transport: forbidden }))).reasonCode, "SANDBOX_REQUEST_ALREADY_CLAIMED"));

const cached = { ...success, ok: true }; const cacheStore = usageStore({ cached }); let cacheProviderCalls = 0;
const cacheResult = await executeSandboxResponse(valid, gates(cacheStore, { transport: async () => { cacheProviderCalls += 1; } }));
await check("cache hit skips provider and reservation", () => assert.equal(cacheResult.cacheHit === true && cacheProviderCalls === 0 && cacheStore.events.some((x) => x.startsWith("reserve:")) === false, true));

const retryStore = usageStore(); let retryCalls = 0;
const retryResult = await executeSandboxResponse(valid, gates(retryStore, { maxRetries: 1, retryDelayMs: 0, transport: async () => { retryCalls += 1; return retryCalls === 1 ? { ok: false, status: 500, text: async () => "{}" } : okTransport(); } }));
await check("mock retry uses separate deterministic reservations", () => { const reserves = retryStore.events.filter((x) => x.startsWith("reserve:")); assert.equal(reserves.length, 2); assert.ok(reserves[0].endsWith(":attempt:1")); assert.ok(reserves[1].endsWith(":attempt:2")); });
await check("ambiguous first attempt committed before retry", () => assert.deepEqual(retryStore.events.filter((x) => x.startsWith("commit:")), ["commit:reservation-1", "commit:reservation-2"]));
await check("retry re-evaluates budget", () => assert.equal(retryStore.events.filter((x) => x === "budget").length, 2));
await check("retry success is complete", () => assert.equal(retryResult.ok, true));

const retryBudgetStore = usageStore({ spendValues: [0, 1] }); let retryBudgetCalls = 0;
const retryBudgetResult = await executeSandboxResponse(valid, gates(retryBudgetStore, { maxRetries: 1, retryDelayMs: 0, transport: async () => { retryBudgetCalls += 1; return { ok: false, status: 500, text: async () => "{}" }; } }));
await check("retry budget denial prevents second provider", () => assert.equal(retryBudgetResult.reasonCode === "RETRY_BUDGET_EXCEEDED" && retryBudgetCalls === 1, true));
await check("provider output validation remains strict", () => assert.equal(validateProviderResponse({ ...payload, output_text: JSON.stringify({ ...output, extra: true }) }, valid.outputSchema).valid, false));
const rawFailure = await executeSandboxResponse(valid, gates(usageStore(), { transport: async () => { throw new Error("raw provider secret"); } }));
await check("raw provider error is not exposed", () => assert.equal(JSON.stringify(rawFailure).includes("raw provider secret"), false));
let defaultRetryCalls = 0;
await executeSandboxResponse(valid, gates(usageStore(), { transport: async () => { defaultRetryCalls += 1; return { ok: false, status: 500, text: async () => "{}" }; } }));
await check("live retry default is zero", () => assert.equal(defaultRetryCalls, 1));
await check("input not mutated", () => assert.equal(valid.input.serviceName, "Mock service"));
console.log(`OpenAI sandbox adapter verification: ${passed}/28 passed`);
