import assert from "node:assert/strict";
import { createDirectServicePackage, validateDirectServicePackage } from "../src/services/directServiceLaneService.js";
import { createAffiliateCandidate, validateAffiliateCandidate } from "../src/services/affiliateLaneService.js";
import { createSNSCandidateSet, validateSNSCandidateSet } from "../src/services/snsMediaLaneService.js";

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log(`PASS ${name}`); }
const source = { exportId: "export-1", correlationId: "correlation-1", sourceRevisionCandidateId: "revision-1", title: "中小企業の発信改善", campaignSummary: "安全なコンテンツ制作", contentBrief: "中小企業Owner", riskNotes: ["断定禁止"], prohibitedClaims: ["成果保証"] };
const snapshot = JSON.stringify(source);
const direct = createDirectServicePackage(source);
const affiliate = createAffiliateCandidate(source);
const sns = createSNSCandidateSet(source);
check("direct validates", () => assert.equal(validateDirectServicePackage(direct).valid, true));
check("direct deterministic", () => assert.deepEqual(direct, createDirectServicePackage(source)));
check("three fixed plans", () => assert.deepEqual(direct.packageOptions.map(x => x.name), ["Starter", "Standard", "Growth"]));
check("forecast JPY prices ordered", () => assert.ok(direct.packageOptions.every(x => x.priceType === "forecast") && direct.packageOptions[0].forecastPriceJpy < direct.packageOptions[1].forecastPriceJpy && direct.packageOptions[1].forecastPriceJpy < direct.packageOptions[2].forecastPriceJpy));
check("direct complete delivery contract", () => assert.ok(direct.deliveryScope.length && direct.excludedScope.length && direct.requiredCustomerInputs.length && direct.discoveryQuestions.length && direct.deliveryChecklist.length && direct.qualityChecklist.length));
check("affiliate validates", () => assert.equal(validateAffiliateCandidate(affiliate).valid, true));
check("affiliate disclosure Japanese", () => assert.ok(affiliate.disclosureText.includes("アフィリエイト")));
check("affiliate links disconnected", () => assert.ok(affiliate.linkCandidates.every(x => x.affiliateUrl === null && x.linkStatus === "notConnected" && x.programVerification === "required")));
check("affiliate invalid link rejected", () => assert.equal(validateAffiliateCandidate({ ...affiliate, linkCandidates: [{ ...affiliate.linkCandidates[0], affiliateUrl: "https://example.test" }] }).valid, false));
check("high risk affiliate rejected", () => assert.equal(validateAffiliateCandidate({ ...affiliate, articleTitle: "医療サービス比較" }).valid, false));
check("sns validates", () => assert.equal(validateSNSCandidateSet(sns).valid, true));
check("sns deterministic", () => assert.deepEqual(sns, createSNSCandidateSet(source)));
check("sns exact mix", () => assert.deepEqual(sns.posts.map(x => x.format).sort(), ["carouselOutline", "shortText", "shortText", "shortText", "threadOutline"]));
check("sns fields complete", () => assert.ok(sns.posts.every(x => x.postId && x.hook && x.body && x.callToAction && x.visualBrief && x.riskNotes.length)));
check("publish remains disconnected", () => assert.equal(affiliate.publishEnabled || sns.publishEnabled, false));
check("input not mutated", () => assert.equal(JSON.stringify(source), snapshot));
console.log(`Three revenue lanes verification: ${passed}/16 passed`);
