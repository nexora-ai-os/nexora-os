import fs from "node:fs/promises";
import {
  buildCredentialBoundaryReport,
  credentialKeyNamesForPolicyOnly,
  sanitizeCredentialError,
  validateCredentialFreePayload,
  validateCredentialFreeUrl,
} from "../src/services/credentialSecurityBoundary.js";

function assert(name, condition, details = "") {
  if (!condition) throw new Error(`${name}${details ? `: ${details}` : ""}`);
}

async function readSource(relativePath) {
  return fs.readFile(new URL(relativePath, import.meta.url), "utf8");
}

const tests = [
  ["Policy includes credential key names for validators only", () => {
    const keys = credentialKeyNamesForPolicyOnly();
    assert("keys", keys.includes("apiKey") && keys.includes("token") && keys.includes("clientSecret"));
  }],
  ["Plain client payload passes", () => {
    assert("pass", validateCredentialFreePayload({ mode: "mock", provider: "OpenAI" }).ok);
  }],
  ["apiKey field is rejected", () => {
    assert("blocked", !validateCredentialFreePayload({ apiKey: "value" }).ok);
  }],
  ["api_key field is rejected", () => {
    assert("blocked", !validateCredentialFreePayload({ api_key: "value" }).ok);
  }],
  ["token field is rejected", () => {
    assert("blocked", !validateCredentialFreePayload({ token: "value" }).ok);
  }],
  ["nested secret is rejected", () => {
    assert("blocked", !validateCredentialFreePayload({ nested: { secret: "value" } }).ok);
  }],
  ["array credential is rejected", () => {
    assert("blocked", !validateCredentialFreePayload([{ accessToken: "value" }]).ok);
  }],
  ["authorization field is rejected", () => {
    assert("blocked", !validateCredentialFreePayload({ headers: { authorization: "Bearer value" } }).ok);
  }],
  ["bearer field is rejected", () => {
    assert("blocked", !validateCredentialFreePayload({ bearer: "value" }).ok);
  }],
  ["password field is rejected", () => {
    assert("blocked", !validateCredentialFreePayload({ password: "value" }).ok);
  }],
  ["credential field is rejected", () => {
    assert("blocked", !validateCredentialFreePayload({ credential: "value" }).ok);
  }],
  ["URL query credential is rejected", () => {
    assert("blocked", !validateCredentialFreeUrl("https://example.test/callback?token=value").ok);
  }],
  ["URL userinfo is rejected", () => {
    assert("blocked", !validateCredentialFreeUrl("https://user:pass@example.test").ok);
  }],
  ["URL without credential query passes", () => {
    assert("pass", validateCredentialFreeUrl("https://example.test/callback?state=mock").ok);
  }],
  ["LocalStorage payload credential is rejected", () => {
    assert("blocked", !validateCredentialFreePayload({ localStorage: { refreshToken: "value" } }).ok);
  }],
  ["API response credential is rejected by report", () => {
    assert("blocked", buildCredentialBoundaryReport({ apiResponse: { clientSecret: "value" } }).status === "blocked");
  }],
  ["Storage credential is rejected by report", () => {
    assert("blocked", buildCredentialBoundaryReport({ storagePayload: { credential: "value" } }).status === "blocked");
  }],
  ["Error value is redacted", () => {
    const sanitized = sanitizeCredentialError("secret sk-1234567890abcdefghijklmnop leaked");
    assert("redacted", sanitized.includes("[credential-redacted]") && !sanitized.includes("abcdefghijklmnop"));
  }],
  ["Error key name is generalized", () => {
    assert("safe", sanitizeCredentialError("apiKey failed").includes("credential"));
  }],
  ["Circular input fails closed", () => {
    const value = {};
    value.self = value;
    assert("blocked", !validateCredentialFreePayload(value).ok);
  }],
  ["Credential report passes safe sample", () => {
    const report = buildCredentialBoundaryReport({ clientPayload: { operatingMode: "mock" }, storagePayload: {}, apiResponse: {} });
    assert("pass", report.status === "pass");
  }],
  ["Credential report never accepts client credential", () => {
    assert("false", buildCredentialBoundaryReport().clientCredentialAccepted === false);
  }],
  ["Credential report never accepts storage credential", () => {
    assert("false", buildCredentialBoundaryReport().storageCredentialAccepted === false);
  }],
  ["Credential report never accepts API response credential", () => {
    assert("false", buildCredentialBoundaryReport().apiResponseCredentialAccepted === false);
  }],
  ["Credential service has no localStorage access", async () => {
    const source = await readSource("../src/services/credentialSecurityBoundary.js");
    assert("no localStorage", !source.includes("localStorage."));
  }],
  ["Credential service has no external communication", async () => {
    const source = await readSource("../src/services/credentialSecurityBoundary.js");
    assert("no external", !source.includes("fetch(") && !source.includes("axios") && !source.includes("WebSocket"));
  }],
  ["Credential service does not read env files", async () => {
    const source = await readSource("../src/services/credentialSecurityBoundary.js");
    assert("no env", !source.includes(".env.local") && !source.includes("process.env"));
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

console.log(`\nCredential Boundary verification: ${passed}/${tests.length} passed`);
if (failures.length) process.exitCode = 1;
