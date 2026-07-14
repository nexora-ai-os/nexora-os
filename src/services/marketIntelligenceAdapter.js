import {
  DATA_MODES,
  GATE_REASON_CODES,
  GATE_RESULTS,
  LANES,
  MARKET_INTELLIGENCE_SCHEMA_VERSION,
  THRESHOLDS,
} from "../data/marketIntelligenceSchemas.js";

const FORBIDDEN_REVENUE_FIELDS = new Set([
  "actualRevenue",
  "realizedRevenue",
  "confirmedRevenue",
  "productionRevenue",
]);

const BLOCKED_REASON_MESSAGES = Object.freeze({
  [GATE_REASON_CODES.SCORE_TOO_LOW]: "推奨基準に達していない候補があります。",
  [GATE_REASON_CODES.CONFIDENCE_TOO_LOW]: "根拠データが不足している候補があります。",
  [GATE_REASON_CODES.SIGNAL_EXPIRED]: "再調査が必要な候補があります。",
  [GATE_REASON_CODES.NO_MONETIZATION_EVIDENCE]: "収益経路を確認できない候補があります。",
  [GATE_REASON_CODES.HIGH_RISK_DETECTED]: "安全上の理由で除外された候補があります。",
  [GATE_REASON_CODES.ACTUAL_REVENUE_DEPENDENCY]: "未接続の実売上データに依存する候補を除外しました。",
});

const LANE_LABELS = Object.freeze({
  [LANES.CASH]: "短期収益",
  [LANES.ASSET]: "資産形成",
});

const RISK_ORDER = ["none", "low", "medium", "high", "critical"];

function createError(code, field, message) {
  return { code, field, message };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseEvaluationTime(evaluationTime) {
  if (typeof evaluationTime !== "string") return null;
  const time = Date.parse(evaluationTime);
  if (!Number.isFinite(time) || new Date(time).toISOString() !== evaluationTime) return null;
  return evaluationTime;
}

function walk(value, visit, path = []) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walk(entry, visit, [...path, String(index)]));
    return;
  }
  for (const [key, entry] of Object.entries(value)) {
    visit(key, entry, [...path, key]);
    walk(entry, visit, [...path, key]);
  }
}

function validateSafetyBoundary(result) {
  const errors = [];
  walk(result, (key, value, path) => {
    const field = path.join(".");
    if (FORBIDDEN_REVENUE_FIELDS.has(key)) {
      errors.push(createError("ACTUAL_REVENUE_FIELD_FORBIDDEN", field, `${key} is not allowed in Market Intelligence ViewModel input.`));
    }
    if ((key === "productionExecution" || key === "production" || key === "mode") && (value === true || value === "production")) {
      errors.push(createError("PRODUCTION_NOT_ALLOWED", field, "Production execution is not allowed."));
    }
    if ((key === "externalExecution" || key === "isExternalRequest" || key === "externalCommunication") && value === true) {
      errors.push(createError("EXTERNAL_EXECUTION_NOT_ALLOWED", field, "External execution is not allowed."));
    }
  });
  return errors;
}

function validateFoundationResult(foundationResult, evaluationTime) {
  const errors = [];
  const normalizedEvaluationTime = parseEvaluationTime(evaluationTime);

  if (!normalizedEvaluationTime) {
    errors.push(createError("EVALUATION_TIME_INVALID", "evaluationTime", "evaluationTime must be an ISO 8601 string."));
  }
  if (!isPlainObject(foundationResult)) {
    return {
      evaluationTime: normalizedEvaluationTime,
      errors: [createError("FOUNDATION_RESULT_INVALID", "foundationResult", "foundationResult must be an object."), ...errors],
    };
  }
  if (foundationResult.schemaVersion !== MARKET_INTELLIGENCE_SCHEMA_VERSION) {
    errors.push(createError("SCHEMA_VERSION_MISMATCH", "schemaVersion", "schemaVersion must match the frozen Market Intelligence schema."));
  }
  if (foundationResult.dataMode !== DATA_MODES.MOCK) {
    errors.push(createError("REAL_DATA_NOT_ALLOWED", "dataMode", "Only mock dataMode is allowed."));
  }
  if (foundationResult.isMock !== true) {
    errors.push(createError("MOCK_FLAG_REQUIRED", "isMock", "isMock must be true."));
  }
  if (!Array.isArray(foundationResult.top3)) {
    errors.push(createError("TOP3_INVALID", "top3", "top3 must be an array."));
  } else if (foundationResult.top3.length > 3) {
    errors.push(createError("TOP3_TOO_LARGE", "top3", "top3 must contain at most 3 opportunities."));
  }
  if (!Array.isArray(foundationResult.opportunities)) {
    errors.push(createError("OPPORTUNITIES_INVALID", "opportunities", "opportunities must be an array."));
  }

  return {
    evaluationTime: normalizedEvaluationTime,
    errors: [...errors, ...validateSafetyBoundary(foundationResult)],
  };
}

function validateRecommendation(opportunity, evaluationTime) {
  const errors = [];
  const holds = [];

  if (!isPlainObject(opportunity)) {
    return { errors: [createError("OPPORTUNITY_INVALID", "recommendation", "Recommendation must be an object.")], holds };
  }

  const requiredFields = [
    "opportunityId",
    "opportunityVersion",
    "marketId",
    "correlationId",
    "lane",
    "title",
    "adjustedConfidence",
    "finalScore",
    "baseScore",
    "totalPenalty",
    "forecastRevenueRange",
    "expiresAt",
    "provenance",
    "riskFlags",
  ];

  for (const field of requiredFields) {
    if (opportunity[field] === undefined || opportunity[field] === null || opportunity[field] === "") {
      errors.push(createError("REQUIRED_FIELD_MISSING", field, `${field} is required.`));
    }
  }
  if (!Object.values(LANES).includes(opportunity.lane)) {
    errors.push(createError("LANE_INVALID", "lane", "lane must be cash or asset."));
  }
  if (!Number.isFinite(Number(opportunity.adjustedConfidence))) {
    errors.push(createError("CONFIDENCE_INVALID", "adjustedConfidence", "adjustedConfidence must be numeric."));
  } else if (Number(opportunity.adjustedConfidence) < THRESHOLDS.MIN_ADJUSTED_CONFIDENCE) {
    holds.push(createError("CONFIDENCE_TOO_LOW", "adjustedConfidence", "adjustedConfidence is below display threshold."));
  }
  for (const field of ["finalScore", "baseScore", "totalPenalty"]) {
    const value = Number(opportunity[field]);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      errors.push(createError("SCORE_OUT_OF_RANGE", field, `${field} must be between 0 and 100.`));
    }
  }
  if (Number(opportunity.finalScore) < THRESHOLDS.MIN_FINAL_SCORE) {
    holds.push(createError("SCORE_TOO_LOW", "finalScore", "finalScore is below display threshold."));
  }
  const forecast = opportunity.forecastRevenueRange;
  if (!isPlainObject(forecast)) {
    holds.push(createError("FORECAST_INVALID", "forecastRevenueRange", "Forecast range is required."));
  } else {
    const low = Number(forecast.low);
    const base = Number(forecast.base);
    const high = Number(forecast.high);
    const periodDays = Number(forecast.periodDays);
    if (forecast.currency !== "JPY" || forecast.isMock !== true || ![low, base, high, periodDays].every(Number.isFinite) || low > base || base > high) {
      holds.push(createError("FORECAST_INVALID", "forecastRevenueRange", "Forecast range must be mock JPY and ordered low <= base <= high."));
    }
  }
  const expiresAt = Date.parse(opportunity.expiresAt || "");
  const now = Date.parse(evaluationTime || "");
  if (!Number.isFinite(expiresAt) || (Number.isFinite(now) && expiresAt <= now)) {
    holds.push(createError("SIGNAL_EXPIRED", "expiresAt", "Recommendation is expired."));
  }
  const risks = Array.isArray(opportunity.riskFlags) ? opportunity.riskFlags : [];
  const riskLevel = highestRisk([opportunity.legalPolicyRisk, ...risks]);
  if (riskLevel === "high" || riskLevel === "critical") {
    errors.push(createError("HIGH_RISK_DETECTED", "riskFlags", "High or critical risk is not displayable."));
  }

  return { errors, holds };
}

function highestRisk(values = []) {
  return values.reduce((highest, value) => {
    const normalized = String(value || "none").toLowerCase();
    return RISK_ORDER.indexOf(normalized) > RISK_ORDER.indexOf(highest) ? normalized : highest;
  }, "none");
}

function formatYen(value) {
  return `¥${Number(value).toLocaleString("ja-JP")}`;
}

function buildForecastLabel(forecast) {
  return `推定売上: ${formatYen(forecast.low)}〜${formatYen(forecast.base)} / ${forecast.periodDays}日`;
}

function buildConfidenceLabel(confidence) {
  const value = Number(confidence);
  const level = value >= 80 ? "高" : value >= 70 ? "中高" : "中";
  return `信頼度: ${level} (${value})`;
}

function buildWhyNow(opportunity) {
  const evidence = Array.isArray(opportunity.monetizationEvidence) ? opportunity.monetizationEvidence.length : 0;
  const signals = Array.isArray(opportunity.supportingSignalIds) ? opportunity.supportingSignalIds.length : 0;
  if (signals > 0 && evidence > 0) {
    return `Mock Signal ${signals}件と収益根拠 ${evidence}件に基づく候補です。`;
  }
  return "Mock Signalの評価結果に基づく候補です。";
}

function buildMainRisk(opportunity) {
  const risks = Array.isArray(opportunity.riskFlags) ? opportunity.riskFlags : [];
  const medium = risks.find((risk) => String(risk).toLowerCase().includes("medium"));
  const first = medium || risks[0];
  return first ? `注意: ${first}` : "重大なリスクは検出されていません（Mock評価）。";
}

function buildNextAction(opportunity) {
  const laneLabel = LANE_LABELS[opportunity.lane] || "市場";
  return `${laneLabel}候補として、P0-013CでOwner判断用に表示します。`;
}

function summarizeProvenance(provenance) {
  if (!isPlainObject(provenance) || !Array.isArray(provenance.sourceNames)) return [];
  return provenance.sourceNames.map((sourceName) => `Mock source: ${sourceName}`);
}

function buildRecommendation(opportunity, rank) {
  const forecast = opportunity.forecastRevenueRange;
  return {
    rank,
    opportunityId: opportunity.opportunityId,
    opportunityVersion: opportunity.opportunityVersion,
    marketId: opportunity.marketId,
    correlationId: opportunity.correlationId,
    lane: opportunity.lane,
    primary: {
      title: `${opportunity.title}（${LANE_LABELS[opportunity.lane]}）`,
      whyNow: buildWhyNow(opportunity),
      forecastLabel: buildForecastLabel(forecast),
      forecastRange: {
        currency: forecast.currency,
        low: forecast.low,
        base: forecast.base,
        high: forecast.high,
        periodDays: forecast.periodDays,
      },
      confidenceLabel: buildConfidenceLabel(opportunity.adjustedConfidence),
      adjustedConfidence: opportunity.adjustedConfidence,
      mainRisk: buildMainRisk(opportunity),
      nextAction: buildNextAction(opportunity),
      expiresAt: opportunity.expiresAt,
    },
    details: {
      customerProblem: opportunity.customerProblem,
      targetAudience: opportunity.targetAudience,
      revenueModel: opportunity.revenueModel,
      recommendedChannel: opportunity.recommendedChannel,
      finalScore: opportunity.finalScore,
      baseScore: opportunity.baseScore,
      totalPenalty: opportunity.totalPenalty,
      estimatedTimeToRevenue: opportunity.estimatedTimeToRevenue,
      assumptions: Array.isArray(forecast.assumptions) ? [...forecast.assumptions] : [],
      supportingSignalCount: Array.isArray(opportunity.supportingSignalIds) ? opportunity.supportingSignalIds.length : 0,
      sourceTypeCount: new Set((opportunity.signals || []).map((signal) => signal.sourceType).filter(Boolean)).size,
      monetizationEvidence: Array.isArray(opportunity.monetizationEvidence) ? [...opportunity.monetizationEvidence] : [],
      riskFlags: Array.isArray(opportunity.riskFlags) ? [...opportunity.riskFlags] : [],
      provenanceSummary: summarizeProvenance(opportunity.provenance),
    },
    safety: {
      dataMode: DATA_MODES.MOCK,
      isMock: true,
      productionExecution: false,
      externalExecution: false,
      confirmedRevenueAvailable: false,
      ownerDecisionEnabled: false,
      campaignHandoffEnabled: false,
    },
  };
}

function countBlocked(opportunities = []) {
  const summary = new Map();
  let holdCount = 0;
  let rejectedCount = 0;
  let expiredCount = 0;

  for (const opportunity of opportunities) {
    const result = opportunity?.validation?.result;
    const reasonCodes = opportunity?.validation?.reasonCodes || [];
    if (result === GATE_RESULTS.HOLD) holdCount += 1;
    if (result === GATE_RESULTS.REJECT) rejectedCount += 1;
    if (reasonCodes.includes(GATE_REASON_CODES.SIGNAL_EXPIRED) || opportunity?.state === "expired") expiredCount += 1;
    for (const reasonCode of reasonCodes) {
      summary.set(reasonCode, (summary.get(reasonCode) || 0) + 1);
    }
  }

  return {
    holdCount,
    rejectedCount,
    expiredCount,
    reasonSummary: [...summary.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([reasonCode, count]) => ({
      reasonCode,
      count,
      ownerMessage: BLOCKED_REASON_MESSAGES[reasonCode] || "確認が必要な候補があります。",
    })),
  };
}

function createFallbackViewModel(status, evaluationTime, errors = [], foundationResult = {}) {
  const safeFoundation = isPlainObject(foundationResult) ? foundationResult : {};
  const opportunities = Array.isArray(safeFoundation.opportunities) ? safeFoundation.opportunities : [];
  return {
    ok: false,
    status,
    schemaVersion: safeFoundation.schemaVersion || MARKET_INTELLIGENCE_SCHEMA_VERSION,
    dataMode: DATA_MODES.MOCK,
    isMock: true,
    evaluationTime: evaluationTime || null,
    briefing: {
      title: "Market Intelligence",
      summary: "安全に表示できる市場候補はありません。",
      oneNextAction: "Mock Signalを確認してください。",
      recommendationCount: 0,
      hasAssetCandidate: false,
      assetFallbackUsed: false,
      assetFallbackReason: null,
    },
    recommendations: [],
    blocked: countBlocked(opportunities),
    errors,
  };
}

function createBriefing(recommendations, opportunities) {
  const passAssetCandidates = opportunities.filter((opportunity) => opportunity?.validation?.result === GATE_RESULTS.PASS && opportunity.lane === LANES.ASSET);
  const hasAssetCandidate = recommendations.some((recommendation) => recommendation.lane === LANES.ASSET);
  const assetFallbackUsed = recommendations.length === 3 && recommendations.every((recommendation) => recommendation.lane === LANES.CASH) && passAssetCandidates.length === 0;
  return {
    title: "本日の市場判断",
    summary: recommendations.length
      ? `Owner判断に回せる市場候補が${recommendations.length}件あります。実売上は未接続です。`
      : "本日の市場判断に重要な変化はありません。",
    oneNextAction: recommendations.length ? "最上位候補を確認してください。" : "追加判断は不要です。",
    recommendationCount: recommendations.length,
    hasAssetCandidate,
    assetFallbackUsed,
    assetFallbackReason: assetFallbackUsed ? "資産形成レーンにHard Gate通過候補がないため、短期収益候補のみ表示しています。" : null,
  };
}

export function buildMarketIntelligenceViewModel(foundationResult, evaluationTime) {
  const foundationValidation = validateFoundationResult(foundationResult, evaluationTime);
  const normalizedEvaluationTime = foundationValidation.evaluationTime;
  if (foundationValidation.errors.length) {
    return createFallbackViewModel("rejected", normalizedEvaluationTime, foundationValidation.errors, foundationResult);
  }

  const top3 = foundationResult.top3;
  if (!top3.length) {
    return createFallbackViewModel("empty", normalizedEvaluationTime, [], foundationResult);
  }

  const validationErrors = [];
  const validationHolds = [];
  top3.forEach((opportunity, index) => {
    const validation = validateRecommendation(opportunity, normalizedEvaluationTime);
    validationErrors.push(...validation.errors.map((error) => ({ ...error, field: `top3.${index}.${error.field}` })));
    validationHolds.push(...validation.holds.map((error) => ({ ...error, field: `top3.${index}.${error.field}` })));
  });

  if (validationErrors.length) {
    return createFallbackViewModel("rejected", normalizedEvaluationTime, validationErrors, foundationResult);
  }
  if (validationHolds.length) {
    return createFallbackViewModel("hold", normalizedEvaluationTime, validationHolds, foundationResult);
  }

  const recommendations = top3.map((opportunity, index) => buildRecommendation(opportunity, index + 1));
  return {
    ok: true,
    status: "ready",
    schemaVersion: foundationResult.schemaVersion,
    dataMode: DATA_MODES.MOCK,
    isMock: true,
    evaluationTime: normalizedEvaluationTime,
    briefing: createBriefing(recommendations, foundationResult.opportunities),
    recommendations,
    blocked: countBlocked(foundationResult.opportunities),
    errors: [],
  };
}
