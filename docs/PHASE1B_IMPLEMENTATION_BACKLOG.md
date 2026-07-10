# Phase1-B Implementation Backlog

## 0. Scope

This backlog converts the Phase1-B design into small implementation tasks. It assumes Phase1-A safety remains intact. No task may add external API calls, provider connection tests, fetch, Production Mode activation, secret display, or automated publishing.

## 1. Priority Overview

| Priority | Theme | Outcome |
| --- | --- | --- |
| P0 | Revenue MVP foundation | Revenue data model, event model, MVP 15 employees, approval package |
| P1 | Workflow visibility | Revenue Command Center, Aegis briefing, performance recorder |
| P2 | Expansion | Remaining AI employees, more channels, richer dashboards |
| P3 | Future integration preparation | Provider adapter boundary design, still blocked by safety criteria |

## 2. First 10 Implementation Tasks

### P0-001: Add Phase1-B Revenue Data Seeds

| Field | Detail |
| --- | --- |
| Purpose | Create initial mock-only records for opportunity, campaign, approval package, revenue record, and event record |
| Why | Prevent another round of display/data mismatch |
| Change files | `src/data/platformOS.js` or new existing-pattern data file |
| New files | Optional `src/data/revenueOperatingCore.js` |
| Forbidden changes | No fetch, no provider call, no env read, no build config change |
| Implementation | Add clearly labeled `mock`, `forecast`, `sample`, and `unconnected` records |
| Acceptance | UI can render without pretending real execution occurred |
| Static audit | `rg "fetch\\s*\\(" src` remains empty |
| Build | Run only when Owner permits |
| Visual | Labels are visible and Japanese-first |
| Commit | Separate checkpoint after audit |
| Difficulty | Low |
| Revenue distance | Very close |
| Dependencies | Phase1-A clean state |

### P0-002: Define AI Workforce Registry

| Field | Detail |
| --- | --- |
| Purpose | Add 50 employee definitions and MVP 15 active subset |
| Why | Needed for assignment, accountability, and future learning |
| Change files | Existing AI employee data source or new existing-pattern data file |
| New files | Optional `src/data/aiWorkforce.js` |
| Forbidden changes | No autonomous execution, no API calls |
| Implementation | Store ID, role, status, allowed/prohibited actions, approvals, metrics |
| Acceptance | MVP 15 can be displayed separately from standby 35 |
| Static audit | No Production wording as enabled |
| Build | Owner-permitted only |
| Visual | Mock/standby/active-in-MVP labels are clear |
| Commit | Include with data model checkpoint |
| Difficulty | Medium |
| Revenue distance | Close |
| Dependencies | P0-001 |

### P0-003: Add Event Ledger Helper

| Field | Detail |
| --- | --- |
| Purpose | Standardize internal event records |
| Why | Approval, revenue, employee learning, and memory need one trace format |
| Change files | Service utility following existing local patterns |
| New files | Optional `src/services/eventLedger.js` |
| Forbidden changes | No external storage, no network |
| Implementation | Create append/list/filter helpers for local records |
| Acceptance | Events include mode, actor, target, and safetyDecisionId when relevant |
| Static audit | No fetch/import of network clients |
| Build | Owner-permitted only |
| Visual | Not applicable |
| Commit | Include with model checkpoint |
| Difficulty | Medium |
| Revenue distance | Close |
| Dependencies | P0-001 |

### P0-004: Build Revenue Command Center Shell

| Field | Detail |
| --- | --- |
| Purpose | Show opportunities, campaigns, approvals, revenue records, and blockers |
| Why | Owner needs one operating screen before workflow expansion |
| Change files | Existing dashboard/operations surface or new component |
| New files | Optional `src/components/RevenueCommandCenter.jsx` |
| Forbidden changes | No landing page, no external metrics |
| Implementation | Render existing mock-only data with clear labels |
| Acceptance | Actual, Mock, Forecast, Sample, Unconnected are visually distinct |
| Static audit | No connected/active/ready wording for unverified state |
| Build | Owner-permitted only |
| Visual | Desktop/mobile text fits |
| Commit | After build audit |
| Difficulty | Medium |
| Revenue distance | Very close |
| Dependencies | P0-001 |

### P0-005: Create Approval Package View

| Field | Detail |
| --- | --- |
| Purpose | Formalize Owner decision package |
| Why | External intent must never look like automatic execution |
| Change files | `ApprovalCenter.jsx` or related existing component |
| New files | Optional child component |
| Forbidden changes | No execution on approve |
| Implementation | Show summary, assets, budget, risks, Safety Engine result |
| Acceptance | Approval followed by blocked external execution status in Phase1-B |
| Static audit | Confirm approve handler does not call provider |
| Build | Owner-permitted only |
| Visual | Owner decision state is obvious |
| Commit | With workflow view checkpoint |
| Difficulty | Medium |
| Revenue distance | Close |
| Dependencies | P0-003 |

### P0-006: Connect Revenue MVP Workflow in Mock Mode

| Field | Detail |
| --- | --- |
| Purpose | Represent `rev-mvp-001` from opportunity to result |
| Why | Establish the repeatable revenue operating loop |
| Change files | Existing workflow service/component |
| New files | Optional workflow definition file |
| Forbidden changes | Do not bypass `canExecute`; no production workflow |
| Implementation | Add internal mock workflow type allowed by Safety Engine if needed |
| Acceptance | Missing context, production, external, webhook, send, publish are blocked |
| Static audit | Direct service call still requires guard |
| Build | Owner-permitted only |
| Visual | Workflow status is Mock Only |
| Commit | After guard audit |
| Difficulty | Medium |
| Revenue distance | Very close |
| Dependencies | P0-003, P0-005 |

### P0-007: Add Legal and Brand QA Checklist

| Field | Detail |
| --- | --- |
| Purpose | Give Aoi/Fumi/Akari structured QA records |
| Why | Claims, disclosure, and brand risk block real monetization |
| Change files | Data and approval UI |
| New files | Optional checklist data file |
| Forbidden changes | No legal advice claim |
| Implementation | Add checklist fields and risk levels |
| Acceptance | High risk escalates to Owner decision |
| Static audit | Risk labels do not imply approval |
| Build | Owner-permitted only |
| Visual | Risk severity visible |
| Commit | With approval package checkpoint |
| Difficulty | Low |
| Revenue distance | Close |
| Dependencies | P0-005 |

### P0-008: Add Aegis Daily Briefing

| Field | Detail |
| --- | --- |
| Purpose | Summarize next actions, blockers, risks, and decisions |
| Why | Owner needs operating clarity |
| Change files | Aegis/Home/operations display and data helper |
| New files | Optional briefing helper |
| Forbidden changes | No automatic execution |
| Implementation | Generate from local mock records only |
| Acceptance | Briefing lists decisions needed and blocked external intents |
| Static audit | No provider status says connected |
| Build | Owner-permitted only |
| Visual | First viewport shows useful operating state |
| Commit | After visual audit |
| Difficulty | Medium |
| Revenue distance | Close |
| Dependencies | P0-001, P0-003 |

### P0-009: Add Performance Recorder

| Field | Detail |
| --- | --- |
| Purpose | Record mock and manually entered actual outcomes |
| Why | Learning loop needs result data without API import |
| Change files | Revenue data/service and analytics display |
| New files | Optional result helper |
| Forbidden changes | No live analytics import |
| Implementation | Support `actual`, `mock`, `forecast`, `sample`, `unconnected` |
| Acceptance | Actual and mock are never visually identical |
| Static audit | No API client import |
| Build | Owner-permitted only |
| Visual | Labels visible near every value |
| Commit | With analytics checkpoint |
| Difficulty | Medium |
| Revenue distance | Medium |
| Dependencies | P0-003 |

### P0-010: Revenue MVP Package Generator

| Field | Detail |
| --- | --- |
| Purpose | Generate the complete Revenue MVP package in Mock mode when Owner selects one revenue theme |
| Why | Phase1-B must reach concrete revenue artifacts within the first 7 days |
| Change files | Revenue workflow/service and existing revenue UI |
| New files | Optional package generator helper |
| Forbidden changes | No external API, no publish, no send, no provider test, no fetch |
| Implementation | Generate JP SNS 3, global SNS 3, blog article, SEO, Shorts script, TikTok script, Instagram image idea, Canva instruction, affiliate funnel, CTA, Legal check, Brand QA, Approval Package, publish preparation, and performance analysis template |
| Acceptance | All 16 artifacts are created with Mock labels and stored as internal records |
| Static audit | No external communication and no automatic publish path |
| Build | Owner-permitted only |
| Visual | Package completeness and blocked external actions are visible |
| Commit | After MVP package audit |
| Difficulty | Medium |
| Revenue distance | Very close |
| Dependencies | P0-001, P0-003, P0-004, P0-005, P0-007 |

## 3. P1 Backlog

- Expand Revenue Command Center filters and drilldowns.
- Add AI Board Meeting summary.
- Add content package comparison view.
- Add memory reuse suggestions.
- Add blocked external intent report.
- Add manual actual revenue input with strict labeling.

## 4. P2 Backlog

- Activate additional 20 standby employees in mock mode.
- Add channel-specific package templates.
- Add richer QA scoring.
- Add trend-to-revenue retrospective views.
- Add import/export for non-secret mock data.

## 5. P3 Backlog

- Design provider adapter interfaces.
- Design dry-run connection test model.
- Design budget telemetry interface.
- Design emergency provider kill-switch runbook.
- Do not implement real provider execution until Owner approves a future API phase.

## 6. Build Readiness Gate

Before any implementation commit:

1. `rg "fetch\\s*\\(" src` must remain empty unless a future approved API phase changes the rule.
2. Provider labels must remain unverified/mock/disabled.
3. Production Mode must remain impossible to enable.
4. Approval actions must not execute external operations.
5. Build, lint, and visual audit may run only with Owner permission.

## 7. P0 Reordered Execution Plan

Recommended P0 order:

1. Revenue Data Seeds.
2. AI Workforce MVP15 Registry.
3. Event Ledger Helper.
4. Revenue MVP Package Schema.
5. Revenue MVP Package Generator.
6. Legal / Brand QA.
7. Approval Package View.
8. Revenue Command Center.
9. Aegis Daily Briefing.
10. Performance Recorder.

Employee Score Rules move to P1 after the MVP package workflow and event ledger are stable.

## 8. Mandatory Fields for Every P0 Task

The following checklist applies to P0-001 through P0-010.

| Field | Required value |
| --- | --- |
| localhost confirmation | Required only after Owner permits dev server startup |
| Commit message | Must be defined before commit; no commit without Owner permission |
| rollback method | Revert the task commit or remove the specific added data/component/service only |
| API real communication | None |
| Owner approval | Required when external intent, high-cost intent, approval package, or budget threshold is involved; otherwise not required |
| change scope | Limited to the task files listed in the task |
| post-completion git status | Must be checked before moving to the next task |
| next-task condition | Build/static audit/visual audit pass when Owner permits |

## 9. P0 Scope Controls

- One task must not combine data model, UI, workflow, and dashboard changes unless explicitly listed.
- P0 must prioritize artifact generation over decorative UI.
- Revenue Command Center must display status and separation clearly, but should not become a large redesign.
- CORE_MEDIA and SHORT_TERM_SERVICE must remain separately visible.
- P0 must produce the Revenue MVP package within the first 7 implementation days.
- External API use remains prohibited.

## 10. P1 Deferred Task

### P1-001: Add Employee Score Update Rules

Purpose:

- Define success, improvement, contribution, and promotion calculations.

Reason for P1:

- Employee scoring should use actual MVP package, approval, result, and event data.
- Implementing it before the package workflow risks creating decorative metrics.

Acceptance:

- Scores explain their source and remain mock/internal.
- Scores link to task, workflowRun, campaign, contentAsset, and revenueRecord where available.
