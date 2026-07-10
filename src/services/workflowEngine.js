import { buildApprovalFromPayload, buildContentFromPayload, buildMissionFromPayload } from "./connectionEngine";
import { canExecute, createPhase1Context, EXECUTION_MODES } from "./safetyEngine";
export const workflowTemplates = [
  {
    id: "trend-to-revenue",
    name: "Trend → Revenue Flow",
    description: "トレンド候補をWork・Mission・Content・Approvalへ流す",
    steps: ["Trend確認", "Work登録", "Mission生成", "Content下書き", "Approval承認待ち", "AI CEO報告"],
  },
  {
    id: "work-to-approval",
    name: "Work → Approval Flow",
    description: "登録済み仕事を承認フローまで進める",
    steps: ["Work確認", "ROI確認", "Mission生成", "Content下書き", "Approval承認待ち"],
  },
];

export function buildWorkflowFromTrend(item) {
  const score = Number(item.score || 0);
  const expectedRevenue = Math.max(1000, Number(item.revenue || 50) * 100);
  const riskLevel = Number(item.compliance || 0) < 70 ? "要確認" : "通常";

  return {
    id: Date.now(),
    source: "Trend Intelligence",
    title: item.theme,
    relatedProgram: item.relatedProgram || "KEVIRIO",
    score,
    expectedRevenue,
    riskLevel,
    confidence: item.confidence || 60,
    ownerDecision: "承認待ち",
    status: "pending-owner",
    reason: item.reason || "Trend Intelligenceから生成",
    steps: [
      { id: 1, label: "Trend確認", status: "done" },
      { id: 2, label: "Work登録", status: "ready" },
      { id: 3, label: "Mission生成", status: "ready" },
      { id: 4, label: "Content下書き", status: "ready" },
      { id: 5, label: "Approval承認待ち", status: "ready" },
      { id: 6, label: "AI CEO報告", status: "ready" },
    ],
    memo: item.memo || "",
  };
}

export function buildWorkflowFromWork(item) {
  return {
    id: Date.now(),
    source: "Work Engine",
    title: item.title,
    relatedProgram: item.source || "KEVIRIO",
    score: item.score || 70,
    expectedRevenue: item.reward || 1000,
    riskLevel: Number(item.complianceRisk || 1) >= 3 ? "要確認" : "通常",
    confidence: 70,
    ownerDecision: "承認待ち",
    status: "pending-owner",
    reason: item.reason || "Work Engineから生成",
    steps: [
      { id: 1, label: "Work確認", status: "done" },
      { id: 2, label: "Mission生成", status: "ready" },
      { id: 3, label: "Content下書き", status: "ready" },
      { id: 4, label: "Approval承認待ち", status: "ready" },
      { id: 5, label: "AI CEO報告", status: "ready" },
    ],
    memo: item.description || "",
  };
}

export function executeWorkflow({
  workflow,
  setMissionTasks,
  setDraft,
  setApprovals,
  setNotifications,
  context,
}) {
  try {
    if (!context || typeof context !== "object" || Array.isArray(context)) {
      return {
        ok: false,
        allowed: false,
        blocked: true,
        reason: "Workflow execution context is required.",
        reasonCode: "missing_context",
      };
    }

    const guard = canExecute(createPhase1Context({
      ...context,
      executionMode: context.executionMode || EXECUTION_MODES.DEVELOPMENT,
      actionType: "workflow-execute",
      isExternalRequest: false,
      mockOnly: true,
      workflowType: context.workflowType || workflow?.templateId || workflow?.type || "workflow-execute",
      workflowId: workflow?.id || context.workflowId || null,
    }));

    if (!guard.allowed) {
      return {
        ok: false,
        allowed: false,
        blocked: true,
        reason: guard.reason,
        reasonCode: guard.reasonCode,
        approvalRequired: guard.approvalRequired,
        approvalReason: guard.approvalReason,
      };
    }
  } catch {
    return {
      ok: false,
      allowed: false,
      blocked: true,
      reason: "Workflow Safety Guard failed closed.",
      reasonCode: "guard_error",
    };
  }

  const payload = {
    title: workflow.title,
    program: workflow.relatedProgram,
    expectedRevenue: workflow.expectedRevenue,
    risk: workflow.riskLevel,
    confidence: workflow.confidence,
    score: workflow.score,
    reason: workflow.reason,
    sourceType: workflow.source || "Workflow",
  };
  const missionValue = Math.round(Number(workflow.expectedRevenue || 1000) / 3);

  const missionTasks = [
    {
      id: Date.now() + 1,
      title: `${workflow.title}｜構成を作る`,
      category: "Workflow",
      priority: "high",
      status: "todo",
      due: "今日",
      value: missionValue,
      note: `Workflow Automationから生成 / 最終決裁はオーナー`,
    },
    {
      id: Date.now() + 2,
      title: `${workflow.title}｜投稿・記事を作る`,
      category: "Content",
      priority: "high",
      status: "todo",
      due: "今日",
      value: missionValue,
      note: `Content Studioへ連携予定`,
    },
    {
      id: Date.now() + 3,
      title: `${workflow.title}｜Approvalで確認する`,
      category: "Approval",
      priority: "medium",
      status: "todo",
      due: "今日",
      value: missionValue,
      note: `法務・ブランド・表現チェック`,
    },
  ];

  const contentDraft = {
    title: `${workflow.title}｜KEVIRIO Workflow下書き`,
    channel: "Blog / Instagram / Threads / X",
    asp: workflow.relatedProgram,
    value: workflow.expectedRevenue,
    body: `テーマ：${workflow.title}
関連案件：${workflow.relatedProgram}
Expected Revenue：${Number(workflow.expectedRevenue || 0).toLocaleString()}円
Confidence：${workflow.confidence}%
Risk：${workflow.riskLevel}

【事実】
この下書きはWorkflow Automationから生成されました。

【推測】
${workflow.reason}

【提案】
1. 読者の悩みを明確にする
2. KEVIRIO視点で解決策を提示する
3. 関連案件へ自然に導線を作る
4. 誇大表現を避ける
5. Approval Centerで最終確認する

【最終決裁】
公開・投稿・外部送信はオーナー承認後に行うこと。
`,
  };

  const approval = {
    id: Date.now() + 4,
    title: workflow.title,
    channel: "Workflow Generated",
    asp: workflow.relatedProgram,
    time: "今日",
    status: "承認待ち",
    value: workflow.expectedRevenue,
    counted: false,
    risk: workflow.riskLevel,
  };

  const connectedMissions = buildMissionFromPayload(payload);
  const connectedDraft = buildContentFromPayload(payload);
  const connectedApproval = buildApprovalFromPayload(payload);

  setMissionTasks((prev) => [...connectedMissions, ...(Array.isArray(prev) ? prev : [])]);
  setDraft(connectedDraft);
  setApprovals((prev) => [connectedApproval, ...(Array.isArray(prev) ? prev : [])]);
  setNotifications?.((prev) => [
    {
      id: Date.now() + 5,
      title: "Workflow Automation実行完了",
      body: `${workflow.title}をMission・Content・Approvalへ連携しました。最終決裁待ちです。`,
      read: false,
    },
    ...(Array.isArray(prev) ? prev : []),
  ]);

  return {
    ...workflow,
    status: "owner-review",
    ownerDecision: "最終決裁待ち",
    steps: (Array.isArray(workflow.steps) ? workflow.steps : []).map((step) => ({ ...step, status: "done" })),
    executedAt: new Date().toISOString(),
  };
}

export function approveWorkflow(workflow) {
  return {
    ...workflow,
    status: "approved-by-owner",
    ownerDecision: "承認",
    decidedAt: new Date().toISOString(),
  };
}

export function rejectWorkflow(workflow) {
  return {
    ...workflow,
    status: "rejected-by-owner",
    ownerDecision: "却下",
    decidedAt: new Date().toISOString(),
  };
}

export function holdWorkflow(workflow) {
  return {
    ...workflow,
    status: "on-hold",
    ownerDecision: "保留",
    decidedAt: new Date().toISOString(),
  };
}

// Legacy compatibility for WorkCommand.jsx
// These functions existed before Workflow Automation and are still imported by Work Command.
// Keep them exported so older modules continue to build.

export function analyzeOpportunity(opportunity = {}) {
  const reward = Number(opportunity.reward || opportunity.value || opportunity.expectedRevenue || 0);
  const estimatedHours = Number(opportunity.estimatedHours || opportunity.hours || 1);
  const urgency = Number(opportunity.urgency || 3);
  const strategicFit = Number(opportunity.strategicFit || opportunity.fit || 4);
  const risk = Number(opportunity.risk || opportunity.complianceRisk || 2);

  const roiPerHour = Math.round(reward / Math.max(estimatedHours, 0.25));
  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        Math.min(35, reward / 400) +
          urgency * 10 +
          strategicFit * 10 -
          risk * 6 +
          Math.min(20, roiPerHour / 1000)
      )
    )
  );

  return {
    ...opportunity,
    score,
    roiPerHour,
    decision: score >= 80 ? "優先実行" : score >= 60 ? "検証" : "後回し",
    reason:
      score >= 80
        ? "ROIと戦略相性が高いため優先候補です。"
        : score >= 60
          ? "一定の収益性があります。小さく検証してください。"
          : "現時点では優先度が低めです。",
    riskComment:
      risk >= 4
        ? "法務・ブランド・広告表現の確認が必要です。"
        : risk >= 3
          ? "表現チェックを挟んで進めてください。"
          : "大きなリスクは低めです。",
  };
}

export function buildContentFromAnalysis(analysis = {}) {
  const title = analysis.title || analysis.name || analysis.theme || "KEVIRIO案件";
  const value = Number(analysis.reward || analysis.value || analysis.expectedRevenue || 1000);

  return {
    title: `${title}｜KEVIRIO下書き`,
    channel: analysis.channel || "Blog / Instagram / Threads",
    asp: analysis.source || analysis.asp || "KEVIRIO",
    value,
    body: `テーマ：${title}
想定価値：${value.toLocaleString()}円
Score：${analysis.score || "-"}
ROI：${analysis.roiPerHour ? analysis.roiPerHour.toLocaleString() + "円/h" : "要確認"}

【事実】
この下書きはWork Command / Workflow Engineから生成されました。

【推測】
${analysis.reason || "収益化につながる可能性があります。"}

【提案】
1. 読者の課題を明確にする
2. 解決策を提示する
3. 収益導線を自然に設計する
4. 誇大表現を避ける
5. Approval Centerで確認する

【リスク】
${analysis.riskComment || "公開前に表現・法務・ブランド確認が必要です。"}

【最終決裁】
公開・投稿・契約・支払いはオーナー承認後に行うこと。
`,
  };
}
