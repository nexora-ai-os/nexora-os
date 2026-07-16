import fs from "node:fs/promises";
import {
  INTEGRATION_CAPABILITIES,
  buildIntegrationCapabilityRegistry,
  validateIntegrationCapability,
} from "../src/data/integrationCapabilityRegistry.js";
import {
  buildProductionGateway,
  buildProductionReadiness,
  validateProductionGateway,
} from "../src/services/productionReadinessService.js";

const EVALUATION_TIME = "2026-07-16T00:00:00.000Z";

function assert(name, condition, details = "") {
  if (!condition) throw new Error(`${name}${details ? `: ${details}` : ""}`);
}

async function readSource(relativePath) {
  return fs.readFile(new URL(relativePath, import.meta.url), "utf8");
}

function gateway(overrides = {}) {
  return buildProductionGateway({ evaluationTime: EVALUATION_TIME, budget: { mockLimit: 5, mockUsed: 0 }, ...overrides });
}

const tests = [
  ["Registry builds successfully", () => {
    assert("ready", buildIntegrationCapabilityRegistry().ok);
  }],
  ["Registry has minimum providers", () => {
    assert("count", buildIntegrationCapabilityRegistry().totalProviders >= 13);
  }],
  ["Every Integration has ID", () => {
    assert("ids", buildIntegrationCapabilityRegistry().integrations.every((item) => item.integrationId));
  }],
  ["Duplicate Integration ID is rejected", () => {
    const duplicate = [INTEGRATION_CAPABILITIES[0], { ...INTEGRATION_CAPABILITIES[0] }];
    assert("blocked", !buildIntegrationCapabilityRegistry(duplicate).ok);
  }],
  ["Unknown Integration capability is rejected", () => {
    assert("invalid", !validateIntegrationCapability({ ...INTEGRATION_CAPABILITIES[0], capability: "unknown" }).valid);
  }],
  ["Unknown Integration status is rejected", () => {
    assert("invalid", !validateIntegrationCapability({ ...INTEGRATION_CAPABILITIES[0], implementationStatus: "connected" }).valid);
  }],
  ["Registry operatingMode is mock", () => {
    assert("mock", buildIntegrationCapabilityRegistry().integrations.every((item) => item.operatingMode === "mock"));
  }],
  ["Registry external execution is false", () => {
    assert("false", buildIntegrationCapabilityRegistry().integrations.every((item) => item.externalExecution === false));
  }],
  ["Registry Production execution is false", () => {
    assert("false", buildIntegrationCapabilityRegistry().integrations.every((item) => item.productionExecution === false));
  }],
  ["Registry credential location is serverOnly", () => {
    assert("serverOnly", buildIntegrationCapabilityRegistry().integrations.every((item) => item.credentialLocation === "serverOnly"));
  }],
  ["Registry credential configured state is not exposed", () => {
    assert("not exposed", buildIntegrationCapabilityRegistry().integrations.every((item) => item.credentialConfigured === "notExposed"));
  }],
  ["Registry does not expose credential names", () => {
    const text = JSON.stringify(buildIntegrationCapabilityRegistry());
    assert("no key names", !text.includes("_API_KEY") && !text.includes("CLIENT_SECRET"));
  }],
  ["Registry input is not mutated", () => {
    const source = JSON.stringify(INTEGRATION_CAPABILITIES);
    buildIntegrationCapabilityRegistry(INTEGRATION_CAPABILITIES);
    assert("same", JSON.stringify(INTEGRATION_CAPABILITIES) === source);
  }],
  ["Gateway default is locked", () => {
    assert("locked", gateway().gateway.status === "locked");
  }],
  ["Gateway validates", () => {
    assert("valid", validateProductionGateway(gateway().gateway).valid);
  }],
  ["Gateway rejects enabled status", () => {
    assert("blocked", !buildProductionGateway({ evaluationTime: EVALUATION_TIME, status: "enabled" }).ok);
  }],
  ["Gateway rejects live status", () => {
    assert("blocked", !buildProductionGateway({ evaluationTime: EVALUATION_TIME, status: "live" }).ok);
  }],
  ["Gateway requires explicit evaluationTime", () => {
    assert("blocked", !buildProductionGateway({}).ok);
  }],
  ["Gateway is deterministic", () => {
    assert("same", gateway().gateway.gatewayId === gateway().gateway.gatewayId);
  }],
  ["Gateway production request remains blocked", () => {
    assert("false", gateway().gateway.productionExecutionEnabled === false);
  }],
  ["Gateway external request remains blocked", () => {
    assert("false", gateway().gateway.externalExecutionEnabled === false);
  }],
  ["Owner approval alone does not unlock", () => {
    assert("locked", gateway({ ownerProductionApproval: true }).gateway.status === "locked");
  }],
  ["All mock conditions true still do not unlock", () => {
    assert("locked", gateway({ securityReviewPassed: true, integrationVerified: true, rollbackVerified: true, observabilityVerified: true }).gateway.status === "locked");
  }],
  ["Gateway has blocking reasons", () => {
    assert("reasons", gateway().gateway.blockingReasons.length > 0);
  }],
  ["Gateway Actual Revenue false", () => {
    assert("false", gateway().gateway.actualRevenueConnected === false);
  }],
  ["Gateway Ledger false", () => {
    assert("false", gateway().gateway.ledgerAppendEnabled === false);
  }],
  ["Emergency Stop active is reflected", () => {
    assert("active", gateway({ emergencyStopActive: true }).gateway.emergencyStopActive === true);
  }],
  ["Emergency Stop blocks action", () => {
    assert("blocked", gateway({ emergencyStopActive: true }).emergencyStopGuard.blocked === true);
  }],
  ["Budget undefined is blocked", () => {
    assert("blocked", gateway({ budget: undefined }).mockBudget.status === "blocked");
  }],
  ["Budget over limit is blocked", () => {
    assert("blocked", gateway({ budget: { mockLimit: 5, mockUsed: 5 } }).mockBudget.status === "blocked");
  }],
  ["Budget warning is warning", () => {
    assert("warning", gateway({ budget: { mockLimit: 5, mockUsed: 4.2 } }).mockBudget.status === "warning");
  }],
  ["Budget negative is rejected", () => {
    assert("blocked", gateway({ budget: { mockLimit: 5, mockUsed: -1 } }).mockBudget.status === "blocked");
  }],
  ["Budget NaN is rejected", () => {
    assert("blocked", gateway({ budget: { mockLimit: 5, mockUsed: Number.NaN } }).mockBudget.status === "blocked");
  }],
  ["Budget Infinity is rejected", () => {
    assert("blocked", gateway({ budget: { mockLimit: Number.POSITIVE_INFINITY, mockUsed: 1 } }).mockBudget.status === "blocked");
  }],
  ["Budget real charge disabled", () => {
    assert("false", gateway().mockBudget.realChargeEnabled === false);
  }],
  ["Budget external spend disabled", () => {
    assert("false", gateway().mockBudget.externalSpendEnabled === false);
  }],
  ["Readiness has one next action", () => {
    assert("action", typeof buildProductionReadiness(EVALUATION_TIME, { mockLimit: 5, mockUsed: 0 }).ownerNextAction === "string");
  }],
  ["Production readiness services have no Math.random", async () => {
    const source = await readSource("../src/services/productionReadinessService.js");
    assert("no random", !source.includes("Math.random"));
  }],
  ["Production readiness services have no implicit Date", async () => {
    const source = await readSource("../src/services/productionReadinessService.js");
    assert("no implicit date", !source.includes("Date.now") && !source.includes("new Date("));
  }],
  ["Production readiness services have no external communication", async () => {
    const source = await readSource("../src/services/productionReadinessService.js");
    assert("no external", !source.includes("fetch(") && !source.includes("axios") && !source.includes("WebSocket"));
  }],
  ["Production readiness services do not read env", async () => {
    const source = await readSource("../src/services/productionReadinessService.js");
    assert("no env", !source.includes(".env.local") && !source.includes("process.env"));
  }],
  ["Production readiness UI has locked wording", async () => {
    const source = await readSource("../src/components/ProductionReadiness.jsx");
    assert("locked", source.includes("ロック中") && source.includes("Production Gateway"));
  }],
  ["Production readiness UI does not expose API key names", async () => {
    const source = await readSource("../src/components/ProductionReadiness.jsx");
    assert("no key", !source.includes("API_KEY") && !source.includes("SECRET"));
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

console.log(`\nProduction Readiness verification: ${passed}/${tests.length} passed`);
if (failures.length) process.exitCode = 1;
