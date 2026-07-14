import { mockMarketSignals } from "../src/data/mockMarketSignals.js";
import { DATA_MODES, GATE_RESULTS, LANES } from "../src/data/marketIntelligenceSchemas.js";
import { buildMarketIntelligenceFoundation } from "../src/services/marketIntelligenceEngine.js";
import { buildMarketIntelligenceViewModel } from "../src/services/marketIntelligenceAdapter.js";

const EVALUATION_TIME = "2026-07-14T12:00:00.000Z";
const EVALUATION_TIMESTAMP = Date.parse(EVALUATION_TIME);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assert(name, condition, details = "") {
  if (!condition) {
    throw new Error(`${name}${details ? `: ${details}` : ""}`);
  }
}

function buildFoundation() {
  return buildMarketIntelligenceFoundation(clone(mockMarketSignals), EVALUATION_TIMESTAMP);
}

function buildViewModel(foundation = buildFoundation(), evaluationTime = EVALUATION_TIME) {
  return buildMarketIntelligenceViewModel(foundation, evaluationTime);
}

function withFirstTop3(mutator) {
  const foundation = buildFoundation();
  mutator(foundation.top3[0], foundation);
  return foundation;
}

function collectKeys(value, keys = new Set()) {
  if (!value || typeof value !== "object") return keys;
  if (Array.isArray(value)) {
    value.forEach((entry) => collectKeys(entry, keys));
    return keys;
  }
  Object.entries(value).forEach(([key, entry]) => {
    keys.add(key);
    collectKeys(entry, keys);
  });
  return keys;
}

function expectStatus(name, foundation, expectedStatus, expectedOk = false) {
  const viewModel = buildViewModel(foundation);
  assert(name, viewModel.status === expectedStatus, `expected ${expectedStatus}, got ${viewModel.status}`);
  assert(`${name} ok`, viewModel.ok === expectedOk);
  return viewModel;
}

const tests = [
  ["Normal Foundation Result returns ready", () => {
    const viewModel = buildViewModel();
    assert("ready", viewModel.ok === true && viewModel.status === "ready");
  }],
  ["Top 3 count maps to 3 recommendations", () => {
    const viewModel = buildViewModel();
    assert("recommendation count", viewModel.recommendations.length === 3);
  }],
  ["Top 3 order is preserved", () => {
    const foundation = buildFoundation();
    const viewModel = buildViewModel(foundation);
    assert("order", viewModel.recommendations.map((item) => item.opportunityId).join("|") === foundation.top3.map((item) => item.opportunityId).join("|"));
  }],
  ["Rank starts at 1 and increments", () => {
    const viewModel = buildViewModel();
    assert("rank", viewModel.recommendations.every((item, index) => item.rank === index + 1));
  }],
  ["Cash and Asset Japanese labels appear", () => {
    const titles = buildViewModel().recommendations.map((item) => item.primary.title).join(" ");
    assert("cash label", titles.includes("短期収益"));
    assert("asset label", titles.includes("資産形成"));
  }],
  ["Forecast label uses Japanese estimated revenue wording", () => {
    assert("forecast label", buildViewModel().recommendations.every((item) => item.primary.forecastLabel.startsWith("推定売上:")));
  }],
  ["Mock safety is explicit on every recommendation", () => {
    assert("mock safety", buildViewModel().recommendations.every((item) => item.safety.dataMode === DATA_MODES.MOCK && item.safety.isMock === true));
  }],
  ["Actual revenue is shown as unavailable, not numeric", () => {
    const text = JSON.stringify(buildViewModel());
    assert("actual unavailable", text.includes("実売上は未接続"));
    assert("no actual fields", !collectKeys(buildViewModel()).has("actualRevenue"));
  }],
  ["adjustedConfidence is copied exactly", () => {
    const foundation = buildFoundation();
    const viewModel = buildViewModel(foundation);
    assert("confidence copy", viewModel.recommendations.every((item, index) => item.primary.adjustedConfidence === foundation.top3[index].adjustedConfidence));
  }],
  ["finalScore is copied exactly", () => {
    const foundation = buildFoundation();
    const viewModel = buildViewModel(foundation);
    assert("final score copy", viewModel.recommendations.every((item, index) => item.details.finalScore === foundation.top3[index].finalScore));
  }],
  ["Penalty is copied exactly", () => {
    const foundation = buildFoundation();
    const viewModel = buildViewModel(foundation);
    assert("penalty copy", viewModel.recommendations.every((item, index) => item.details.totalPenalty === foundation.top3[index].totalPenalty));
  }],
  ["Forecast low base high are copied exactly", () => {
    const foundation = buildFoundation();
    const viewModel = buildViewModel(foundation);
    assert("forecast copy", viewModel.recommendations.every((item, index) => item.primary.forecastRange.high === foundation.top3[index].forecastRevenueRange.high));
  }],
  ["Input object is not mutated", () => {
    const foundation = buildFoundation();
    const before = JSON.stringify(foundation);
    buildViewModel(foundation);
    assert("mutation", JSON.stringify(foundation) === before);
  }],
  ["Same input returns same output", () => {
    const foundation = buildFoundation();
    assert("deterministic", JSON.stringify(buildViewModel(foundation)) === JSON.stringify(buildViewModel(foundation)));
  }],
  ["Missing evaluationTime is rejected", () => {
    const viewModel = buildMarketIntelligenceViewModel(buildFoundation());
    assert("missing evaluation time", viewModel.status === "rejected" && viewModel.ok === false);
  }],
  ["Invalid evaluationTime is rejected", () => {
    const viewModel = buildMarketIntelligenceViewModel(buildFoundation(), "not-a-date");
    assert("invalid evaluation time", viewModel.status === "rejected" && viewModel.ok === false);
  }],
  ["dataMode real is rejected", () => {
    expectStatus("real data", { ...buildFoundation(), dataMode: DATA_MODES.REAL }, "rejected");
  }],
  ["isMock false is rejected", () => {
    expectStatus("isMock false", { ...buildFoundation(), isMock: false }, "rejected");
  }],
  ["Production true is rejected", () => {
    expectStatus("production true", { ...buildFoundation(), productionExecution: true }, "rejected");
  }],
  ["External true is rejected", () => {
    expectStatus("external true", { ...buildFoundation(), externalExecution: true }, "rejected");
  }],
  ["actualRevenue property is rejected", () => {
    expectStatus("actual revenue", { ...buildFoundation(), actualRevenue: 1 }, "rejected");
  }],
  ["confirmedRevenue property is rejected", () => {
    expectStatus("confirmed revenue", withFirstTop3((item) => { item.confirmedRevenue = 1; }), "rejected");
  }],
  ["Top 3 over 3 items is rejected", () => {
    const foundation = buildFoundation();
    foundation.top3 = [...foundation.top3, clone(foundation.top3[0])];
    expectStatus("top3 over", foundation, "rejected");
  }],
  ["Unknown lane is rejected", () => {
    expectStatus("unknown lane", withFirstTop3((item) => { item.lane = "other"; }), "rejected");
  }],
  ["adjustedConfidence 59.9 is hold", () => {
    expectStatus("low confidence", withFirstTop3((item) => { item.adjustedConfidence = 59.9; }), "hold");
  }],
  ["finalScore out of range is rejected", () => {
    expectStatus("score range", withFirstTop3((item) => { item.finalScore = 101; }), "rejected");
  }],
  ["Forecast low greater than base is hold", () => {
    expectStatus("forecast low base", withFirstTop3((item) => { item.forecastRevenueRange.low = item.forecastRevenueRange.base + 1; }), "hold");
  }],
  ["Forecast base greater than high is hold", () => {
    expectStatus("forecast base high", withFirstTop3((item) => { item.forecastRevenueRange.base = item.forecastRevenueRange.high + 1; }), "hold");
  }],
  ["Expired recommendation is hold", () => {
    expectStatus("expired", withFirstTop3((item) => { item.expiresAt = "2026-07-13T00:00:00.000Z"; }), "hold");
  }],
  ["High risk is rejected", () => {
    expectStatus("high risk", withFirstTop3((item) => { item.legalPolicyRisk = "high"; }), "rejected");
  }],
  ["Critical risk is rejected", () => {
    expectStatus("critical risk", withFirstTop3((item) => { item.legalPolicyRisk = "critical"; }), "rejected");
  }],
  ["Empty Top 3 returns empty", () => {
    const foundation = buildFoundation();
    foundation.top3 = [];
    expectStatus("empty", foundation, "empty");
  }],
  ["HOLD reason summary is aggregated", () => {
    const viewModel = buildViewModel();
    assert("hold count", viewModel.blocked.holdCount >= 1);
    assert("score too low summary", viewModel.blocked.reasonSummary.some((item) => item.reasonCode === "SCORE_TOO_LOW"));
  }],
  ["REJECT reason summary is aggregated", () => {
    const foundation = buildFoundation();
    foundation.opportunities.push({ validation: { result: GATE_RESULTS.REJECT, reasonCodes: ["HIGH_RISK_DETECTED"] } });
    const viewModel = buildViewModel(foundation);
    assert("reject count", viewModel.blocked.rejectedCount === 1);
  }],
  ["Unknown reason code gets safe owner message", () => {
    const foundation = buildFoundation();
    foundation.opportunities.push({ validation: { result: GATE_RESULTS.HOLD, reasonCodes: ["UNKNOWN_CODE"] } });
    const viewModel = buildViewModel(foundation);
    const unknown = viewModel.blocked.reasonSummary.find((item) => item.reasonCode === "UNKNOWN_CODE");
    assert("unknown message", unknown.ownerMessage === "確認が必要な候補があります。");
  }],
  ["Owner Decision remains disabled", () => {
    assert("owner disabled", buildViewModel().recommendations.every((item) => item.safety.ownerDecisionEnabled === false));
  }],
  ["Campaign Handoff remains disabled", () => {
    assert("campaign disabled", buildViewModel().recommendations.every((item) => item.safety.campaignHandoffEnabled === false));
  }],
  ["Recommendations max 3", () => {
    assert("max 3", buildViewModel().recommendations.length <= 3);
  }],
  ["ViewModel keeps mock dataMode only", () => {
    const viewModel = buildViewModel();
    assert("mock only", viewModel.dataMode === DATA_MODES.MOCK && viewModel.isMock === true);
  }],
  ["No LocalStorage reference in adapter module output", () => {
    assert("no localstorage", !JSON.stringify(buildViewModel()).includes("localStorage"));
  }],
  ["No legacy import text in adapter source", async () => {
    const fs = await import("node:fs/promises");
    const source = await fs.readFile(new URL("../src/services/marketIntelligenceAdapter.js", import.meta.url), "utf8");
    assert("no trendEngine", !source.includes("trendEngine"));
    assert("no opportunityEngine", !source.includes("opportunityEngine"));
    assert("no campaignEngine", !source.includes("campaignEngine"));
    assert("no revenueCampaignService", !source.includes("revenueCampaignService"));
  }],
  ["No external communication keywords in adapter source", async () => {
    const fs = await import("node:fs/promises");
    const source = await fs.readFile(new URL("../src/services/marketIntelligenceAdapter.js", import.meta.url), "utf8");
    assert("no fetch", !source.includes("fetch("));
    assert("no axios", !source.includes("axios"));
    assert("no websocket", !source.includes("WebSocket"));
  }],
  ["Primary display fields stay compact", () => {
    const primary = buildViewModel().recommendations[0].primary;
    const displayItems = ["title", "whyNow", "forecastLabel", "confidenceLabel", "nextAction"].filter((key) => Boolean(primary[key]));
    assert("display items", displayItems.length <= 5);
  }],
  ["Briefing contains one next action", () => {
    const briefing = buildViewModel().briefing;
    assert("one next action", briefing.oneNextAction === "最上位候補を確認してください。");
  }],
  ["Asset candidate flag is true for fixture", () => {
    assert("asset candidate", buildViewModel().briefing.hasAssetCandidate === true);
  }],
  ["Safety flags never enable production or external execution", () => {
    assert("safety false", buildViewModel().recommendations.every((item) => item.safety.productionExecution === false && item.safety.externalExecution === false));
  }],
  ["Non-object foundationResult is rejected", () => {
    const viewModel = buildMarketIntelligenceViewModel(null, EVALUATION_TIME);
    assert("null rejected", viewModel.status === "rejected" && viewModel.errors.length > 0);
  }],
];

let passed = 0;
const failures = [];

for (const [name, run] of tests) {
  try {
    await run();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    failures.push({ name, error });
    console.error(`FAIL ${name}`);
    console.error(`  ${error.message}`);
  }
}

console.log(`\nMarket Intelligence Adapter verification: ${passed}/${tests.length} passed`);

if (failures.length) {
  process.exitCode = 1;
}
