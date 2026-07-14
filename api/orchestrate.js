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
  const mode = body.executionMode ?? body.mode;
  const provider = normalizeControlValue(body.provider);
  return (
    requestsMockDisabled(body.mockOnly) ||
    hasBlockedFlag(body.externalExecution) ||
    hasBlockedFlag(body.externalCommunication) ||
    hasBlockedFlag(body.production) ||
    hasBlockedFlag(body.productionExecution) ||
    hasBlockedFlag(body.isExternalRequest) ||
    isUnknownMode(mode) ||
    REAL_PROVIDERS.has(provider)
  );
}

function buildMockOrchestration({ message, mode }) {
  return [
    "KEVIRIO Mock Orchestrator",
    `mode: ${mode}`,
    `request: ${message}`,
    "AI社員は対象成果物だけを処理し、Content Pipelineへ戻します。",
    "外部送信、公開、承認確定、Production実行は行いません。",
  ].join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = isPlainObject(req.body) ? req.body : {};
  const { message, mode = "general", provider = "local-mock" } = body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "message is required" });
  }

  if (isBlockedExecutionRequest(body)) {
    return res.status(403).json({
      ok: false,
      error: "Mock-only route blocked the request.",
      mockOnly: true,
      externalExecution: false,
      productionExecution: false,
      approvalConfirmed: false,
    });
  }

  return res.status(200).json({
    ok: true,
    mode,
    selected: "local-mock",
    requestedProvider: provider,
    fallbackUsed: false,
    tried: ["local-mock"],
    provider: "local-mock",
    model: "preflight-mock",
    text: buildMockOrchestration({ message, mode }),
    governance: {
      ownerFinalDecision: true,
      externalExecution: false,
      secretsExposed: false,
      productionExecution: false,
      approvalConfirmed: false,
    },
  });
}
