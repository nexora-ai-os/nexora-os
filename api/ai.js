const ALLOWED_MODES = new Set(["general", "review", "revision", "pipeline", "sandbox", "mock", "local-mock"]);
const REAL_PROVIDERS = new Set(["openai", "gemini", "anthropic", "claude", "perplexity", "meta", "google", "canva"]);

function normalizeControlValue(value) {
  return String(value || "").trim().toLowerCase();
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasBlockedFlag(value) {
  return value === true || normalizeControlValue(value) === "true";
}

function requestsMockDisabled(value) {
  return value === false || normalizeControlValue(value) === "false";
}

function isUnknownMode(mode) {
  if (mode == null || mode === "") return false;
  return !ALLOWED_MODES.has(normalizeControlValue(mode));
}

function isBlockedExecutionRequest(body = {}) {
  if (!isPlainObject(body)) return false;
  const context = isPlainObject(body.context) ? body.context : {};
  const mode = body.executionMode ?? context.executionMode ?? context.mode;
  const provider = normalizeControlValue(body.provider ?? context.provider);
  return (
    requestsMockDisabled(body.mockOnly) ||
    requestsMockDisabled(context.mockOnly) ||
    hasBlockedFlag(body.externalExecution) ||
    hasBlockedFlag(context.externalExecution) ||
    hasBlockedFlag(body.externalCommunication) ||
    hasBlockedFlag(context.externalCommunication) ||
    hasBlockedFlag(body.production) ||
    hasBlockedFlag(context.production) ||
    hasBlockedFlag(body.productionExecution) ||
    hasBlockedFlag(context.productionExecution) ||
    hasBlockedFlag(body.isExternalRequest) ||
    hasBlockedFlag(context.isExternalRequest) ||
    isUnknownMode(mode) ||
    REAL_PROVIDERS.has(provider)
  );
}

function buildMockReply(message, context = {}) {
  const mode = context.mode || "general";
  return [
    "KEVIRIO Mock AIです。",
    "外部API、fetch、Production実行は行いません。",
    `依頼: ${message}`,
    `モード: ${mode}`,
    "次の一手: Ownerは成果物を確認し、OK / 修正する / あとで のいずれかを選んでください。",
  ].join("\n");
}

const SAFE_REASON_CODES = new Set(["OWNER_SESSION_INVALID", "OWNER_AUTH_CONTEXT_REQUIRED", "OWNER_PROFILE_NOT_ACTIVE", "REQUEST_ORIGIN_NOT_ALLOWED", "OWNER_AUTH_PROVIDER_REQUIRED", "REQUEST_INTEGRITY_REQUIRED", "SERVER_USAGE_STORE_REQUIRED", "USAGE_RESERVATION_FAILED", "USAGE_COMMIT_FAILED", "USAGE_RELEASE_FAILED", "SANDBOX_REQUEST_ALREADY_CLAIMED", "LIVE_SANDBOX_FEATURE_LOCKED", "PROVIDER_CREDENTIAL_REQUIRED", "PROVIDER_EXECUTION_FAILED"]);
function normalizedApiFailure(error) { const reasonCode = SAFE_REASON_CODES.has(error?.reasonCode) ? error.reasonCode : "SERVER_USAGE_STORE_REQUIRED"; return { ok: false, status: "blocked", reasonCode, message: "Sandbox request could not be completed.", productionExecution: false, publishEnabled: false, actualRevenueConnected: false, ledgerAppend: false }; }

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = isPlainObject(req.body) ? req.body : {};
  if (body.action === "sandboxGenerateRevenueLanes") {
    try {
      const verified = await resolveVerifiedOwnerContext(req);
      if (!verified.ok) return res.status(403).json(normalizedApiFailure({ reasonCode: verified.reasonCode }));
      const usageStore = createVerifiedSupabaseUsageStoreAdapter(createSupabaseServerClient(), verified.context);
      const result = await executeSandboxResponse(body, { ownerAuthenticated: true, featureEnabled: process.env.KEVIRIO_OPENAI_SANDBOX_ENABLED === "true", usageStore, credential: process.env.OPENAI_API_KEY, ownerContext: verified.context });
      const statusCode = result.ok ? 200 : result.reasonCode === "PROVIDER_CREDENTIAL_REQUIRED" ? 503 : result.status === "blocked" ? 403 : 502;
      return res.status(statusCode).json(result);
    } catch (error) {
      return res.status(503).json(normalizedApiFailure(error));
    }
  }
  if (body.action != null) {
    return res.status(400).json({ ok: false, status: "blocked", reasonCode: "UNKNOWN_ACTION", message: "未対応の操作です。" });
  }
  const { message, context = {} } = body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "message is required." });
  }

  if (isBlockedExecutionRequest(body)) {
    return res.status(403).json({
      error: "Mock-only route blocked the request.",
      mockOnly: true,
      externalExecution: false,
      productionExecution: false,
      approvalConfirmed: false,
    });
  }

  return res.status(200).json({
    text: buildMockReply(message, context),
    provider: "local-mock",
    mockOnly: true,
    externalExecution: false,
    productionExecution: false,
    approvalConfirmed: false,
  });
}
import { executeSandboxResponse } from "../server/openaiSandboxAdapter.js";
import { resolveVerifiedOwnerContext } from "../server/verifiedOwnerContext.js";
import { createSupabaseServerClient } from "../server/supabaseServerClient.js";
import { createVerifiedSupabaseUsageStoreAdapter } from "../server/supabaseUsageStoreAdapter.js";
