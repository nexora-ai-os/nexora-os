export function createSupabaseUsageStoreAdapter(client, ownerId) {
  const locked = () => Promise.reject(Object.assign(new Error("Usage store unavailable"), { reasonCode: "SERVER_USAGE_STORE_REQUIRED" }));
  if (!client || !ownerId) return { persistent: false, getMonthlyUsage: locked, reserveRequestBudget: locked, commitUsage: locked, releaseReservation: locked, findCachedGeneration: locked, saveCachedGeneration: locked };
  return { persistent: true, ownerId, async getMonthlyUsage(monthKey) { return client.from("sandbox_usage_monthly").select("*").eq("owner_id", ownerId).eq("month_key", monthKey).maybeSingle(); }, async reserveRequestBudget(input) { return client.rpc("reserve_sandbox_request", { p_owner_id: ownerId, p_idempotency_key: input.idempotencyKey, p_estimated_cost_usd: input.estimatedCostUsd }); }, async commitUsage(input) { return client.rpc("commit_sandbox_usage", { p_owner_id: ownerId, p_reservation_id: input.reservationId, p_actual_cost_usd: input.actualCostUsd }); }, async releaseReservation(reservationId) { return client.rpc("release_sandbox_reservation", { p_owner_id: ownerId, p_reservation_id: reservationId }); }, async findCachedGeneration(cacheKey) { return client.from("sandbox_generation_cache").select("result_payload").eq("owner_id", ownerId).eq("cache_key", cacheKey).maybeSingle(); }, async saveCachedGeneration(cacheKey, result) { return client.from("sandbox_generation_cache").upsert({ cache_key: cacheKey, owner_id: ownerId, result_payload: result }); } };
}
export function requireVerifiedOwnerContext(context) {
  if (!context || typeof context.ownerId !== "string" || context.ownerIdentityVerified !== true || context.sessionVerified !== true || context.csrfVerified !== true) throw Object.assign(new Error("Verified owner context required"), { reasonCode: "OWNER_AUTH_CONTEXT_REQUIRED" });
  return Object.freeze({ ownerId: context.ownerId });
}
export function createVerifiedSupabaseUsageStoreAdapter(client, context) {
  const verified = requireVerifiedOwnerContext(context);
  return createSupabaseUsageStoreAdapter(client, verified.ownerId);
}
