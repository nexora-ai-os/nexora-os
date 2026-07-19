function normalizedError(reasonCode) { return Object.assign(new Error(reasonCode), { reasonCode }); }

export function createSupabaseUsageStoreAdapter(client, ownerId) {
  const locked = () => Promise.reject(normalizedError("SERVER_USAGE_STORE_REQUIRED"));
  if (!client || !ownerId) return { persistent: false, getMonthlyUsage: locked, getMonthlySpendUsd: locked, reserveRequestBudget: locked, claimIdempotencyKey: locked, commitUsage: locked, releaseReservation: locked, findCachedGeneration: locked, getCachedResult: locked, saveCachedGeneration: locked, saveCachedResult: locked };
  return {
    persistent: true,
    ownerId,
    async getMonthlyUsage(monthKey) {
      const result = await client.from("sandbox_usage_monthly").select("*").eq("owner_id", ownerId).eq("month_key", monthKey).maybeSingle();
      if (result?.error) throw normalizedError("SERVER_USAGE_STORE_REQUIRED");
      return result;
    },
    async getMonthlySpendUsd() {
      const result = await this.getMonthlyUsage(new Date().toISOString().slice(0, 7));
      return Number(result?.data?.estimated_cost_usd || 0) + Number(result?.data?.reserved_cost_usd || 0);
    },
    async reserveRequestBudget(input) {
      const result = await client.rpc("reserve_sandbox_request", { p_owner_id: ownerId, p_idempotency_key: input.idempotencyKey, p_estimated_cost_usd: input.estimatedCostUsd });
      if (result?.error) {
        const duplicate = String(result.error?.message || "").includes("duplicate_request");
        throw normalizedError(duplicate ? "SANDBOX_REQUEST_ALREADY_CLAIMED" : "USAGE_RESERVATION_FAILED");
      }
      const reservationId = result?.data?.reservationId || result?.data?.reservation_id;
      if (!reservationId) throw normalizedError("USAGE_RESERVATION_FAILED");
      return { reserved: true, reservationId, estimatedCostUsd: input.estimatedCostUsd, idempotencyKey: input.idempotencyKey };
    },
    async claimIdempotencyKey(idempotencyKey, estimatedCostUsd) { return this.reserveRequestBudget({ idempotencyKey, estimatedCostUsd }); },
    async commitUsage(input) {
      const result = await client.rpc("commit_sandbox_usage", { p_owner_id: ownerId, p_reservation_id: input.reservationId, p_actual_cost_usd: input.actualCostUsd });
      if (result?.error || result?.data !== true) throw normalizedError("USAGE_COMMIT_FAILED");
      return true;
    },
    async releaseReservation(reservationId) {
      const result = await client.rpc("release_sandbox_reservation", { p_owner_id: ownerId, p_reservation_id: reservationId });
      if (result?.error || result?.data !== true) throw normalizedError("USAGE_RELEASE_FAILED");
      return true;
    },
    async findCachedGeneration(cacheKey) {
      const result = await client.from("sandbox_generation_cache").select("result_payload").eq("owner_id", ownerId).eq("cache_key", cacheKey).maybeSingle();
      if (result?.error) throw normalizedError("SERVER_USAGE_STORE_REQUIRED");
      return result;
    },
    async getCachedResult(cacheKey) { const result = await this.findCachedGeneration(cacheKey); return result?.data?.result_payload || null; },
    async saveCachedGeneration(cacheKey, result) {
      const saved = await client.from("sandbox_generation_cache").upsert({ cache_key: cacheKey, owner_id: ownerId, source_id: result.sourceExportId, source_version: result.sourceRevisionId || "base", prompt_version: result.modelPolicyId, result_payload: result });
      if (saved?.error) throw normalizedError("SERVER_USAGE_STORE_REQUIRED");
      return true;
    },
    async saveCachedResult(cacheKey, result) { return this.saveCachedGeneration(cacheKey, result); },
  };
}

export function requireVerifiedOwnerContext(context) {
  if (!context || typeof context.ownerId !== "string" || context.ownerIdentityVerified !== true || context.sessionVerified !== true || context.csrfVerified !== true) throw Object.assign(new Error("Verified owner context required"), { reasonCode: "OWNER_AUTH_CONTEXT_REQUIRED" });
  return Object.freeze({ ownerId: context.ownerId });
}

export function createVerifiedSupabaseUsageStoreAdapter(client, context) {
  const verified = requireVerifiedOwnerContext(context);
  return createSupabaseUsageStoreAdapter(client, verified.ownerId);
}
