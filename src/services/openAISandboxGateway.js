import { OPENAI_SANDBOX_ACTION, OPENAI_SANDBOX_SCOPE, createOpenAISandboxIdempotencyKey, validateOpenAISandboxRequest } from "./openAISandboxPolicy.js";

const inFlight = new Map();
export const DIRECT_SERVICE_SANDBOX_SCHEMA = Object.freeze({ type: "object", additionalProperties: false, properties: { serviceName: { type: "string" }, proposalSummary: { type: "string" }, deliverables: { type: "array", items: { type: "string" } }, riskNotes: { type: "array", items: { type: "string" } } }, required: ["serviceName", "proposalSummary", "deliverables", "riskNotes"] });

export function buildOpenAISandboxGatewayRequest({ sourceExport, directService, emergencyStopActive = false }) {
  const request = { schemaVersion: "2.0.0", action: OPENAI_SANDBOX_ACTION, operatingMode: "sandbox", dataMode: "mock", ownerApproved: true, approvalScope: OPENAI_SANDBOX_SCOPE, productionExecution: false, publishEnabled: false, actualRevenueConnected: false, ledgerAppend: false, externalExecutionRequested: true, externalExecutionScope: OPENAI_SANDBOX_SCOPE, sourceExportId: sourceExport?.exportId, correlationId: sourceExport?.correlationId, sourceRevisionId: sourceExport?.sourceRevisionCandidateId || "base", purpose: "directServiceDraft", input: { serviceName: directService?.serviceName, proposalSummary: directService?.proposalSummary, deliverables: directService?.deliverables, deliveryScope: directService?.deliveryScope, excludedScope: directService?.excludedScope, riskNotes: directService?.riskNotes }, requestedModelPolicy: "serverAllowlist", outputSchema: DIRECT_SERVICE_SANDBOX_SCHEMA, emergencyStopActive };
  request.idempotencyKey = createOpenAISandboxIdempotencyKey(request); return request;
}

export function validateOpenAISandboxGatewayRequest(request) { return validateOpenAISandboxRequest(request); }

function gatewayFailure(reasonCode, message = "Sandbox generation failed.") {
  return { ok: false, status: "blocked", reasonCode, message, productionExecution: false, publishEnabled: false, actualRevenueConnected: false, ledgerAppend: false };
}

export async function executeOpenAISandboxGateway(request, options = {}) {
  const validation = validateOpenAISandboxGatewayRequest(request);
  if (!validation.valid) return gatewayFailure(validation.errors[0]?.code || "REQUEST_INVALID");
  if (inFlight.has(request.idempotencyKey)) return inFlight.get(request.idempotencyKey);
  const transport = options.transport || fetch;
  const promise = (async () => {
    const accessToken = await options.getAccessToken?.();
    if (typeof accessToken !== "string" || !accessToken) return gatewayFailure("OWNER_SESSION_INVALID", "Owner session is required.");
    try {
      const response = await transport("/api/ai", { method: "POST", headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" }, body: JSON.stringify(request) });
      const result = await response.json().catch(() => ({}));
      return response.ok ? result : gatewayFailure(result.reasonCode || "SANDBOX_GATEWAY_FAILED", result.message);
    } catch { return gatewayFailure("SANDBOX_GATEWAY_FAILED"); }
  })().finally(() => inFlight.delete(request.idempotencyKey));
  inFlight.set(request.idempotencyKey, promise);
  return promise;
}
