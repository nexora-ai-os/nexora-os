import assert from "node:assert/strict";
import { AFFILIATE_STORAGE_KEY, CROSS_LANE_STORAGE_KEY, DIRECT_SERVICE_STORAGE_KEY, SNS_STORAGE_KEY, loadCrossLaneRevenue, orchestrateThreeRevenueLanes } from "../src/services/crossLaneRevenueOrchestrator.js";

class Storage { constructor(failAt = 0) { this.map = new Map(); this.writes = 0; this.failAt = failAt; } getItem(key) { return this.map.has(key) ? this.map.get(key) : null; } setItem(key, value) { this.writes += 1; if (this.failAt && this.writes === this.failAt) throw new Error("fail"); this.map.set(key, value); } removeItem(key) { this.map.delete(key); } }
let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log(`PASS ${name}`); }
function makeSource(exportId = "export-1", revisionId = "revision-1", decisionId = "decision-1") { return { exportId, correlationId: "correlation-1", sourceCandidateId: "candidate-1", sourceRevisionCandidateId: revisionId, reviewDecisionId: decisionId, schemaVersion: "2.0.0", title: "発信改善", campaignSummary: "安全な制作", contentBrief: "中小企業Owner", riskNotes: ["断定禁止"], prohibitedClaims: ["成果保証"], status: "publishReadyMock", dataMode: "mock", isMock: true, publishEnabled: false, approvalConfirmed: false, productionExecution: false, externalExecution: false, actualRevenueConnected: false, ledgerAppend: false }; }
function context(revisionId = "revision-1", decision = "approvedForMockWorkflow", decisionId = "decision-1") { return { reviewDecision: { reviewDecisionId: decisionId, decision }, latestRevision: revisionId ? { revisionCandidateId: revisionId } : null }; }
const source = makeSource(); const sourceSnapshot = JSON.stringify(source); const storage = new Storage(); const first = orchestrateThreeRevenueLanes(storage, source, context());
check("approved current source creates all lanes", () => assert.equal(first.ok, true));
check("direct service recommended first", () => assert.equal(first.orchestration.recommendedFirstLane, "directService"));
check("correlation preserved in all lanes", () => assert.ok(Object.values(first.orchestration.lanes).every(x => x.correlationId === source.correlationId)));
check("storage contains one each", () => assert.deepEqual([DIRECT_SERVICE_STORAGE_KEY, AFFILIATE_STORAGE_KEY, SNS_STORAGE_KEY, CROSS_LANE_STORAGE_KEY].map(key => Object.keys(JSON.parse(storage.getItem(key))[Object.keys(JSON.parse(storage.getItem(key))).find(k => k.endsWith("ById"))]).length), [1, 1, 1, 1]));
const before = [DIRECT_SERVICE_STORAGE_KEY, AFFILIATE_STORAGE_KEY, SNS_STORAGE_KEY, CROSS_LANE_STORAGE_KEY].map(key => storage.getItem(key)); const second = orchestrateThreeRevenueLanes(storage, source, context());
check("duplicate is idempotent", () => assert.equal(second.idempotent, true));
check("duplicate writes nothing", () => assert.deepEqual(before, [DIRECT_SERVICE_STORAGE_KEY, AFFILIATE_STORAGE_KEY, SNS_STORAGE_KEY, CROSS_LANE_STORAGE_KEY].map(key => storage.getItem(key))));
check("reload restores exact source", () => assert.equal(loadCrossLaneRevenue(storage, source.exportId).orchestration.orchestrationId, first.orchestration.orchestrationId));
check("missing correlation rejected", () => assert.equal(orchestrateThreeRevenueLanes(new Storage(), { ...source, correlationId: null }, context()).ok, false));
check("Actual Revenue source field rejected", () => assert.equal(orchestrateThreeRevenueLanes(new Storage(), { ...source, actualRevenue: 1 }, context()).ok, false));
check("credential source field rejected", () => assert.equal(orchestrateThreeRevenueLanes(new Storage(), { ...source, nested: { apiKey: "secret" } }, context()).ok, false));
check("revision requested rejects old source", () => assert.equal(orchestrateThreeRevenueLanes(new Storage(), source, context("revision-1", "revisionRequested")).ok, false));
check("rejected source rejected", () => assert.equal(orchestrateThreeRevenueLanes(new Storage(), source, context("revision-1", "rejected")).ok, false));
check("old revision rejected", () => assert.equal(orchestrateThreeRevenueLanes(new Storage(), source, context("revision-2")).ok, false));
const newSource = makeSource("export-2", "revision-2", "decision-2"); const newResult = orchestrateThreeRevenueLanes(storage, newSource, context("revision-2", "approvedForMockWorkflow", "decision-2"));
check("new approved revision creates new candidate", () => assert.equal(newResult.ok, true));
check("old candidate not returned for new source", () => assert.equal(loadCrossLaneRevenue(storage, newSource.exportId).orchestration.sourceExportId, "export-2"));
const corrupt = new Storage(); corrupt.map.set(DIRECT_SERVICE_STORAGE_KEY, "not-json");
check("corrupted storage fails closed", () => assert.equal(orchestrateThreeRevenueLanes(corrupt, source, context()).status, "corrupted"));
const failing = new Storage(3); const failed = orchestrateThreeRevenueLanes(failing, source, context());
check("partial failure rolls back", () => assert.equal(failed.status, "save_failed"));
check("new keys removed on rollback", () => assert.equal(failing.map.size, 0));
check("input not mutated", () => assert.equal(JSON.stringify(source), sourceSnapshot));
check("live provider remains unused", () => assert.equal(first.orchestration.liveProviderUsed, false));
console.log(`Cross-lane revenue E2E verification: ${passed}/20 passed`);
