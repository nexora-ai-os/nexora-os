import { readFileSync } from "node:fs";
import statusHandler from "../api/status.js";
import { apiGroups, buildClientApiReadiness } from "../src/services/apiRegistry.js";
import { buildIntegrationCapabilityRegistry } from "../src/data/integrationCapabilityRegistry.js";
import {
  buildCredentialBoundaryReport,
  sanitizeCredentialError,
  validateCredentialFreePayload,
  validateCredentialFreeUrl,
} from "../src/services/credentialSecurityBoundary.js";
import { buildProductionReadiness } from "../src/services/productionReadinessService.js";

const tests = [];
const add = (name, run) => tests.push([name, run]);
const assert = (label, condition) => {
  if (!condition) throw new Error(label);
};
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const keyName = ["OPENAI", "API", "KEY"].join("_");
const secretName = ["CLIENT", "SECRET"].join("_");
const forbiddenSourceTerms = [keyName, secretName, "envKeys", "provider.configured", "設定済み・未検証"];

async function callStatusHandler() {
  let statusCode = 0;
  let payload = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(value) {
      payload = value;
      return this;
    },
  };
  await statusHandler({ method: "GET" }, res);
  return { statusCode, payload };
}

add("Reachable API registry has no environment key names", () => {
  const source = read("../src/services/apiRegistry.js");
  assert("no key name", !source.includes(keyName));
  assert("no secret name", !source.includes(secretName));
  assert("no env field", !source.includes("envKeys"));
});

add("API registry ViewModel has no credential fields", () => {
  const text = JSON.stringify(apiGroups);
  assert("no key name", !text.includes(keyName));
  assert("no secret name", !text.includes(secretName));
  assert("no env field", !text.includes("envKeys"));
  assert("server-only policy only", text.includes("server-only"));
});

add("API readiness does not infer configured state", () => {
  const readiness = buildClientApiReadiness([{ id: "sample", status: "mock-only" }]);
  assert("ready zero", readiness.ready === 0);
  assert("score zero", readiness.score === 0);
});

add("API Control Center source has no rendered credential names", () => {
  const source = read("../src/components/APIControlCenter.jsx");
  for (const term of forbiddenSourceTerms) assert(`no ${term}`, !source.includes(term));
  assert("safe wording", source.includes("Credential：server-only / 値と名前は非表示"));
});

add("Shared status labels do not expose configured state", () => {
  const source = read("../src/components/shared/UIComponents.jsx");
  assert("no configured display", !source.includes("設定済み"));
  assert("safe label", source.includes('"configured-unverified": "未検証"'));
});

add("Operator overview does not count configured integrations", () => {
  const source = read("../src/components/OperatorOverview.jsx");
  assert("no configured count", !source.includes("configuredCount"));
  assert("no configured display", !source.includes("設定済み"));
});

add("Initial platform data has no configured provider state", () => {
  const source = read("../src/data/platformOS.js");
  assert("no configured status", !source.includes("configured-unverified"));
});

add("Production Readiness UI has no environment key names", () => {
  const source = read("../src/components/ProductionReadiness.jsx");
  assert("no key name", !source.includes(keyName));
  assert("no secret name", !source.includes(secretName));
});

add("Production readiness ViewModel keeps Credential state not exposed", () => {
  const readiness = buildProductionReadiness("2026-07-16T00:00:00.000Z");
  const text = JSON.stringify(readiness);
  assert("not exposed only", text.includes('"credentialConfigured":"notExposed"'));
  assert("no key name", !text.includes(keyName));
  assert("no secret name", !text.includes(secretName));
});

add("Integration registry allows provider names but not credential names", () => {
  const registry = buildIntegrationCapabilityRegistry();
  const text = JSON.stringify(registry);
  assert("provider name allowed", text.includes("OpenAI"));
  assert("no key name", !text.includes(keyName));
  assert("no secret name", !text.includes(secretName));
});

add("Status API returns no environment key names", async () => {
  const { statusCode, payload } = await callStatusHandler();
  const text = JSON.stringify(payload);
  assert("ok", statusCode === 200);
  assert("no key name", !text.includes(keyName));
  assert("no secret name", !text.includes(secretName));
  assert("no env field", !text.includes("envKeys"));
});

add("Status API returns no configured state", async () => {
  const { payload } = await callStatusHandler();
  const text = JSON.stringify(payload);
  assert("no configured", !text.includes("configured"));
});

add("Credential sanitizer removes long credential-like values", () => {
  const sanitized = sanitizeCredentialError("credential leak abcdefghijklmnopqrstuvwxyz123456");
  assert("redacted", sanitized.includes("[credential-redacted]"));
  assert("no original", !sanitized.includes("abcdefghijklmnopqrstuvwxyz123456"));
});

add("Nested credential payload is rejected", () => {
  assert("blocked", !validateCredentialFreePayload({ outer: { apiKey: "dummy-value" } }).ok);
});

add("Array credential payload is rejected", () => {
  assert("blocked", !validateCredentialFreePayload([{ token: "dummy-value" }]).ok);
});

add("URL query credential is rejected", () => {
  assert("blocked", !validateCredentialFreeUrl("https://example.invalid/path?token=dummy-value").ok);
});

add("LocalStorage-style credential payload is rejected", () => {
  assert("blocked", !validateCredentialFreePayload({ localStorage: { refreshToken: "dummy-value" } }).ok);
});

add("API response credential is rejected by boundary report", () => {
  assert("blocked", buildCredentialBoundaryReport({ apiResponse: { secret: "dummy-value" } }).status === "blocked");
});

add("Credential-free provider metadata passes", () => {
  assert("ok", validateCredentialFreePayload({ provider: "OpenAI", status: "mock" }).ok);
});

add("Production Gateway remains locked", () => {
  const readiness = buildProductionReadiness("2026-07-16T00:00:00.000Z");
  assert("locked", readiness.gateway.status === "locked");
  assert("no production", readiness.gateway.productionExecutionEnabled === false);
  assert("no external", readiness.gateway.externalExecutionEnabled === false);
});

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

console.log(`\nCredential Exposure verification: ${passed}/${tests.length} passed`);
if (failures.length) process.exitCode = 1;
