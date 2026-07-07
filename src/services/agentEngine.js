
export function buildAgentBoardReport({
  workItems = [],
  missionTasks = [],
  approvals = [],
  analytics = {},
  pipelineRuns = [],
}) {
  const revenue = Number(analytics.revenue || 0);
  const monthlyGoal = Number(analytics.monthlyGoal || 300000);
  const remaining = Math.max(monthlyGoal - revenue, 0);
  const pendingApprovals = approvals.filter((item) => item.status === "承認待ち").length;
  const openMissions = missionTasks.filter((item) => item.status !== "done").length;
  const highValueWork = workItems
    .filter((item) => Number(item.reward || item.expectedRevenue || 0) > 0)
    .sort((a, b) => Number(b.reward || b.expectedRevenue || 0) - Number(a.reward || a.expectedRevenue || 0))[0];

  const riskLevel =
    pendingApprovals >= 3 || openMissions >= 8
      ? "高"
      : pendingApprovals >= 1 || openMissions >= 4
        ? "中"
        : "低";

  const board = [
    {
      role: "AI CEO",
      stance: "総合判断",
      opinion:
        highValueWork
          ? `最初の検討候補は「${highValueWork.title || highValueWork.name}」です。ただし実行はオーナー決裁後です。`
          : "候補案件が不足しています。Opportunity EngineまたはWork Engineで候補を追加してください。",
      confidence: highValueWork ? 78 : 55,
    },
    {
      role: "AI CFO",
      stance: "収益・ROI",
      opinion: `現在売上は${revenue.toLocaleString()}円、月間目標まで残り${remaining.toLocaleString()}円です。売上直結タスクを優先してください。`,
      confidence: 82,
    },
    {
      role: "AI CMO",
      stance: "集客・投稿",
      opinion: "Trend IntelligenceとOpportunity Engineの上位テーマから、1投稿・1記事を小さく検証するのが安全です。",
      confidence: 74,
    },
    {
      role: "AI Legal",
      stance: "法務・コンプライアンス",
      opinion: pendingApprovals > 0
        ? `承認待ちが${pendingApprovals}件あります。公開前に景表法・薬機法・ASP規約・ブランド表現を確認してください。`
        : "現時点で承認待ちは少なめです。ただし外部公開前チェックは必須です。",
      confidence: 88,
    },
    {
      role: "AI Brand",
      stance: "長期価値",
      opinion: "短期売上だけでなく、KEVIRIOの世界観に合うテーマを優先してください。物流AI・AI業務効率化は資産化しやすい候補です。",
      confidence: 76,
    },
    {
      role: "Trend AI",
      stance: "市場変化",
      opinion: "無料版では手動観測中心です。Google Trends / News / Reddit / GitHub / A8の取得元と日時を残してください。",
      confidence: 68,
    },
  ];

  return {
    board,
    riskLevel,
    remaining,
    pendingApprovals,
    openMissions,
    pipelineCount: pipelineRuns.length,
    finalDecision: "オーナー最終決裁待ち",
    nextBestAction:
      pendingApprovals > 0
        ? "Approval Centerで承認待ちを処理する"
        : highValueWork
          ? `「${highValueWork.title || highValueWork.name}」をWorkflow化する`
          : "Opportunity Engineで収益機会を追加する",
  };
}

export function buildGovernanceChecklist() {
  return [
    "AIは分析・提案・予測まで",
    "投稿・契約・送信・決済は自動実行しない",
    "最終決裁は必ずオーナー",
    "事実・推測・意見・要確認を分ける",
    "ROIだけでなく法務・ブランド・長期価値も確認する",
    "理由のない提案は禁止",
  ];
}
