import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveVerifiedOwnerContext } from "../server/verifiedOwnerContext.js";
import { createSupabaseUsageStoreAdapter } from "../server/supabaseUsageStoreAdapter.js";
import { createLocalDevServer } from "../server/localDevServer.js";

let passed = 0;
const check = async (name, fn) => { await fn(); passed += 1; console.log(`PASS ${name}`); };
const allowedOrigin = "http://127.0.0.1:5173";
function request(headers = {}, body = {}) { return { method: "POST", headers: { "content-type": "application/json", origin: allowedOrigin, ...headers }, body }; }
function client({ userId = "owner-real", role = "owner", status = "active", sessionError = false, profileError = false } = {}) {
  return {
    auth: { getUser: async () => sessionError ? { data: {}, error: true } : { data: { user: { id: userId } }, error: null } },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => profileError ? { error: { message: "private db error" } } : { data: { role, status }, error: null } }) }) }),
  };
}

await check("authorization absent rejected", async () => assert.equal((await resolveVerifiedOwnerContext(request(), { client: client(), allowedOrigin })).reasonCode, "OWNER_SESSION_INVALID"));
await check("malformed bearer rejected", async () => assert.equal((await resolveVerifiedOwnerContext(request({ authorization: "Token value" }), { client: client(), allowedOrigin })).reasonCode, "OWNER_SESSION_INVALID"));
await check("origin mismatch rejected", async () => assert.equal((await resolveVerifiedOwnerContext(request({ authorization: "Bearer token", origin: "http://localhost:5173" }), { client: client(), allowedOrigin })).reasonCode, "REQUEST_ORIGIN_NOT_ALLOWED"));
await check("invalid session rejected", async () => assert.equal((await resolveVerifiedOwnerContext(request({ authorization: "Bearer token" }), { client: client({ sessionError: true }), allowedOrigin })).reasonCode, "OWNER_SESSION_INVALID"));
await check("inactive owner rejected", async () => assert.equal((await resolveVerifiedOwnerContext(request({ authorization: "Bearer token" }), { client: client({ status: "disabled" }), allowedOrigin })).reasonCode, "OWNER_PROFILE_NOT_ACTIVE"));
await check("client owner forgery is ignored", async () => { const result = await resolveVerifiedOwnerContext(request({ authorization: "Bearer token" }, { ownerId: "forged", ownerAuthenticated: true }), { client: client({ userId: "owner-real" }), allowedOrigin }); assert.equal(result.context.ownerId, "owner-real"); });

const rpcCalls = [];
const usageClient = { rpc: async (name, args) => { rpcCalls.push({ name, args }); if (name === "reserve_sandbox_request") return { data: { reservationId: "reservation-1" }, error: null }; return { data: true, error: null }; } };
const store = createSupabaseUsageStoreAdapter(usageClient, "owner-real");
const reservation = await store.reserveRequestBudget({ idempotencyKey: "request:attempt:1", estimatedCostUsd: 0.01 });
await check("reservation is structured and retains id", () => assert.deepEqual(reservation, { reserved: true, reservationId: "reservation-1", estimatedCostUsd: 0.01, idempotencyKey: "request:attempt:1" }));
await store.commitUsage({ reservationId: reservation.reservationId, actualCostUsd: 0.009 });
await check("reservation commits by id", () => assert.equal(rpcCalls[1].args.p_reservation_id, "reservation-1"));

const gatewaySource = readFileSync(new URL("../src/services/openAISandboxGateway.js", import.meta.url), "utf8");
const authGateSource = readFileSync(new URL("../src/components/SupabaseOwnerAuthGate.jsx", import.meta.url), "utf8");
const workspaceSource = readFileSync(new URL("../src/components/OwnerReviewWorkspace.jsx", import.meta.url), "utf8");
const apiSource = readFileSync(new URL("../api/ai.js", import.meta.url), "utf8");
const combinedClient = `${gatewaySource}\n${authGateSource}\n${workspaceSource}`;
await check("gateway is only called from explicit click handler", () => { assert.ok(workspaceSource.includes("onClick={handleOpenAISandbox}")); assert.equal(/useEffect\([\s\S]{0,800}executeOpenAISandboxGateway/.test(workspaceSource), false); });
await check("token is not copied to body query storage or console", () => { assert.ok(gatewaySource.includes("headers: { authorization:")); assert.equal(gatewaySource.includes("accessToken }") || gatewaySource.includes("accessToken:"), false); assert.equal(/localStorage|sessionStorage|console\./.test(`${gatewaySource}\n${authGateSource}`), false); });
await check("server secret identifiers absent from client boundary", () => { for (const secret of ["SUPABASE_SECRET_KEY", "OPENAI_API_KEY"]) assert.equal(combinedClient.includes(secret), false); });
await check("server keeps getUser and owner profile verification", () => { assert.ok(apiSource.includes("resolveVerifiedOwnerContext")); assert.ok(readFileSync(new URL("../server/verifiedOwnerContext.js", import.meta.url), "utf8").includes("auth.getUser")); });
await check("production boundaries remain false", () => { for (const boundary of ["productionExecution: false", "publishEnabled: false", "actualRevenueConnected: false", "ledgerAppend: false"]) assert.ok(gatewaySource.includes(boundary)); });

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
await check("local full runtime uses Node harness without Vercel", () => { assert.equal(packageJson.scripts["dev:full"], "node server/localDevServer.js"); assert.equal(packageJson.devDependencies?.vercel, undefined); });
let viteClosed = false;
const mockVite = { middlewares: (_req, res) => { res.writeHead(200, { "content-type": "text/html" }); res.end("<main>KEVIRIO</main>"); }, close: async () => { viteClosed = true; } };
const localRuntime = await createLocalDevServer({ host: "127.0.0.1", port: 0, vite: mockVite, aiHandler: async () => { throw new Error("API handler must not run during root verification"); } });
const localUrl = await localRuntime.listen(); const rootResponse = await fetch(`${localUrl}/`); const rootText = await rootResponse.text(); await localRuntime.close();
await check("local runtime root is served without API dispatch", () => assert.equal(rootResponse.status === 200 && rootText.includes("KEVIRIO") && viteClosed, true));

const migration = readFileSync(new URL("../supabase/migrations/002_reusable_sandbox_reservations.sql", import.meta.url), "utf8");
await check("migration 002 replaces only reservation function", () => { assert.ok(migration.includes("create or replace function public.reserve_sandbox_request")); assert.equal(/drop\s+table|delete\s+from|truncate/i.test(migration), false); });
await check("released and expired rows are reusable but active duplicates block", () => { assert.ok(migration.includes("v_existing.status in ('reserved', 'committed')")); assert.ok(migration.includes("set estimated_cost_usd = p_estimated_cost_usd, status = 'reserved'")); });
await check("migration preserves limits locks and reconciliation", () => { assert.ok(migration.includes("p_estimated_cost_usd > 0.03")); assert.ok(migration.includes("> 1.00")); assert.ok((migration.match(/for update/g) || []).length >= 2); assert.ok(migration.includes("v_reconciled_reserved := greatest(0")); });
await check("migration security is fail closed and idempotent", () => { assert.ok(migration.includes("security definer") && migration.includes("set search_path = ''")); for (const role of ["public", "anon", "authenticated"]) assert.ok(migration.includes(`from ${role}`)); assert.ok(migration.includes("to service_role")); assert.equal(/\bexecute\s+format\s*\(/i.test(migration), false); assert.ok(/^begin;/.test(migration.trim()) && /commit;\s*$/.test(migration.trim())); });
await check("migration contains no revenue or ledger fields", () => assert.equal(/actual.?revenue|ledger/i.test(migration), false));
console.log(`Authenticated sandbox transaction verification: ${passed}/20 passed`);
