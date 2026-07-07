export const trendSources = [
  {
    id: "google-trends",
    name: "Google Trends",
    type: "free-manual",
    status: "manual",
    note: "無料版では急上昇キーワードや検索傾向を手動登録。将来API/外部データに差し替え可能。",
  },
  {
    id: "google-news",
    name: "Google News",
    type: "free-manual",
    status: "manual",
    note: "ニュースで話題化しているテーマを手動登録。鮮度確認が重要。",
  },
  {
    id: "reddit",
    name: "Reddit",
    type: "free-manual",
    status: "manual",
    note: "海外で伸びている話題を確認。日本市場とのズレは要確認。",
  },
  {
    id: "github-trending",
    name: "GitHub Trending",
    type: "free-manual",
    status: "manual",
    note: "AI・開発・SaaS系の急上昇テーマに強い。",
  },
  {
    id: "a8",
    name: "A8.net",
    type: "manual",
    status: "active",
    note: "成果報酬・ジャンル・承認条件を手動登録して収益性評価に使う。",
  },
];

export const initialTrendItems = [
  {
    id: 1,
    theme: "AI家電・時短料理",
    source: "Google News / A8",
    relatedProgram: "Panasonic AI Bistro",
    trend: 82,
    revenue: 78,
    competition: 58,
    authority: 86,
    compliance: 88,
    evergreen: 76,
    confidence: 72,
    status: "watch",
    memo: "AI家電、時短、家事効率化の文脈でKEVIRIOの世界観に接続しやすい。",
  },
  {
    id: 2,
    theme: "AIフィットネス・女性向け健康管理",
    source: "A8 / SNS手動観測",
    relatedProgram: "FÜRDI",
    trend: 74,
    revenue: 92,
    competition: 64,
    authority: 72,
    compliance: 66,
    evergreen: 82,
    confidence: 70,
    status: "go",
    memo: "成果報酬が高い。健康・美容表現は薬機法/景表法に注意。",
  },
  {
    id: 3,
    theme: "AI副業・業務効率化",
    source: "Google Trends / Reddit / GitHub",
    relatedProgram: "KEVIRIO / AIツール案件",
    trend: 88,
    revenue: 84,
    competition: 42,
    authority: 96,
    compliance: 90,
    evergreen: 84,
    confidence: 78,
    status: "go",
    memo: "健さんの事業テーマと最も相性が高い。競合は多いが独自切り口を作れる。",
  },
  {
    id: 4,
    theme: "物流AI・貿易DX",
    source: "Opportunity Engine",
    relatedProgram: "将来BtoB導線",
    trend: 56,
    revenue: 88,
    competition: 86,
    authority: 98,
    compliance: 92,
    evergreen: 90,
    confidence: 64,
    status: "opportunity",
    memo: "バズりは弱いが、競合が少なく専門性で勝てる。将来法人向けに強い。",
  },
];

export function calculateOpportunityScore(item) {
  const trend = Number(item.trend || 0);
  const revenue = Number(item.revenue || 0);
  const competition = Number(item.competition || 0);
  const authority = Number(item.authority || 0);
  const compliance = Number(item.compliance || 0);
  const evergreen = Number(item.evergreen || 0);

  const score = Math.round(
    trend * 0.25 +
      revenue * 0.25 +
      competition * 0.15 +
      authority * 0.15 +
      compliance * 0.1 +
      evergreen * 0.1
  );

  return Math.max(0, Math.min(100, score));
}

export function analyzeTrends(items = []) {
  return items
    .map((item) => {
      const score = calculateOpportunityScore(item);
      return {
        ...item,
        score,
        decision: buildDecision(score, item),
        reason: buildReason(item, score),
        nextAction: buildNextAction(item, score),
      };
    })
    .sort((a, b) => b.score - a.score);
}

function buildDecision(score, item) {
  if (Number(item.compliance || 0) < 60) return "要確認";
  if (score >= 82) return "GO";
  if (score >= 70) return "検証";
  if (score >= 58) return "観察";
  return "後回し";
}

function buildReason(item, score) {
  const reasons = [];
  if (Number(item.trend || 0) >= 80) reasons.push("トレンドが強い");
  if (Number(item.revenue || 0) >= 80) reasons.push("収益性が高い");
  if (Number(item.competition || 0) >= 80) reasons.push("競合余地がある");
  if (Number(item.authority || 0) >= 85) reasons.push("健さん/KEVIRIOとの相性が高い");
  if (Number(item.compliance || 0) < 70) reasons.push("コンプライアンス要確認");
  if (Number(item.evergreen || 0) >= 80) reasons.push("長期資産化しやすい");
  return reasons.join(" / ") || `総合スコア${score}`;
}

function buildNextAction(item, score) {
  if (Number(item.compliance || 0) < 60) {
    return "まず表現リスクを確認し、安全な訴求に修正してください。";
  }
  if (score >= 82) {
    return "今日中にContent Studioで投稿・記事の下書きを作成してください。";
  }
  if (score >= 70) {
    return "小さく投稿テストし、反応を見てから本格展開してください。";
  }
  return "今は監視対象。より収益性の高いテーマを優先してください。";
}

export function buildTrendCEOMessage(items = []) {
  const ranked = analyzeTrends(items);
  const top = ranked[0];

  if (!top) {
    return "Trend Intelligenceにテーマがありません。まず候補を登録してください。";
  }

  return `AI Trend Intelligenceの分析結果です。最優先候補は「${top.theme}」です。理由：${top.reason}。最終決裁をお願いします。`;
}
