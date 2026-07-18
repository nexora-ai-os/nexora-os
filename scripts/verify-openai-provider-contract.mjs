import assert from "node:assert/strict";
import { buildMockOpenAIResponse, buildOpenAIGenerationRequest, createLockedLiveTransport, estimateOpenAIRequestBudget, evaluateOpenAIRateGuard, sanitizeOpenAIError, validateOpenAIGenerationRequest, validateOpenAIGenerationResponse } from "../src/services/openAIProviderContract.js";

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log(`PASS ${name}`); }
const base = { requestId: "r1", purpose: "directServiceDraft", correlationId: "c1", sourceExportId: "e1", systemInstruction: "mock", taskInstruction: "draft", sourceContext: { title: "safe" }, outputSchema: { type: "object", properties: { title: {} }, required: ["title"], additionalProperties: false }, privacyClassification: "internalMock", prohibitedData: ["credentials"], safetyRequirements: ["mockOnly"], maxOutputTokens: 1024, timeoutMs: 5000, retryPolicy: { maxRetries: 1 } };
const request = buildOpenAIGenerationRequest(base);
const response = buildMockOpenAIResponse(request, "fixed");
const liveResult = await createLockedLiveTransport().execute();
check("valid request", () => assert.equal(validateOpenAIGenerationRequest(request).valid, true));
check("valid structured response", () => assert.equal(validateOpenAIGenerationResponse(response).valid, true));
check("deterministic response", () => assert.deepEqual(response, buildMockOpenAIResponse(request, "fixed")));
check("live transport locked", () => assert.equal(liveResult.reasonCode, "PROVIDER_LIVE_EXECUTION_LOCKED"));
check("nested credential rejected", () => assert.equal(validateOpenAIGenerationRequest(buildOpenAIGenerationRequest({ ...base, sourceContext: { nested: { apiKey: "secret" } } })).valid, false));
check("personal data rejected", () => assert.equal(validateOpenAIGenerationRequest(buildOpenAIGenerationRequest({ ...base, sourceContext: { email: "a@example.test" } })).valid, false));
check("timeout bounded", () => assert.equal(validateOpenAIGenerationRequest(buildOpenAIGenerationRequest({ ...base, timeoutMs: 999 })).valid, false));
check("retry bounded", () => assert.equal(validateOpenAIGenerationRequest(buildOpenAIGenerationRequest({ ...base, retryPolicy: { maxRetries: 3 } })).valid, false));
check("token budget bounded", () => assert.equal(validateOpenAIGenerationRequest(buildOpenAIGenerationRequest({ ...base, maxOutputTokens: 9000 })).valid, false));
check("cost is estimate only", () => assert.equal(estimateOpenAIRequestBudget(request, { inputPerMillion: 1, outputPerMillion: 2 }).actualCost, null));
check("rate guard allows within policy", () => assert.equal(evaluateOpenAIRateGuard({ requests: 1, tokens: 2 }, { maxRequests: 2, maxTokens: 3 }).allowed, true));
check("rate guard blocks limit", () => assert.equal(evaluateOpenAIRateGuard({ requests: 2, tokens: 2 }, { maxRequests: 2, maxTokens: 3 }).allowed, false));
check("error sanitized", () => assert.equal(JSON.stringify(sanitizeOpenAIError({ message: "secret stack" })).includes("secret stack"), false));
check("unknown output rejected", () => assert.equal(validateOpenAIGenerationResponse({ ...response, output: { title: "safe", extra: true } }).valid, false));
check("circular input fails closed", () => { const circular = { ...base }; circular.sourceContext = circular; assert.equal(validateOpenAIGenerationRequest(buildOpenAIGenerationRequest(circular)).valid, false); });
check("input not mutated", () => assert.deepEqual(base.sourceContext, { title: "safe" }));
console.log(`OpenAI provider contract verification: ${passed}/16 passed`);
