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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = isPlainObject(req.body) ? req.body : {};
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
