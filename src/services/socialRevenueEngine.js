export const socialPlatforms = [
  { id: "instagram", name: "Instagram", category: "Meta", apiStatus: "planned", strengths: ["保存", "画像", "リール", "アフィリエイト導線"], risks: ["誇大表現", "ステマ表記", "画像権利"] },
  { id: "threads", name: "Threads", category: "Meta", apiStatus: "planned", strengths: ["会話", "共感", "短文拡散"], risks: ["炎上", "誤解される表現"] },
  { id: "x", name: "X", category: "SNS", apiStatus: "planned", strengths: ["速報性", "拡散", "短文フック"], risks: ["規約変更", "荒れやすい返信"] },
  { id: "tiktok", name: "TikTok", category: "Video", apiStatus: "planned", strengths: ["動画", "海外拡散", "若年層"], risks: ["動画品質", "著作権音源"] },
  { id: "youtube", name: "YouTube / Shorts", category: "Google", apiStatus: "planned", strengths: ["検索", "広告収益", "長期資産"], risks: ["制作工数", "サムネ品質"] },
  { id: "linkedin", name: "LinkedIn", category: "Global / BtoB", apiStatus: "planned", strengths: ["海外BtoB", "専門性", "採用/営業"], risks: ["硬い表現", "実績不足"] },
  { id: "pinterest", name: "Pinterest", category: "Global / Visual", apiStatus: "planned", strengths: ["画像検索", "海外流入", "ブログ導線"], risks: ["画像品質", "リンク導線"] },
];

export const initialSocialRevenueState = {
  pendingPosts: 6,
  scheduledPosts: 0,
  commentsToReview: 4,
  dmToReview: 2,
  followerGrowth: 0,
  estimatedRevenue: 0,
  algorithmScore: 68,
  safetyScore: 82,
};

export function buildSocialRevenueSummary({
  campaigns = [],
  approvals = [],
  analytics = {},
  socialState = initialSocialRevenueState,
}) {
  const campaignPosts = campaigns.reduce((sum, campaign) => sum + Number(campaign.posts?.length || 0), 0);
  const pendingApprovalPosts = approvals.filter((item) => item.status === "承認待ち").length;
  const revenue = Number(analytics.revenue || 0);
  const monthlyGoal = Number(analytics.monthlyGoal || 300000);
  const remaining = Math.max(monthlyGoal - revenue, 0);

  const postingPower = Math.min(100, 30 + campaignPosts * 4 + pendingApprovalPosts * 3 + socialState.algorithmScore * 0.3);
  const socialReadiness = Math.round(
    Math.min(
      100,
      postingPower * 0.35 +
        socialState.safetyScore * 0.25 +
        Math.min(pendingApprovalPosts, 10) * 4 +
        Math.min(campaignPosts, 20) * 2
    )
  );

  return {
    campaignPosts,
    pendingApprovalPosts,
    revenue,
    monthlyGoal,
    remaining,
    postingPower: Math.round(postingPower),
    socialReadiness,
    pendingPosts: socialState.pendingPosts + campaignPosts,
    scheduledPosts: socialState.scheduledPosts,
    commentsToReview: socialState.commentsToReview,
    dmToReview: socialState.dmToReview,
    followerGrowth: socialState.followerGrowth,
    estimatedRevenue: Math.max(Number(socialState.estimatedRevenue || 0), Math.round((campaignPosts + pendingApprovalPosts) * 850)),
    algorithmScore: socialState.algorithmScore,
    safetyScore: socialState.safetyScore,
    nextBestAction: buildNextSocialAction({ pendingApprovalPosts, campaignPosts, socialState }),
  };
}

function buildNextSocialAction({ pendingApprovalPosts, campaignPosts, socialState }) {
  if (pendingApprovalPosts > 0) return "Approvalで承認待ち投稿を確認し、予約投稿準備へ進める";
  if (campaignPosts === 0) return "Campaignで1テーマから日本向け3本・海外向け3本を生成する";
  if (socialState.commentsToReview > 0 || socialState.dmToReview > 0) return "Mockコメント/DMを確認し、返信案をAIに作らせる";
  return "投稿結果は未接続です。AnalyticsとBusiness MemoryへMock記録する";
}

export function buildSocialTasks(summary) {
  return [
    { id: "publish", title: "予約投稿準備", status: summary.pendingApprovalPosts > 0 ? "承認待ち" : "準備待ち", ownerAction: "承認後に予約投稿へ進める", aiAgents: ["Publisher Agent", "Social Agent", "Legal Agent"] },
    { id: "community", title: "コメント・DM管理", status: summary.commentsToReview + summary.dmToReview > 0 ? "Mock確認必要" : "未接続", ownerAction: "返信前に内容確認", aiAgents: ["Community Agent", "Reviewer Agent", "Brand Agent"] },
    { id: "growth", title: "フォロー・フォロワー分析", status: "Mock分析中", ownerAction: "異常増減のみ確認", aiAgents: ["Growth Agent", "Analytics Agent"] },
    { id: "algorithm", title: "アルゴリズム管理", status: `Mock Score ${summary.algorithmScore}`, ownerAction: "投稿時間・CTA・ハッシュタグを改善", aiAgents: ["Experiment Agent", "Trend Agent", "Social Agent"] },
    { id: "revenue", title: "SNS収益化", status: `Mock ${summary.estimatedRevenue.toLocaleString()}円見込み`, ownerAction: "ASP導線・広告収益を確認", aiAgents: ["Affiliate Agent", "Ads Agent", "AI CFO"] },
  ];
}

export function buildSocialPublisherPlan(campaign) {
  if (!campaign?.posts?.length) return [];
  return campaign.posts.map((post, index) => ({
    id: `${post.id}-publisher`,
    platform: post.platform,
    language: post.language,
    country: post.country,
    title: post.title,
    scheduledAt: index % 2 === 0 ? "08:00" : "20:00",
    status: "承認後に予約投稿準備",
    approvalRequired: true,
    automationLevel: "AI準備90% / 人間承認10%",
  }));
}

export function buildCommunityReplyDraft({ message = "", tone = "丁寧" }) {
  return {
    original: message,
    tone,
    reply: "コメントありがとうございます。内容を確認したうえで、必要に応じて詳しくご案内します。※送信前にオーナー確認が必要です。",
    legalNote: "DM・コメント返信は誤解や規約違反を避けるため、承認後に送信してください。",
  };
}
