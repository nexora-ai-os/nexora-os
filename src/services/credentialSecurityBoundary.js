const FORBIDDEN_CREDENTIAL_KEYS = [
  "apiKey",
  "api_key",
  "secret",
  "token",
  "accessToken",
  "refreshToken",
  "clientSecret",
  "authorization",
  "bearer",
  "password",
  "credential",
];

const CREDENTIAL_KEY_PATTERN = new RegExp(FORBIDDEN_CREDENTIAL_KEYS.join("|"), "i");
const REDACTED = "[credential-redacted]";

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function createViolation(code, field, message) {
  return { code, field, message };
}

function scanValue(value, path, seen, violations) {
  if (value === null || value === undefined) return;
  if (typeof value === "string") {
    if (/^(https?:)?\/\//i.test(value)) {
      const urlValidation = validateCredentialFreeUrl(value, path);
      violations.push(...urlValidation.errors);
    }
    return;
  }
  if (typeof value !== "object") return;
  if (seen.has(value)) {
    violations.push(createViolation("CIRCULAR_INPUT", path, "Circular input is not allowed."));
    return;
  }
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanValue(item, `${path}[${index}]`, seen, violations));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    const childPath = path ? `${path}.${key}` : key;
    if (CREDENTIAL_KEY_PATTERN.test(key)) {
      violations.push(createViolation("CREDENTIAL_FIELD_FORBIDDEN", childPath, "Credential-like fields are not allowed in client payloads."));
    }
    scanValue(child, childPath, seen, violations);
  }
}

export function validateCredentialFreePayload(payload, rootName = "payload") {
  const violations = [];
  try {
    scanValue(payload, rootName, new WeakSet(), violations);
  } catch {
    violations.push(createViolation("CREDENTIAL_SCAN_FAILED", rootName, "Credential scan failed closed."));
  }
  return { ok: violations.length === 0, status: violations.length ? "blocked" : "pass", errors: violations };
}

export function validateCredentialFreeUrl(value, field = "url") {
  const errors = [];
  try {
    const url = new URL(value, "https://kevirio.local");
    for (const key of url.searchParams.keys()) {
      if (CREDENTIAL_KEY_PATTERN.test(key)) {
        errors.push(createViolation("URL_CREDENTIAL_QUERY_FORBIDDEN", `${field}.${key}`, "Credential-like URL query parameter is not allowed."));
      }
    }
    if (url.username || url.password) {
      errors.push(createViolation("URL_USERINFO_FORBIDDEN", field, "URL userinfo credentials are not allowed."));
    }
  } catch {
    errors.push(createViolation("URL_INVALID", field, "URL validation failed closed."));
  }
  return { ok: errors.length === 0, status: errors.length ? "blocked" : "pass", errors };
}

export function sanitizeCredentialError(errorLike) {
  const raw = typeof errorLike === "string" ? errorLike : errorLike?.message || "Credential boundary blocked unsafe error.";
  return raw.replace(/[A-Za-z0-9_\-]{16,}/g, REDACTED).replace(CREDENTIAL_KEY_PATTERN, "credential");
}

export function buildCredentialBoundaryReport(samples = {}) {
  const payloadValidation = validateCredentialFreePayload(samples.clientPayload || {});
  const storageValidation = validateCredentialFreePayload(samples.storagePayload || {});
  const responseValidation = validateCredentialFreePayload(samples.apiResponse || {});
  const errorMessage = sanitizeCredentialError(samples.errorMessage || "No credential value inspected.");
  const pass = payloadValidation.ok && storageValidation.ok && responseValidation.ok;
  return {
    schemaVersion: "2.0.0",
    operatingMode: "mock",
    status: pass ? "pass" : "blocked",
    clientCredentialAccepted: false,
    storageCredentialAccepted: false,
    errorLeaksCredential: false,
    apiResponseCredentialAccepted: false,
    sanitizedErrorMessage: errorMessage,
    errors: [...payloadValidation.errors, ...storageValidation.errors, ...responseValidation.errors],
  };
}

export function credentialKeyNamesForPolicyOnly() {
  return [...FORBIDDEN_CREDENTIAL_KEYS];
}
