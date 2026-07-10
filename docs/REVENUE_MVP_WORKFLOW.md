# Revenue MVP Workflow

## 0. Workflow Identity

- Workflow ID: `rev-mvp-001`
- Name: Phase1-B Revenue MVP Workflow
- Mode: Development Mode / Mock Only
- External communication: Not allowed
- Production Mode: Disabled
- Primary objective: Convert a revenue opportunity into an Owner-reviewed mock execution package and measurable result record.

## 1. Trigger

The workflow starts when one of the following internal events exists:

- Owner creates a revenue idea.
- Opportunity Engine ranks a mock opportunity.
- Aegis recommends a revenue action.
- AI CMO or AI COO proposes a campaign.

No provider event, webhook, or external trigger is allowed in Phase1-B.

## 2. Required Inputs

- Opportunity title
- Revenue channel: affiliate, blog, SNS, video, service proposal, or ad concept
- Target audience
- Expected revenue type: Actual, Mock, Forecast, Sample, or Unconnected
- Assigned AI employee
- Budget estimate
- Risk level
- Approval requirement

## 3. MVP 15 Employees

| Employee | Role in MVP |
| --- | --- |
| Aegis | Owner briefing and escalation |
| Mira | AI CEO, priority decision proposal |
| Ren | AI COO, execution coordination |
| Hana | AI CFO, budget and revenue review |
| Yui | AI CMO, campaign direction |
| Sara | Research lead |
| Rina | Trend analyst |
| Mei | SEO strategist |
| Nao | Blog producer |
| Emi | Copywriter |
| Saki | SNS producer |
| Kana | Canva/creative operator |
| Itsuki | Video script writer |
| Eri | Domestic affiliate lead |
| Aoi | Legal and brand risk reviewer |

The remaining 35 AI employees stay in standby until the MVP has stable event and approval records.

## 4. Workflow Steps

| Step | Owner | Action | Output | Approval |
| --- | --- | --- | --- | --- |
| 1 | Aegis | Receive or identify revenue idea | Opportunity draft | No |
| 2 | Sara/Rina | Research trend and audience | Evidence notes | No |
| 3 | Yui | Choose channel and angle | Campaign brief | No |
| 4 | Hana | Estimate revenue and budget | Forecast and budget note | If high cost |
| 5 | Mei/Nao/Emi/Saki/Kana/Itsuki | Produce content package | Draft assets | No |
| 6 | Eri | Add affiliate/service monetization logic | Offer package | No |
| 7 | Aoi | Legal, claim, disclosure, and brand check | QA result | Escalates risk |
| 8 | Ren | Assemble approval package | Owner approval item | Yes |
| 9 | Owner | Approve, reject, or request changes | Owner decision | Required |
| 10 | Safety Engine | Re-check execution context | Allow/block decision | Mandatory |
| 11 | System | Record mock result only | Result event | No |
| 12 | Aegis | Summarize next action | Briefing update | No |

## 5. Core Media Affiliate Pipeline

1. Opportunity selected from mock trend or Owner idea.
2. Affiliate item or service category is attached.
3. SEO article brief and SNS caption are drafted.
4. Visual and thumbnail concept is created as a draft record.
5. Disclosure and risk checklist is completed.
6. Owner approval package is generated.
7. Safety Engine blocks external publish in Phase1-B.
8. Mock result is recorded with clear label.

Deliverables:

- SEO brief
- Blog draft outline
- SNS caption package
- Creative brief
- Affiliate disclosure checklist
- Owner approval package
- Mock result event

## 6. Short-Term Service Pipeline

1. Service idea is selected.
2. Target customer segment is defined.
3. Offer, price, and promise are drafted.
4. Proposal copy is created.
5. Legal and brand review checks claims.
6. Owner approval package is generated.
7. Safety Engine blocks sending in Phase1-B.
8. Mock result is recorded with clear label.

Deliverables:

- Service offer brief
- Proposal draft
- Budget and revenue forecast
- Risk checklist
- Owner approval package
- Mock result event

## 7. Failure and Retry

| Failure | Handling |
| --- | --- |
| Missing opportunity data | Return to Step 1 |
| Missing budget estimate | Return to Hana |
| Legal risk high | Escalate to Owner before package finalization |
| Owner rejects | Record rejection and improvement note |
| Safety Engine blocks | Record blocked result; do not execute |
| Emergency Stop active | Stop immediately and record blocked event |

## 8. Done Definition

A workflow is complete only when:

- All deliverables are stored as internal records.
- Revenue values are labeled as Actual, Mock, Forecast, Sample, or Unconnected.
- Approval status is recorded.
- `canExecute` has been checked for any execution-like action.
- No external provider call occurred.
- Result event and Aegis briefing were updated.

## 9. KPI Model

Phase1-B uses internal metrics:

- Draft package count
- Approval package count
- Rejection rate
- Risk flag count
- Mock forecast amount
- Actual manually entered amount, if any
- Time from opportunity to approval package
- Employee contribution score
- Improvement notes generated

Live SNS views, provider metrics, affiliate revenue sync, and ad cost import are not allowed until a future real API phase.

## 10. Revenue MVP Artifact Specification

The Revenue MVP Package Generator must create all 16 artifacts in Mock mode when the Owner selects one revenue theme. The first three production channels are Threads, Instagram, and Blog/SEO. YouTube Shorts and TikTok are generated as derivative content.

| # | artifactType | Quantity | Campaign type | Target channel | Required input | Owner AI employee | Reviewer | Output format | Required fields | Quality baseline | Done condition | Failure condition | Rework condition | Owner approval | Legal check | Brand QA | Mock / Actual | Storage model | Next step |
| --- | --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `JP_SNS_POST` | 3 | `CORE_MEDIA` | Threads, Instagram, reuse short text | theme, audience, CTA, affiliate angle | Saki | Yui | caption set | hook, body, CTA, disclosure, hashtags, status | Japanese-first, no unverified claims | 3 draft posts exist | missing CTA/disclosure | revise copy | required before publish intent | required | required | MOCK | ContentAsset | Owner package |
| 2 | `GLOBAL_SNS_POST` | 3 | `CORE_MEDIA` | English global SNS | theme, audience, CTA, localization note | Lina | Yui | caption set | hook, body, CTA, disclosure, hashtags, language, status | simple English, culturally neutral | 3 global drafts exist | unclear target region | revise localization | required before publish intent | required | required | MOCK | ContentAsset | Owner package |
| 3 | `BLOG_ARTICLE` | 1 | `CORE_MEDIA` | Blog/SEO | keyword, searchIntent, offer, references | Nao | Mei | markdown draft | title, seoTitle, metaDescription, slug, searchIntent, outline, body, CTA, affiliateDisclosure, legalNotes, references, status | complete outline and disclosure | full draft exists | missing required field | rewrite section | required before publish intent | required | required | MOCK | ContentAsset | SEO package |
| 4 | `SEO_TITLE` | 1 | `CORE_MEDIA` | Blog/SEO | keyword, searchIntent, benefit | Mei | Yui | text variants | primaryTitle, alternatives, keyword, intent, status | clear intent and keyword | title selected | keyword missing | regenerate | not required unless publishing | optional | required | MOCK | ContentAsset | Blog article |
| 5 | `META_DESCRIPTION` | 1 | `CORE_MEDIA` | Blog/SEO | seoTitle, searchIntent, CTA | Mei | Nao | text | description, keyword, CTA, characterTarget, status | concise and non-misleading | description exists | exceeds policy/claim risk | rewrite | not required unless publishing | optional | required | MOCK | ContentAsset | Blog article |
| 6 | `YOUTUBE_SHORTS_SCRIPT` | 1 | `CORE_MEDIA` | YouTube Shorts | blog angle, hook, CTA | Itsuki | Aoi | script | hook, scenes, narration, CTA, disclosure, durationTarget, status | 30-60 second structure | script exists | claim/copyright risk | revise script | required before upload intent | required | required | MOCK | ContentAsset | derivative video |
| 7 | `TIKTOK_SCRIPT` | 1 | `CORE_MEDIA` | TikTok | short hook, audience, CTA | Noa | Aoi | script | hook, scenes, caption, CTA, disclosure, status | simple, clear, compliant | script exists | misleading hook | revise hook | required before upload intent | required | required | MOCK | ContentAsset | derivative video |
| 8 | `INSTAGRAM_IMAGE_IDEA` | 1 | `CORE_MEDIA` | Instagram | post theme, brand rule, CTA | Kana | Akari | creative brief | visualConcept, layout, copyOverlay, CTA, dimensions, status | readable on mobile | image idea exists | asset rights unclear | revise brief | required before publish intent | optional | required | MOCK | ContentAsset | Canva instruction |
| 9 | `CANVA_INSTRUCTION` | 1 | `CORE_MEDIA` | Canva/manual design | Instagram image idea, brand rule | Kana | Fumi | instruction brief | layout, colors, typography, elements, exportSize, status | actionable by human designer | instruction exists | unclear layout | revise instruction | not required unless external design action | optional | required | MOCK | ContentAsset | creative production |
| 10 | `AFFILIATE_FUNNEL` | 1 | `CORE_MEDIA` | Blog/SNS affiliate | offer, disclosure, CTA, audience | Eri | Hana | funnel map | offerSummary, disclosure, CTA, landingPath, attributionPlan, status | disclosure and value proposition clear | funnel exists | missing disclosure | revise offer | required before link deployment intent | required | required | MOCK | ApprovalPackage asset | approval package |
| 11 | `CTA` | 1 | `CORE_MEDIA` | Blog/SNS/service | audience, offer, risk level | Emi | Yui | text variants | primaryCTA, alternatives, placement, intent, status | honest and specific | CTA selected | overpromising | rewrite | required before publish/send intent | optional | required | MOCK | ContentAsset | content package |
| 12 | `LEGAL_CHECK` | 1 | both | all target channels | all draft assets | Aoi | Kazu | checklist | claims, disclosures, prohibitedItems, legalNotes, riskLevel, status | high-risk claims flagged | checklist completed | missing asset review | rerun check | required | required | optional | MOCK | RiskReview | brand QA |
| 13 | `BRAND_QA` | 1 | both | all target channels | all draft assets, brand rule | Fumi | Akari | checklist | tone, visuals, readability, consistency, issues, status | brand-safe and readable | QA completed | brand mismatch | revise assets | required before external intent | optional | required | MOCK | RiskReview | approval package |
| 14 | `OWNER_APPROVAL_PACKAGE` | 1 | both | Owner screen | all assets, budget, risks | Ren | Aegis | approval package | summary, assets, budgetEstimate, riskLevel, legalChecklist, brandChecklist, safetyDecision, status | complete evidence bundle | package ready | missing decision data | return to owner office | required | required | required | MOCK | ApprovalPackage | Safety re-check |
| 15 | `PUBLISH_PREPARED` | 1 | `CORE_MEDIA` | manual publish preparation | approval package, channel list | Ren | Kai | preparation record | channel, scheduleProposal, manualSteps, blockedExternalActions, status | no automatic publish | manual prep record exists | tries external publish | block and revise | required before manual owner action | required | required | MOCK | WorkflowRun/EventRecord | mock result |
| 16 | `PERFORMANCE_ANALYSIS_TEMPLATE` | 1 | both | analytics/manual record | campaignId, target KPI, valueType | Aya | Hana | analysis template | KPI list, valueType, expectedMetrics, actualInputFields, notes, status | separates actual/forecast/mock | template exists | mixes value types | split record | not required | optional | optional | MOCK | RevenueRecord template | performance recorder |

Blog article minimum fields:

- `title`
- `seoTitle`
- `metaDescription`
- `slug`
- `searchIntent`
- `outline`
- `body`
- `CTA`
- `affiliateDisclosure`
- `legalNotes`
- `references`
- `status`

## 11. Campaign Type Separation

`CORE_MEDIA` and `SHORT_TERM_SERVICE` must remain separate in workflow, KPI, RevenueRecord aggregation, and Owner display.

CORE_MEDIA includes:

- SNS.
- Blog / SEO.
- Affiliate.
- Overseas expansion.
- Owned products.
- Owned services.

SHORT_TERM_SERVICE includes:

- SNS post creation.
- Blog article creation.
- Canva production.
- AI efficiency support.
- Instagram operation support.
- Small business AI onboarding.
- Crowdsourcing work.

## 12. Short-Term Service Customer Acquisition Pipeline

Target channels:

- CrowdWorks.
- Lancers.
- Coconala.
- Existing personal network.
- SNS profile.
- Direct proposal.

Workflow:

1. Opportunity discovery.
2. Case fit assessment.
3. Application decision.
4. Proposal draft creation.
5. Owner confirmation.
6. Manual application by Owner.
7. Meeting preparation.
8. Order received.
9. Production.
10. QA.
11. Delivery.
12. Invoice/request.
13. RevenueRecord.

External communication, applications, direct messages, and delivery are Owner-manual actions in Phase1-B.

SHORT_TERM_SERVICE KPI:

- applications
- responseRate
- interviews
- orders
- orderValue
- deliveryTime
- grossMargin
- repeatOrders
