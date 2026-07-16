import fs from "node:fs/promises";
import { buildReleaseReadinessAudit, summarizeAudit } from "../src/services/releaseReadinessAudit.js";

const EVALUATION_TIME = "2026-07-16T00:00:00.000Z";

function assert(name, condition, details = "") {
  if (!condition) throw new Error(`${name}${details ? `: ${details}` : ""}`);
}

async function readSource(relativePath) {
  return fs.readFile(new URL(relativePath, import.meta.url), "utf8");
}

function audit(overrides = {}) {
  return buildReleaseReadinessAudit({ evaluationTime: EVALUATION_TIME, budget: { mockLimit: 5, mockUsed: 0 }, ...overrides });
}

const tests = [
  ["Audit requires explicit evaluationTime", () => {
    assert("blocked", !buildReleaseReadinessAudit({}).ok);
  }],
  ["Audit builds", () => {
    assert("ok", audit().ok);
  }],
  ["Audit ID is deterministic", () => {
    assert("same", audit().auditId === audit().auditId);
  }],
  ["Audit overall status is productionBlocked", () => {
    assert("blocked", audit().overallStatus === "productionBlocked");
  }],
  ["Mock loop ready is true", () => {
    assert("mock", audit().mockBusinessLoopReady === true);
  }],
  ["Production Gateway is locked", () => {
    assert("locked", audit().productionGatewayStatus === "locked");
  }],
  ["Audit has required categories", () => {
    const categories = audit().checks.map((item) => item.category);
    for (const category of ["Git / Build", "Verification", "Mock Business Flow", "Credential Boundary", "Integration Registry", "API Safety", "Production Gateway", "Emergency Stop", "Budget Guard", "Actual Revenue", "Ledger", "External Publishing", "Observability", "Privacy", "Incident Response", "Rollback"]) {
      assert(category, categories.includes(category));
    }
  }],
  ["Unverified checks are not marked pass", () => {
    const items = audit().checks.filter((item) => ["Git / Build", "Verification", "API Safety", "Observability", "Privacy", "Incident Response", "Rollback"].includes(item.category));
    assert("not pass", items.every((item) => item.status !== "pass"));
  }],
  ["Blocked checks remain blocked", () => {
    assert("blocked", audit().checks.some((item) => item.status === "blocked"));
  }],
  ["Blocking reasons exist", () => {
    assert("reasons", audit().blockingReasons.length > 0);
  }],
  ["One Next Action is exactly one string", () => {
    assert("action", typeof audit().ownerNextAction === "string" && !Array.isArray(audit().ownerNextAction));
  }],
  ["Audit has no credential information", () => {
    const text = JSON.stringify(audit());
    assert("safe", !text.includes("_API_KEY") && !text.includes("clientSecret") && !text.includes("accessToken"));
  }],
  ["Audit production execution false", () => {
    assert("false", audit().productionExecution === false);
  }],
  ["Audit external execution false", () => {
    assert("false", audit().externalExecution === false);
  }],
  ["Summary counts checks", () => {
    const summary = summarizeAudit(audit());
    assert("counts", summary.pass + summary.blocked + summary.notVerified === audit().checks.length);
  }],
  ["Mock business flow check passes", () => {
    const item = audit().checks.find((check) => check.category === "Mock Business Flow");
    assert("pass", item.status === "pass");
  }],
  ["Actual Revenue remains blocked", () => {
    const item = audit().checks.find((check) => check.category === "Actual Revenue");
    assert("blocked", item.status === "blocked");
  }],
  ["Ledger remains blocked", () => {
    const item = audit().checks.find((check) => check.category === "Ledger");
    assert("blocked", item.status === "blocked");
  }],
  ["External Publishing remains blocked", () => {
    const item = audit().checks.find((check) => check.category === "External Publishing");
    assert("blocked", item.status === "blocked");
  }],
  ["Audit source has no external communication", async () => {
    const source = await readSource("../src/services/releaseReadinessAudit.js");
    assert("no external", !source.includes("fetch(") && !source.includes("axios") && !source.includes("WebSocket"));
  }],
  ["Audit source has no implicit current time", async () => {
    const source = await readSource("../src/services/releaseReadinessAudit.js");
    assert("no time", !source.includes("Date.now") && !source.includes("new Date("));
  }],
  ["Audit source does not read env", async () => {
    const source = await readSource("../src/services/releaseReadinessAudit.js");
    assert("no env", !source.includes(".env.local") && !source.includes("process.env"));
  }],
  ["Settings route imports ProductionReadiness", async () => {
    const source = await readSource("../src/components/Settings.jsx");
    assert("import", source.includes("ProductionReadiness"));
  }],
  ["App passes budget to Settings", async () => {
    const source = await readSource("../src/App.jsx");
    assert("budget", source.includes("budget={budget}"));
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

console.log(`\nRelease Readiness verification: ${passed}/${tests.length} passed`);
if (failures.length) process.exitCode = 1;
