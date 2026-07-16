export const INTEGRATION_CAPABILITY_SCHEMA_VERSION = "2.0.0";

export const INTEGRATION_CAPABILITIES = Object.freeze([
  {
    integrationId: "openai",
    displayName: "OpenAI",
    category: "AI Core",
    capability: "ai",
    desiredPurpose: "AI社員の文章生成、判断補助、レビュー補助",
    implementationStatus: "credentialRequired",
    operatingMode: "mock",
    credentialLocation: "serverOnly",
    credentialConfigured: "notExposed",
    externalExecution: false,
    productionExecution: false,
    approvalConfirmed: false,
    requiredBeforeEnablement: ["server-only credential storage", "provider terms review", "cost monitoring"],
    riskLevel: "high",
    ownerNextAction: "最初に接続するAI Provider候補としてSecurity Reviewへ進める",
  },
  {
    integrationId: "claude",
    displayName: "Claude",
    category: "AI Core",
    capability: "ai",
    desiredPurpose: "長文レビュー、法務・ブランド観点の補助",
    implementationStatus: "planned",
    operatingMode: "mock",
    credentialLocation: "serverOnly",
    credentialConfigured: "notExposed",
    externalExecution: false,
    productionExecution: false,
    approvalConfirmed: false,
    requiredBeforeEnablement: ["server-only credential storage", "provider terms review"],
    riskLevel: "medium",
    ownerNextAction: "OpenAI後の代替Providerとして整理",
  },
  {
    integrationId: "gemini",
    displayName: "Gemini",
    category: "AI Core",
    capability: "ai",
    desiredPurpose: "調査、要約、多言語補助",
    implementationStatus: "planned",
    operatingMode: "mock",
    credentialLocation: "serverOnly",
    credentialConfigured: "notExposed",
    externalExecution: false,
    productionExecution: false,
    approvalConfirmed: false,
    requiredBeforeEnablement: ["server-only credential storage", "privacy review"],
    riskLevel: "medium",
    ownerNextAction: "AI Coreの冗長化候補として保留",
  },
  {
    integrationId: "perplexity",
    displayName: "Perplexity",
    category: "Research",
    capability: "ai",
    desiredPurpose: "市場調査、競合調査、根拠収集",
    implementationStatus: "securityReviewRequired",
    operatingMode: "mock",
    credentialLocation: "serverOnly",
    credentialConfigured: "notExposed",
    externalExecution: false,
    productionExecution: false,
    approvalConfirmed: false,
    requiredBeforeEnablement: ["source policy", "citation policy", "privacy review"],
    riskLevel: "high",
    ownerNextAction: "調査情報の扱いと引用方針を確認",
  },
  {
    integrationId: "github",
    displayName: "GitHub",
    category: "Development",
    capability: "development",
    desiredPurpose: "Issue、PR、Release管理",
    implementationStatus: "ownerActionRequired",
    operatingMode: "mock",
    credentialLocation: "serverOnly",
    credentialConfigured: "notExposed",
    externalExecution: false,
    productionExecution: false,
    approvalConfirmed: false,
    requiredBeforeEnablement: ["OAuth app review", "least privilege scope", "audit logging"],
    riskLevel: "medium",
    ownerNextAction: "必要Scopeを最小化して確認",
  },
  {
    integrationId: "google-search-console",
    displayName: "Google Search Console",
    category: "Analytics",
    capability: "analytics",
    desiredPurpose: "SEO検索クエリ、掲載順位、流入分析",
    implementationStatus: "ownerActionRequired",
    operatingMode: "mock",
    credentialLocation: "serverOnly",
    credentialConfigured: "notExposed",
    externalExecution: false,
    productionExecution: false,
    approvalConfirmed: false,
    requiredBeforeEnablement: ["Google OAuth review", "property access confirmation", "privacy review"],
    riskLevel: "medium",
    ownerNextAction: "接続するGoogle propertyを選ぶ",
  },
  {
    integrationId: "google-analytics",
    displayName: "Google Analytics",
    category: "Analytics",
    capability: "analytics",
    desiredPurpose: "Sandboxではなく実トラフィック計測の将来接続",
    implementationStatus: "ownerActionRequired",
    operatingMode: "mock",
    credentialLocation: "serverOnly",
    credentialConfigured: "notExposed",
    externalExecution: false,
    productionExecution: false,
    approvalConfirmed: false,
    requiredBeforeEnablement: ["property selection", "privacy review", "analytics source of truth definition"],
    riskLevel: "high",
    ownerNextAction: "Analytics Source of Truthを定義",
  },
  {
    integrationId: "youtube",
    displayName: "YouTube",
    category: "Publishing",
    capability: "publishing",
    desiredPurpose: "動画投稿、Shorts、コメント分析",
    implementationStatus: "adapterMissing",
    operatingMode: "mock",
    credentialLocation: "serverOnly",
    credentialConfigured: "notExposed",
    externalExecution: false,
    productionExecution: false,
    approvalConfirmed: false,
    requiredBeforeEnablement: ["publishing approval model", "content policy review", "rollback plan"],
    riskLevel: "critical",
    ownerNextAction: "Publishingは最後に回し、まずAnalytics接続を優先",
  },
  {
    integrationId: "instagram",
    displayName: "Instagram",
    category: "Publishing",
    capability: "publishing",
    desiredPurpose: "投稿、リール、インサイト確認",
    implementationStatus: "adapterMissing",
    operatingMode: "mock",
    credentialLocation: "serverOnly",
    credentialConfigured: "notExposed",
    externalExecution: false,
    productionExecution: false,
    approvalConfirmed: false,
    requiredBeforeEnablement: ["account ownership confirmation", "publishing approval model", "brand safety review"],
    riskLevel: "critical",
    ownerNextAction: "外部公開権限は未接続のまま維持",
  },
  {
    integrationId: "x",
    displayName: "X",
    category: "Publishing",
    capability: "publishing",
    desiredPurpose: "投稿、分析、反応確認",
    implementationStatus: "adapterMissing",
    operatingMode: "mock",
    credentialLocation: "serverOnly",
    credentialConfigured: "notExposed",
    externalExecution: false,
    productionExecution: false,
    approvalConfirmed: false,
    requiredBeforeEnablement: ["policy review", "publishing approval model", "incident response"],
    riskLevel: "critical",
    ownerNextAction: "炎上・誤投稿対策を先に定義",
  },
  {
    integrationId: "threads",
    displayName: "Threads",
    category: "Publishing",
    capability: "publishing",
    desiredPurpose: "短文投稿、会話導線、反応確認",
    implementationStatus: "adapterMissing",
    operatingMode: "mock",
    credentialLocation: "serverOnly",
    credentialConfigured: "notExposed",
    externalExecution: false,
    productionExecution: false,
    approvalConfirmed: false,
    requiredBeforeEnablement: ["policy review", "publishing approval model"],
    riskLevel: "high",
    ownerNextAction: "Instagram連携後に検討",
  },
  {
    integrationId: "tiktok",
    displayName: "TikTok",
    category: "Publishing",
    capability: "publishing",
    desiredPurpose: "動画投稿、反応確認、海外拡散",
    implementationStatus: "adapterMissing",
    operatingMode: "mock",
    credentialLocation: "serverOnly",
    credentialConfigured: "notExposed",
    externalExecution: false,
    productionExecution: false,
    approvalConfirmed: false,
    requiredBeforeEnablement: ["music rights review", "publishing approval model", "privacy review"],
    riskLevel: "critical",
    ownerNextAction: "権利確認が完了するまで保留",
  },
  {
    integrationId: "canva",
    displayName: "Canva",
    category: "Design",
    capability: "design",
    desiredPurpose: "画像・資料・SNS素材の制作連携",
    implementationStatus: "securityReviewRequired",
    operatingMode: "mock",
    credentialLocation: "serverOnly",
    credentialConfigured: "notExposed",
    externalExecution: false,
    productionExecution: false,
    approvalConfirmed: false,
    requiredBeforeEnablement: ["asset permission review", "export boundary", "owner approval model"],
    riskLevel: "medium",
    ownerNextAction: "素材の権利境界を確認",
  },
  {
    integrationId: "affiliate-asp",
    displayName: "Affiliate / ASP",
    category: "Revenue",
    capability: "affiliate",
    desiredPurpose: "Affiliate案件、成果確認、リンク管理",
    implementationStatus: "notVerified",
    operatingMode: "mock",
    credentialLocation: "serverOnly",
    credentialConfigured: "notExposed",
    externalExecution: false,
    productionExecution: false,
    approvalConfirmed: false,
    requiredBeforeEnablement: ["program terms review", "link disclosure policy", "actual revenue source of truth"],
    riskLevel: "high",
    ownerNextAction: "成果計測のSource of Truthを定義",
  },
]);

const ALLOWED_CAPABILITIES = new Set(["ai", "analytics", "publishing", "design", "affiliate", "development"]);
const ALLOWED_STATUSES = new Set(["planned", "adapterMissing", "credentialRequired", "ownerActionRequired", "securityReviewRequired", "notVerified"]);
const ALLOWED_RISKS = new Set(["low", "medium", "high", "critical"]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function validateIntegrationCapability(item) {
  const errors = [];
  if (!isPlainObject(item)) {
    return { valid: false, errors: [{ code: "INTEGRATION_INVALID", field: "integration", message: "Integration must be an object." }] };
  }
  const required = [
    "integrationId",
    "displayName",
    "category",
    "capability",
    "desiredPurpose",
    "implementationStatus",
    "operatingMode",
    "credentialLocation",
    "credentialConfigured",
    "externalExecution",
    "productionExecution",
    "approvalConfirmed",
    "requiredBeforeEnablement",
    "riskLevel",
    "ownerNextAction",
  ];
  for (const field of required) {
    if (item[field] === undefined || item[field] === null || item[field] === "") {
      errors.push({ code: "REQUIRED_FIELD_MISSING", field, message: `${field} is required.` });
    }
  }
  if (!ALLOWED_CAPABILITIES.has(item.capability)) errors.push({ code: "CAPABILITY_INVALID", field: "capability", message: "Unknown capability." });
  if (!ALLOWED_STATUSES.has(item.implementationStatus)) errors.push({ code: "STATUS_INVALID", field: "implementationStatus", message: "Unknown implementation status." });
  if (!ALLOWED_RISKS.has(item.riskLevel)) errors.push({ code: "RISK_INVALID", field: "riskLevel", message: "Unknown risk level." });
  if (item.operatingMode !== "mock") errors.push({ code: "MODE_FORBIDDEN", field: "operatingMode", message: "Only mock mode is allowed." });
  if (item.credentialLocation !== "serverOnly") errors.push({ code: "CREDENTIAL_LOCATION_FORBIDDEN", field: "credentialLocation", message: "Credentials must be server-only." });
  if (item.credentialConfigured !== "notExposed") errors.push({ code: "CREDENTIAL_STATE_FORBIDDEN", field: "credentialConfigured", message: "Credential state must not be exposed." });
  if (item.externalExecution !== false) errors.push({ code: "EXTERNAL_FORBIDDEN", field: "externalExecution", message: "External execution must be false." });
  if (item.productionExecution !== false) errors.push({ code: "PRODUCTION_FORBIDDEN", field: "productionExecution", message: "Production execution must be false." });
  if (item.approvalConfirmed !== false) errors.push({ code: "APPROVAL_FORBIDDEN", field: "approvalConfirmed", message: "Approval must not be confirmed." });
  if (!Array.isArray(item.requiredBeforeEnablement) || item.requiredBeforeEnablement.length === 0) {
    errors.push({ code: "REQUIREMENTS_MISSING", field: "requiredBeforeEnablement", message: "Enablement requirements are required." });
  }
  return { valid: errors.length === 0, errors };
}

export function buildIntegrationCapabilityRegistry(items = INTEGRATION_CAPABILITIES) {
  if (!Array.isArray(items)) {
    return { ok: false, status: "blocked", integrations: [], errors: [{ code: "REGISTRY_INPUT_INVALID", field: "integrations", message: "Integrations must be an array." }] };
  }
  const ids = new Set();
  const errors = [];
  const integrations = items.map((item) => ({ ...item, requiredBeforeEnablement: [...(item.requiredBeforeEnablement || [])] }));
  for (const item of integrations) {
    const validation = validateIntegrationCapability(item);
    errors.push(...validation.errors.map((error) => ({ ...error, field: `${item.integrationId || "unknown"}.${error.field}` })));
    if (ids.has(item.integrationId)) errors.push({ code: "DUPLICATE_INTEGRATION_ID", field: item.integrationId, message: "Integration IDs must be unique." });
    ids.add(item.integrationId);
  }
  const categories = [...new Set(integrations.map((item) => item.category))].sort();
  const statusCounts = integrations.reduce((acc, item) => ({ ...acc, [item.implementationStatus]: (acc[item.implementationStatus] || 0) + 1 }), {});
  return {
    ok: errors.length === 0,
    status: errors.length ? "blocked" : "ready",
    schemaVersion: INTEGRATION_CAPABILITY_SCHEMA_VERSION,
    operatingMode: "mock",
    totalProviders: integrations.length,
    categories,
    statusCounts,
    integrations,
    errors,
  };
}
