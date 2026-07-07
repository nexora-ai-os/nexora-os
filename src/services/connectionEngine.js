export function buildConnectedPayload(sourceType, item = {}) {
  const title = item.title || item.theme || "KEVIRIO案件";
  const program = item.program || item.relatedProgram || item.asp || "KEVIRIO";
  const expectedRevenue = Number(item.expectedRevenue || item.value || item.reward || item.revenue || 1000);
  const roiPerHour = Number(item.roiPerHour || item.roi || 0);
  const score = Number(item.score || item.opportunityScore || 70);
  const risk = item.risk || item.riskLevel || item.riskComment || "通常";
  const reason = item.reason || item.memo || "KEVIRIO内の分析から生成";
  const confidence = Number(item.confidence || 70);

  return {
    id: Date.now(),
    sourceType,
    title,
    program,
    expectedRevenue,
    roiPerHour,
    score,
    risk,
    reason,
    confidence,
    createdAt: new Date().toISOString(),
    ownerDecision: "承認待ち",
  };
}

export function buildMissionFromPayload(payload) {
  const baseValue = Math.max(1000, Math.round(Number(payload.expectedRevenue || 1000) / 3));

  return [
    {
      id: Date.now() + 11,
      title: `${payload.title}｜構成を作る`,
      category: "Revenue",
      priority: "high",
      status: "todo",
      due: "今日",
      value: baseValue,
      note: `${payload.sourceType}から自動連携。最終決裁はオーナー。`,
    },
    {
      id: Date.now() + 12,
      title: `${payload.title}｜投稿・記事を作る`,
      category: "Content",
      priority: "high",
      status: "todo",
      due: "今日",
      value: baseValue,
      note: `Content Studioで下書き作成。`,
    },
    {
      id: Date.now() + 13,
      title: `${payload.title}｜承認チェック`,
      category: "Approval",
      priority: payload.risk === "低" ? "medium" : "high",
      status: "todo",
      due: "今日",
      value: baseValue,
      note: `法務・ブランド・ASP規約を確認。`,
    },
  ];
}

export function buildContentFromPayload(payload) {
  return {
    title: `${payload.title}｜収益化コンテンツ案`,
    channel: "Blog / Instagram / Threads / X",
    asp: payload.program,
    value: payload.expectedRevenue,
    body: `テーマ：${payload.title}
関連案件：${payload.program}
想定売上：${Number(payload.expectedRevenue || 0).toLocaleString()}円
ROI：${payload.roiPerHour ? Number(payload.roiPerHour).toLocaleString() + "円/h" : "要確認"}
Score：${payload.score}
Confidence：${payload.confidence}%
Risk：${payload.risk}

【事実】
この下書きはKEVIRIO Connection Coreから生成されました。

【推測】
${payload.reason}

【意見】
収益化導線を意識しつつ、誇大表現を避けて小さく検証してください。

【やらないこと】
外部投稿・契約・送信・決済はオーナー承認前に実行しない。

【要確認】
Approval Centerで法務・ブランド・広告表現・ASP規約を確認してください。

【最終決裁】
公開・投稿・送信はオーナー承認後に行うこと。
`,
  };
}

export function buildApprovalFromPayload(payload) {
  return {
    id: Date.now() + 21,
    title: payload.title,
    channel: "Connection Core",
    asp: payload.program,
    time: "今日",
    status: "承認待ち",
    value: payload.expectedRevenue,
    counted: false,
    risk: payload.risk,
    score: payload.score,
    confidence: payload.confidence,
  };
}

export function buildAnalyticsEntryFromApproval(approval = {}) {
  return {
    id: Date.now(),
    title: approval.title || "承認済み案件",
    type: "approval",
    revenue: Number(approval.value || 0),
    roi: Number(approval.value || 0),
    source: approval.asp || approval.channel || "Approval Center",
    createdAt: new Date().toISOString(),
  };
}

export function buildCEOBriefFromConnection({ approvals = [], missionTasks = [], workflows = [], analytics = {} }) {
  const pendingApprovals = approvals.filter((item) => item.status === "承認待ち").length;
  const openTasks = missionTasks.filter((item) => item.status !== "done").length;
  const workflowCount = workflows.length;
  const revenue = Number(analytics.revenue || 0);
  const monthlyGoal = Number(analytics.monthlyGoal || 300000);
  const remaining = Math.max(monthlyGoal - revenue, 0);

  return {
    pendingApprovals,
    openTasks,
    workflowCount,
    revenue,
    monthlyGoal,
    remaining,
    message: `承認待ち${pendingApprovals}件、未完了タスク${openTasks}件、Workflow${workflowCount}件。月間目標まで残り${remaining.toLocaleString()}円です。`,
  };
}
