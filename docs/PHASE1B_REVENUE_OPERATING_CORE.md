# Phase1-B Revenue Operating Core

## 0. Purpose

Phase1-B turns the Phase1-A mock-only safety foundation into a revenue operating design. The goal is not to connect external APIs. The goal is to make KEVIRIO able to plan, package, approve, and measure revenue work without misrepresenting mock state as real execution.

## 1. Operating Principles

- Every revenue activity starts as an internal mock workflow.
- Every external-facing action requires Owner approval and then a second Safety Engine check.
- Approval means Owner intent confirmation, not execution permission.
- Production Mode remains disabled.
- Published, sent, webhook, external, and production actions remain blocked.
- Revenue data must always be labeled as Actual, Mock, Forecast, Sample, or Unconnected.

## 2. Core Modules

| Module | Responsibility | Input | Output | Owner Approval | Phase |
| --- | --- | --- | --- | --- | --- |
| Revenue Command Center | Single view of revenue work, readiness, and blockers | Opportunities, campaigns, approvals, metrics | Prioritized revenue board | No for view, yes for external intent | P0 |
| Opportunity Engine | Detect and rank revenue opportunities | Trend, affiliate item, service idea, memory | Opportunity record | No | P0 |
| Campaign Engine | Convert opportunity into campaign plan | Opportunity, channel, target persona | Campaign plan | Required before external action | P0 |
| Content Production Pipeline | Produce draft packages | Campaign plan, brand rule, content type | Blog/SNS/video/creative drafts | Required before external action | P0 |
| SNS Production Pipeline | Prepare post drafts and mock schedules | Campaign, channel, caption, asset | Mock SNS package | Required before posting | P1 |
| Blog/SEO Pipeline | Prepare article brief and draft | Keyword, search intent, affiliate item | SEO article package | Required before publishing | P1 |
| Affiliate Pipeline | Prepare affiliate offer package | Program, product, commission, content | Affiliate package | Required before link deployment | P0 |
| Service Proposal Pipeline | Prepare short-term monetization offer | Client segment, service menu, price | Proposal package | Required before sending | P0 |
| Approval Package | Bundle work, evidence, cost, and risk | Drafts, estimates, QA findings | Owner decision item | Yes | P0 |
| Legal/Brand QA | Check prohibited claims, tone, and disclosure | Draft package | QA result and risk flags | Escalates if risk exists | P0 |
| Performance Recorder | Record results and distinguish mock from actual | Campaign result, manual input | Result event | No for record, yes for external import later | P1 |
| Improvement Loop | Feed results back into workforce learning | Result event, owner feedback | Playbook update, employee score | No | P1 |
| Aegis Briefing | Summarize actions, blockers, and next decisions | All active revenue events | Daily briefing | No | P0 |
| AI Board Meeting | Coordinate CEO/COO/CMO/CFO/CTO decisions | Metrics, risks, backlog | Recommended operating plan | Owner final decision | P1 |

## 3. Revenue MVP Scope

The Phase1-B MVP should support two internal pipelines:

1. Core media affiliate pipeline
   - Opportunity discovery
   - Product/program selection
   - Blog/SNS/video draft package
   - Disclosure and brand QA
   - Owner approval package
   - Mock result record

2. Short-term service proposal pipeline
   - Service idea
   - Target segment
   - Offer outline
   - Proposal draft
   - Risk and budget check
   - Owner approval package
   - Mock result record

Both pipelines remain internal. They do not post, send, publish, call webhooks, or connect to providers.

## 4. Revenue State Definitions

| Display Label | Meaning | Allowed in Phase1-B |
| --- | --- | --- |
| Actual | Manually entered or verified real-world result | Yes, only if clearly marked |
| Mock | Internal simulation or demo data | Yes |
| Forecast | Estimate based on assumptions | Yes |
| Sample | Example data for UI or workflow design | Yes |
| Unconnected | Provider or data source is not connected | Yes |
| Connected | Real provider connection verified | No |
| Active Production | Production execution available | No |

## 5. Approval Package Fields

Required fields:

- `approvalId`
- `createdAt`
- `requestedByEmployeeId`
- `revenueWorkflowId`
- `actionType`
- `channel`
- `title`
- `summary`
- `draftAssets`
- `expectedRevenue`
- `budgetEstimate`
- `riskLevel`
- `legalChecklist`
- `brandChecklist`
- `externalActionRequested`
- `safetyDecision`
- `ownerDecision`
- `decisionAt`
- `resultMode`

## 6. P0 Features

1. Revenue Command Center mock-only board.
2. Unified Opportunity -> Campaign -> Approval -> Result state flow.
3. MVP 15 AI employee assignment model.
4. Approval package data model and display.
5. Mock/Forecast/Actual/Sample labeling across revenue metrics.
6. Aegis daily briefing from local state only.
7. Event ledger for revenue and approval events.
8. Safety Engine re-check before any future execution path.

## 7. Deferred Features

- Real API provider connections.
- Production Mode activation.
- Automated SNS posting.
- Email sending.
- Webhook delivery.
- Real ad spend execution.
- Real affiliate network synchronization.
- Live analytics import.

## 8. Campaign and Revenue Classification

Campaign type is mandatory for Phase1-B revenue work.

| Campaign Type | Purpose | Includes |
| --- | --- | --- |
| `CORE_MEDIA` | Long-term owned media and scalable revenue | SNS, Blog/SEO, Affiliate, overseas expansion, owned products, owned services |
| `SHORT_TERM_SERVICE` | Near-term service revenue | SNS post creation, blog article creation, Canva production, Instagram operation support, AI efficiency support, small business AI onboarding, crowdsourcing work |

These two campaign types must be separated in workflow, KPI, revenue aggregation, and Owner dashboard display. Short-term service revenue must not hide or dilute long-term core media progress.

Revenue type:

| Revenue Type | Meaning |
| --- | --- |
| `AD_REVENUE` | Ad or media monetization revenue |
| `AFFILIATE_REVENUE` | Affiliate conversion revenue |
| `SERVICE_REVENUE` | Client service revenue |
| `PRODUCT_REVENUE` | Owned product revenue |
| `OTHER_REVENUE` | Other clearly labeled revenue |

Value type:

| Value Type | Meaning |
| --- | --- |
| `ACTUAL` | Manually verified actual result |
| `FORECAST` | Estimate based on assumptions |
| `MOCK` | Internal mock/demo result |

One `RevenueRecord` must have exactly one `valueType`. `ACTUAL`, `FORECAST`, and `MOCK` must not be combined inside the same record.

Owner-facing display groups:

- Core revenue.
- Short-term revenue.
- Actual.
- Forecast.
- Mock.
- Unconnected.

CORE_MEDIA KPI examples:

- impressions
- reach
- engagement
- clicks
- sessions
- conversions
- affiliateRevenue
- adRevenue
- RPM
- CTR
- CVR

SHORT_TERM_SERVICE KPI examples:

- leads
- proposals
- responseRate
- meetings
- orders
- deliveryCount
- grossRevenue
- hoursSpent
- grossMargin
- repeatRate

## 9. Approval Source of Truth

Phase1-B approval state must follow this trust boundary:

- LocalStorage is UI cache only.
- `ApprovalRequest` is application state.
- `ApprovalDecision` is temporary execution authorization proof.
- `SafetyDecision` is the final execution decision.
- Safety Engine must re-check before any execution-like action.
- `ApprovalDecision` is consumed once.
- Expired approvals are rejected.
- Revoked approvals are rejected.
- `targetId` mismatch is rejected.
- `actionType` mismatch is rejected.
- `ownerId` mismatch is rejected.
- Invalid nonce is rejected.
- Unknown state fails closed.

## 10. Short-Term Service Customer Acquisition Pipeline

SHORT_TERM_SERVICE target channels:

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

External communication, applications, direct messages, and delivery must be performed manually by the Owner in Phase1-B.

SHORT_TERM_SERVICE KPI:

- applications
- responseRate
- interviews
- orders
- orderValue
- deliveryTime
- grossMargin
- repeatOrders
