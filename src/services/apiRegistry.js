export const apiGroups = [
  { id: "ai", name: "AI Core", priority: "最優先", purpose: "AI社員の思考・文章・分析・調査を担う", providers: [
      { id: "openai", name: "OpenAI", envKeys: ["OPENAI_API_KEY"], status: "mock-only", role: "文章生成・判断・汎用AI（Phase1-AはMockのみ）", agents: ["AI CEO", "Content Agent", "Reviewer Agent"] },
      { id: "gemini", name: "Gemini", envKeys: ["GEMINI_API_KEY"], status: "configured-unverified", role: "長文・要約・バックアップAI（未接続）", agents: ["Research Agent", "Translator Agent", "Reviewer Agent"] },
      { id: "anthropic", name: "Claude / Anthropic", envKeys: ["ANTHROPIC_API_KEY"], status: "planned", role: "長文レビュー・法務・ブランド・仕様整理", agents: ["AI Legal", "AI Brand", "Reviewer Agent"] },
      { id: "perplexity", name: "Perplexity", envKeys: ["PERPLEXITY_API_KEY"], status: "planned", role: "最新情報・競合・海外調査", agents: ["Research Agent", "Trend Agent", "Opportunity Agent"] },
    ] },
  { id: "google", name: "Google Workspace / Data", priority: "高", purpose: "保存・管理・予定・YouTube・分析の基盤", providers: [
      { id: "google", name: "Google OAuth", envKeys: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"], status: "planned", role: "Google系APIの共通認証", agents: ["AI CTO", "Publisher Agent", "Analytics Agent"] },
      { id: "drive", name: "Google Drive", envKeys: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"], status: "planned", role: "資料・画像・投稿素材の保存", agents: ["Memory Agent", "Creative Agent"] },
      { id: "sheets", name: "Google Sheets", envKeys: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"], status: "planned", role: "売上・投稿・ASP成果の管理", agents: ["AI CFO", "Analytics Agent"] },
      { id: "youtube", name: "YouTube Data API", envKeys: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "YOUTUBE_API_KEY"], status: "planned", role: "動画・Shorts・コメント・分析", agents: ["Video Agent", "Social Agent", "Analytics Agent"] },
    ] },
  { id: "creative", name: "Creative / Video", priority: "高", purpose: "画像・動画・広告素材を作る", providers: [
      { id: "canva", name: "Canva", envKeys: ["CANVA_CLIENT_ID", "CANVA_CLIENT_SECRET"], status: "planned", role: "SNS画像・バナー・広告クリエイティブ", agents: ["Creative Agent", "Brand Agent"] },
      { id: "video", name: "Video API Layer", envKeys: ["VIDEO_API_KEY"], status: "planned", role: "CapCut代替を含む動画生成・編集APIの抽象レイヤー", agents: ["Video Agent", "Publisher Agent"] },
    ] },
  { id: "social", name: "SNS / Publishing", priority: "高", purpose: "投稿・予約・コメント・DM・フォロワー・インサイト管理", providers: [
      { id: "meta", name: "Meta / Instagram / Facebook / Threads", envKeys: ["META_APP_ID", "META_APP_SECRET", "META_ACCESS_TOKEN"], status: "planned", role: "Instagram・Facebook・Threads運用", agents: ["Social Agent", "Community Agent", "Publisher Agent"] },
      { id: "x", name: "X", envKeys: ["X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN"], status: "planned", role: "投稿・DM・フォロワー管理", agents: ["Social Agent", "Growth Agent"] },
      { id: "tiktok", name: "TikTok", envKeys: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"], status: "planned", role: "動画投稿・インサイト・海外拡散", agents: ["Video Agent", "Social Agent"] },
      { id: "linkedin", name: "LinkedIn", envKeys: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"], status: "planned", role: "BtoB・海外向け投稿", agents: ["Global Agent", "Sales Agent"] },
      { id: "pinterest", name: "Pinterest", envKeys: ["PINTEREST_APP_ID", "PINTEREST_APP_SECRET"], status: "planned", role: "画像導線・海外集客", agents: ["Creative Agent", "Global Agent"] },
    ] },
  { id: "affiliate", name: "Affiliate / Revenue", priority: "中〜高", purpose: "国内外ASP・広告収益・成果管理", providers: [
      { id: "a8", name: "A8.net", envKeys: ["A8_ACCOUNT_ID"], status: "planned", role: "国内ASP案件管理", agents: ["Affiliate Agent", "AI CFO"] },
      { id: "amazon", name: "Amazon Associates", envKeys: ["AMAZON_ASSOCIATE_TAG", "AMAZON_ACCESS_KEY"], status: "planned", role: "国内外の商品収益化", agents: ["Affiliate Agent", "Global Agent"] },
      { id: "impact", name: "Impact / CJ / ShareASale Layer", envKeys: ["IMPACT_API_KEY", "CJ_API_KEY", "SHAREASALE_API_KEY"], status: "planned", role: "海外ASP横断管理", agents: ["Global Affiliate Agent", "AI CFO"] },
    ] },
];
export const apiMilestones = [
  { phase: "v5.1", title: "API Expansion Core", goal: "接続状態・AI Orchestrator・AI社員割当を整理する" },
  { phase: "v5.2", title: "Social Revenue Engine", goal: "SNS投稿・コメント・DM・インサイト・予約投稿準備を扱う" },
  { phase: "v5.3", title: "Global Affiliate Engine", goal: "海外ASP・多言語投稿・海外SEOを扱う" },
  { phase: "v5.4", title: "Auto Publish Loop", goal: "承認後投稿・分析・Memory学習をつなぐ" },
];
export function flattenApiProviders() { return apiGroups.flatMap((group) => group.providers.map((provider) => ({ ...provider, groupId: group.id, groupName: group.name, groupPriority: group.priority }))); }
export function buildClientApiReadiness(providers = []) {
  const total = providers.length; const ready = providers.filter((p) => p.configured).length; const next = providers.filter((p) => p.status === "next").length; const planned = providers.filter((p) => p.status === "planned").length;
  return { total, ready, next, planned, score: total ? Math.round((ready / total) * 100) : 0, nextBestAction: "Phase1-AではMock状態のみ確認します。外部接続確認は無効です。" };
}
