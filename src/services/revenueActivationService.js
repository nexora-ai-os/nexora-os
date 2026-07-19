const SCHEMA_VERSION = "1.0.0";
const USAGE_LIMIT_USD = 1;
const REQUEST_LIMIT_USD = 0.03;
export const ACTIVATION_STORAGE_KEY = "kevirio:revenue-activation:v2";
export const EVIDENCE_STORAGE_KEY = "kevirio:revenue-evidence-candidates:v2";

const blocked = (reasonCode) => ({ authorized: false, status: "locked", reasonCode, ownerIdentityVerified: false, sessionVerified: false, csrfVerified: false, productionExecution: false });

export function authorizeOwnerSandboxAction(context = {}) {
  if (context.ownerIdentityVerified !== true || context.sessionVerified !== true) return blocked("OWNER_AUTH_PROVIDER_REQUIRED");
  if (context.csrfVerified !== true) return blocked("CSRF_SESSION_REQUIRED");
  if (context.emergencyStopActive === true) return blocked("EMERGENCY_STOP_ACTIVE");
  return { authorized: true, status: "ready", reasonCode: "OWNER_AUTHORIZED", ownerIdentityVerified: true, sessionVerified: true, csrfVerified: true, productionExecution: false };
}

export function createServerUsageStoreContract() {
  return { getMonthlyUsage: async () => null, reserveRequestBudget: async () => null, commitUsage: async () => false, releaseReservation: async () => false, findCachedGeneration: async () => null, saveCachedGeneration: async () => false, persistent: false };
}

export function evaluateUsageStore(store) {
  const required = ["getMonthlyUsage", "reserveRequestBudget", "commitUsage", "releaseReservation", "findCachedGeneration", "saveCachedGeneration"];
  return { ready: Boolean(store?.persistent === true && required.every((key) => typeof store[key] === "function")), reasonCode: store?.persistent === true ? "USAGE_STORE_READY" : "SERVER_USAGE_STORE_REQUIRED", monthlyLimitUsd: USAGE_LIMIT_USD, requestLimitUsd: REQUEST_LIMIT_USD };
}

export function buildSmokeReadiness({ authenticationReady = false, usageStoreReady = false, budgetReady = false, emergencyStopClear = false } = {}) {
  const blockers = [];
  if (!authenticationReady) blockers.push("OWNER_AUTH_PROVIDER_REQUIRED");
  if (!usageStoreReady) blockers.push("SERVER_USAGE_STORE_REQUIRED");
  if (!budgetReady) blockers.push("BUDGET_NOT_READY");
  if (!emergencyStopClear) blockers.push("EMERGENCY_STOP_ACTIVE");
  return { status: blockers.length ? "locked" : "readyForOwnerSmokeApproval", authenticationReady, usageStoreReady, credentialStatus: "notExposed", budgetReady, emergencyStopClear, providerExecutionPerformed: false, blockers, nextAction: blockers.length ? "認証Providerと永続Usage Storeを接続する" : "OwnerがSandbox Smoke Testを最終承認する" };
}

export function buildDirectServiceExport({ sourceExportId, correlationId, packageDraft }) {
  return { schemaVersion: SCHEMA_VERSION, sourceExportId, correlationId, packageDraft, dataMode: "mock", isMock: true, externalExecution: false, productionExecution: false, actualRevenueConnected: false, ledgerAppend: false, approvalConfirmed: false };
}

export function buildSnsManualExport({ sourceExportId, correlationId, posts = [] }) {
  return { schemaVersion: SCHEMA_VERSION, sourceExportId, correlationId, posts: posts.slice(0, 5), disclosure: "広告・Affiliate該当時は明示", manualExportOnly: true, externalPublishEnabled: false, accountConnected: false, publishQueueConnected: false, externalExecution: false, productionExecution: false };
}

export function buildAffiliateManualExport({ sourceExportId, correlationId, title, disclosure = "広告・Affiliate開示が必要", riskFlags = [] }) {
  return { schemaVersion: SCHEMA_VERSION, sourceExportId, correlationId, title, disclosure, affiliateUrl: null, linkStatus: "notConnected", programVerificationRequired: true, productVerificationRequired: true, riskFlags, manualExportOnly: true, externalExecution: false, productionExecution: false };
}

export function buildRevenueEvidenceCandidate({ correlationId, sourceType, sourceReference, revenueModel, amountCandidate = null, currency = "JPY", evidenceRequired = true }) {
  return { evidenceCandidateId: `evidence:${correlationId}:${sourceType}`, schemaVersion: SCHEMA_VERSION, correlationId, sourceType, sourceReference, revenueModel, amountCandidate, currency, occurredAtCandidate: null, verificationStatus: "unverified", evidenceRequired, ownerVerificationRequired: true, verifiedBy: null, verifiedAt: null, actualRevenueRecorded: false, ledgerAppend: false, externalExecution: false, productionExecution: false, actualRevenueConnected: false, dataMode: "mock", isMock: true, riskFlags: [] };
}

function safeRead(storage, key, fallback) { try { const raw = storage?.getItem(key); if (raw == null) return fallback; const value = JSON.parse(raw); return value; } catch { return null; } }
function validWorkspace(value, max = 50) { return value && value.schemaVersion === "2.0.0" && value.dataMode === "mock" && value.isMock === true && Array.isArray(value.items) && value.items.length <= max && value.items.every((item) => item && item.dataMode === "mock" && item.isMock === true && item.productionExecution === false && item.externalExecution === false && item.actualRevenueConnected === false && item.ledgerAppend === false); }
export function loadRevenueActivationWorkspace(storage) { const value = safeRead(storage, ACTIVATION_STORAGE_KEY, { schemaVersion: "2.0.0", dataMode: "mock", isMock: true, items: [] }); return validWorkspace(value) ? value : { schemaVersion: "2.0.0", dataMode: "mock", isMock: true, items: [], status: "blocked", reasonCode: "WORKSPACE_INVALID" }; }
export function saveRevenueActivationWorkspace(storage, workspace) { if (!validWorkspace(workspace)) return { ok: false, reasonCode: "WORKSPACE_INVALID" }; try { storage.setItem(ACTIVATION_STORAGE_KEY, JSON.stringify(workspace)); return { ok: true }; } catch { return { ok: false, reasonCode: "WORKSPACE_WRITE_FAILED" }; } }
export function loadRevenueEvidenceCandidates(storage) { const value = safeRead(storage, EVIDENCE_STORAGE_KEY, { schemaVersion: "2.0.0", dataMode: "mock", isMock: true, items: [] }); return validWorkspace(value) ? value : { schemaVersion: "2.0.0", dataMode: "mock", isMock: true, items: [], status: "blocked", reasonCode: "EVIDENCE_STORAGE_INVALID" }; }
export function saveRevenueEvidenceCandidate(storage, candidate) { const current = loadRevenueEvidenceCandidates(storage); if (current.reasonCode) return { ok: false, reasonCode: current.reasonCode }; if (!candidate || candidate.dataMode !== "mock" || candidate.isMock !== true || candidate.actualRevenueRecorded !== false || candidate.ledgerAppend !== false) return { ok: false, reasonCode: "EVIDENCE_INVALID" }; const next = { ...current, items: [...current.items.filter((item) => item.evidenceCandidateId !== candidate.evidenceCandidateId), candidate] }; return saveRaw(storage, EVIDENCE_STORAGE_KEY, next, "EVIDENCE_WRITE_FAILED"); }
export function buildManualExportDocuments({ directService, sns, affiliate }) { return { "Proposal.md": `# ${directService?.serviceName || "Direct Service"}\n\n${directService?.proposalSummary || "Mock proposal"}\n\nMock only. No customer communication.`, "Inquiry-Reply.md": `# Inquiry Reply\n\n${directService?.proposalSummary || "Mock inquiry reply"}\n\nManual review required.`, "Discovery-Questions.md": `# Discovery Questions\n\n- Customer problem\n- Required inputs\n- Delivery scope`, "SNS-Candidates.md": `# SNS Candidates\n\n${(sns?.posts || []).slice(0, 5).map((x, i) => `## Post ${i + 1}\n${x.caption || x.hook || "Mock SNS draft"}`).join("\n\n")}\n\nManual export only.`, "Affiliate-Candidates.md": `# Affiliate Candidates\n\n${affiliate?.articleTitle || "Mock affiliate candidate"}\n\nDisclosure required. affiliateUrl: null. linkStatus: notConnected.` }; }
export function saveActivationTransaction(storage, workspace, candidate) { const oldWorkspace = storage.getItem(ACTIVATION_STORAGE_KEY); const oldEvidence = storage.getItem(EVIDENCE_STORAGE_KEY); const first = saveRevenueActivationWorkspace(storage, workspace); if (!first.ok) return first; const second = saveRevenueEvidenceCandidate(storage, candidate); if (!second.ok) { try { oldWorkspace == null ? storage.removeItem(ACTIVATION_STORAGE_KEY) : storage.setItem(ACTIVATION_STORAGE_KEY, oldWorkspace); oldEvidence == null ? storage.removeItem(EVIDENCE_STORAGE_KEY) : storage.setItem(EVIDENCE_STORAGE_KEY, oldEvidence); } catch { return { ok: false, reasonCode: "TRANSACTION_ROLLBACK_FAILED" }; } return { ok: false, reasonCode: second.reasonCode }; } return { ok: true }; }
function saveRaw(storage, key, value, reasonCode) { try { storage.setItem(key, JSON.stringify(value)); return { ok: true }; } catch { return { ok: false, reasonCode }; } }

export { SCHEMA_VERSION, USAGE_LIMIT_USD, REQUEST_LIMIT_USD };
