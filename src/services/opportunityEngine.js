export const initialOpportunities = [
  {
    id: 1,
    title: "AI家電 × 時短料理",
    program: "Panasonic AI Bistro",
    source: "A8 / Google News",
    expectedRevenue: 5000,
    expectedHours: 0.75,
    trend: 82,
    revenue: 78,
    competition: 58,
    authority: 86,
    compliance: 88,
    evergreen: 76,
    confidence: 72,
    memo: "AI家電・時短・共働き家庭の文脈で投稿化しやすい。",
  },
  {
    id: 2,
    title: "女性向けAIフィットネス",
    program: "FÜRDI",
    source: "A8 / SNS手動観測",
    expectedRevenue: 13670,
    expectedHours: 1.25,
    trend: 74,
    revenue: 92,
    competition: 64,
    authority: 72,
    compliance: 66,
    evergreen: 82,
    confidence: 70,
    memo: "成果報酬が高い。健康・美容表現は薬機法/景表法に注意。",
  },
  {
    id: 3,
    title: "AI副業・業務効率化",
    program: "KEVIRIO / AIツール案件",
    source: "Google Trends / Reddit / GitHub",
    expectedRevenue: 9800,
    expectedHours: 1,
    trend: 88,
    revenue: 84,
    competition: 42,
    authority: 96,
    compliance: 90,
    evergreen: 84,
    confidence: 78,
    memo: "KEVIRIOの世界観と最も相性が高い。競合は多いが独自切り口で差別化可能。",
  },
  {
    id: 4,
    title: "物流AI・貿易DX",
    program: "BtoB導線",
    source: "Opportunity Engine",
    expectedRevenue: 30000,
    expectedHours: 2,
    trend: 56,
    revenue: 88,
    competition: 86,
    authority: 98,
    compliance: 92,
    evergreen: 90,
    confidence: 64,
    memo: "バズりは弱いが、競合が少なく専門性で勝てる。法人向け導線に強い。",
  },
];

export const initialBusinessMemory = [
  {
    id: 1,
    type: "learning",
    title: "KEVIRIO初期学習",
    result: "AI副業・業務効率化はブランド相性が高い",
    scoreImpact: 8,
    createdAt: new Date().toISOString(),
  },
];

export function scoreOpportunity(item = {}) {
  const trend = Number(item.trend || 0);
  const revenue = Number(item.revenue || 0);
  const competition = Number(item.competition || 0);
  const authority = Number(item.authority || 0);
  const compliance = Number(item.compliance || 0);
  const evergreen = Number(item.evergreen || 0);
  const confidence = Number(item.confidence || 0);
  const expectedRevenue = Number(item.expectedRevenue || 0);
  const expectedHours = Math.max(Number(item.expectedHours || 1), 0.25);

  const roiPerHour = Math.round(expectedRevenue / expectedHours);
  const roiScore = Math.min(100, Math.round(roiPerHour / 250));

  const score = Math.round(
    trend * 0.18 +
      revenue * 0.18 +
      competition * 0.12 +
      authority * 0.16 +
      compliance * 0.12 +
      evergreen * 0.1 +
      confidence * 0.06 +
      roiScore * 0.08
  );

  const risk = buildRisk(item);
  const decision = buildDecision(score, risk);
  const reason = buildReason(item, roiPerHour, score);
  const notDo = buildNotDo(item, risk);
  const nextAction = buildNextAction(item, decision);

  return {
    ...item,
    score: Math.max(0, Math.min(100, score)),
    roiPerHour,
    roiScore,
    risk,
    decision,
    reason,
    notDo,
    nextAction,
  };
}

export function analyzeOpportunities(items = []) {
  return items.map(scoreOpportunity).sort((a, b) => b.score - a.score);
}

function buildRisk(item) {
  const risks = [];
  if (Number(item.compliance || 0) < 70) risks.push("法務・広告表現");
  if (Number(item.confidence || 0) < 65) risks.push("データ不足");
  if (Number(item.competition || 0) < 45) risks.push("競合過多");
  if (!item.program) risks.push("収益導線未設定");
  return risks.length ? risks.join(" / ") : "低";
}

function buildDecision(score, risk) {
  if (risk.includes("法務") && score < 82) return "要確認";
  if (score >= 84) return "最優先";
  if (score >= 74) return "実行候補";
  if (score >= 62) return "小さく検証";
  return "後回し";
}

function buildReason(item, roiPerHour, score) {
  const reasons = [];
  if (Number(item.trend || 0) >= 80) reasons.push("トレンドが強い");
  if (Number(item.revenue || 0) >= 85) reasons.push("収益性が高い");
  if (Number(item.authority || 0) >= 85) reasons.push("KEVIRIOとの相性が高い");
  if (Number(item.competition || 0) >= 80) reasons.push("競合余地がある");
  if (roiPerHour >= 10000) reasons.push(`ROIが高い（${roiPerHour.toLocaleString()}円/h）`);
  if (Number(item.compliance || 0) < 70) reasons.push("コンプライアンス確認が必要");
  return reasons.join(" / ") || `総合スコア${score}`;
}

function buildNotDo(item, risk) {
  if (risk.includes("法務")) return "断定表現・効果保証・ビフォーアフター強調は避ける";
  if (risk.includes("データ不足")) return "いきなり大型展開せず、1投稿テストに留める";
  if (risk.includes("競合過多")) return "一般論のAI副業投稿は避け、独自体験に寄せる";
  return "外部投稿・契約・支払いはオーナー承認前に実行しない";
}

function buildNextAction(item, decision) {
  if (decision === "最優先") return "Workflow化してContent下書きとApproval確認へ進める";
  if (decision === "実行候補") return "Content Studioで小さく投稿案を作る";
  if (decision === "小さく検証") return "1本だけテスト投稿し、反応をMemoryへ記録する";
  return "監視対象として保留";
}

export function buildRevenueSummary(opportunities = [], analytics = {}, memory = []) {
  const ranked = analyzeOpportunities(opportunities);
  const top3 = ranked.slice(0, 3);
  const expectedTodayRevenue = top3.reduce((sum, item) => sum + Number(item.expectedRevenue || 0), 0);
  const currentRevenue = Number(analytics.revenue || 0);
  const monthlyGoal = Number(analytics.monthlyGoal || 300000);
  const remaining = Math.max(monthlyGoal - currentRevenue, 0);
  const avgRoi = top3.length
    ? Math.round(top3.reduce((sum, item) => sum + item.roiPerHour, 0) / top3.length)
    : 0;

  return {
    ranked,
    top3,
    expectedTodayRevenue,
    currentRevenue,
    monthlyGoal,
    remaining,
    avgRoi,
    memoryCount: memory.length,
    ceoMessage: buildCeoMessage(top3, remaining),
  };
}

function buildCeoMessage(top3, remaining) {
  if (!top3.length) return "Opportunityが未登録です。まず候補を追加してください。";
  const top = top3[0];
  return `推奨は「${top.title}」です。理由：${top.reason}。月間目標まで残り${remaining.toLocaleString()}円です。最終決裁をお願いします。`;
}

export function buildBoardOpinions(opportunity) {
  if (!opportunity) return [];

  return [
    {
      role: "AI CEO",
      opinion: `最優先候補は「${opportunity.title}」。ただし最終決裁はオーナーです。`,
    },
    {
      role: "AI CFO",
      opinion: `期待売上は${Number(opportunity.expectedRevenue || 0).toLocaleString()}円、ROIは${opportunity.roiPerHour.toLocaleString()}円/hです。`,
    },
    {
      role: "AI CMO",
      opinion: `訴求軸は「${opportunity.memo || "課題解決"}」が有効です。`,
    },
    {
      role: "AI Legal",
      opinion: `リスクは「${opportunity.risk}」。公開前にApproval Center確認が必要です。`,
    },
    {
      role: "AI Brand",
      opinion: `Authority ${opportunity.authority}点。KEVIRIOの長期価値と整合性を確認してください。`,
    },
  ];
}
