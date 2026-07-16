export const apiGroups = [
  {
    id: "ai",
    name: "AI Core",
    priority: "high",
    purpose: "AI社員の文章生成・判断・調査を支えるMock接続候補",
    providers: [
      { id: "openai", name: "OpenAI", credentialPolicy: "server-only", status: "mock-only", role: "文章生成・判断・汎用AI。現在はMockのみ", agents: ["AI CEO", "Content Agent", "Reviewer Agent"] },
      { id: "gemini", name: "Gemini", credentialPolicy: "server-only", status: "planned", role: "長文・要約・バックアップAI。実接続未検証", agents: ["Research Agent", "Translator Agent", "Reviewer Agent"] },
      { id: "anthropic", name: "Claude / Anthropic", credentialPolicy: "server-only", status: "planned", role: "長文レビュー・法務・ブランド・仕様整理", agents: ["AI Legal", "AI Brand", "Reviewer Agent"] },
      { id: "perplexity", name: "Perplexity", credentialPolicy: "server-only", status: "planned", role: "調査情報・競合・海外調査", agents: ["Research Agent", "Trend Agent", "Opportunity Agent"] },
    ],
  },
  {
    id: "google",
    name: "Google Workspace / Data",
    priority: "high",
    purpose: "保存・管理・予定・分析の接続候補",
    providers: [
      { id: "google", name: "Google OAuth", credentialPolicy: "server-only", status: "planned", role: "Google系APIの共通認証候補", agents: ["AI CTO", "Publisher Agent", "Analytics Agent"] },
      { id: "drive", name: "Google Drive", credentialPolicy: "server-only", status: "planned", role: "資料・画像・投稿素材の保存候補", agents: ["Memory Agent", "Creative Agent"] },
      { id: "sheets", name: "Google Sheets", credentialPolicy: "server-only", status: "planned", role: "売上・投稿・ASP成果の管理候補", agents: ["AI CFO", "Analytics Agent"] },
      { id: "youtube", name: "YouTube Data API", credentialPolicy: "server-only", status: "planned", role: "動画・Shorts・コメント・分析候補", agents: ["Video Agent", "Social Agent", "Analytics Agent"] },
    ],
  },
  {
    id: "creative",
    name: "Creative / Video",
    priority: "high",
    purpose: "画像・動画・広告素材を作る接続候補",
    providers: [
      { id: "canva", name: "Canva", credentialPolicy: "server-only", status: "planned", role: "SNS画像・バナー・広告クリエイティブ候補", agents: ["Creative Agent", "Brand Agent"] },
      { id: "video", name: "Video API Layer", credentialPolicy: "server-only", status: "planned", role: "動画生成・編集APIの抽象レイヤー候補", agents: ["Video Agent", "Publisher Agent"] },
    ],
  },
  {
    id: "social",
    name: "SNS / Publishing",
    priority: "high",
    purpose: "投稿・予約・コメント・DM・インサイト管理候補",
    providers: [
      { id: "meta", name: "Meta / Instagram / Facebook / Threads", credentialPolicy: "server-only", status: "planned", role: "Instagram・Facebook・Threads運用候補", agents: ["Social Agent", "Community Agent", "Publisher Agent"] },
      { id: "x", name: "X", credentialPolicy: "server-only", status: "planned", role: "投稿・DM・フォロワー管理候補", agents: ["Social Agent", "Growth Agent"] },
      { id: "tiktok", name: "TikTok", credentialPolicy: "server-only", status: "planned", role: "動画投稿・インサイト候補", agents: ["Video Agent", "Social Agent"] },
      { id: "linkedin", name: "LinkedIn", credentialPolicy: "server-only", status: "planned", role: "BtoB・海外向け投稿候補", agents: ["Global Agent", "Sales Agent"] },
      { id: "pinterest", name: "Pinterest", credentialPolicy: "server-only", status: "planned", role: "画像導線・海外集客候補", agents: ["Creative Agent", "Global Agent"] },
    ],
  },
  {
    id: "affiliate",
    name: "Affiliate / Revenue",
    priority: "medium",
    purpose: "国内外ASP・広告収益・成果管理候補",
    providers: [
      { id: "a8", name: "A8.net", credentialPolicy: "server-only", status: "planned", role: "国内ASP案件管理候補", agents: ["Affiliate Agent", "AI CFO"] },
      { id: "amazon", name: "Amazon Associates", credentialPolicy: "server-only", status: "planned", role: "国内外の商品収益化候補", agents: ["Affiliate Agent", "Global Agent"] },
      { id: "impact", name: "Impact / CJ / ShareASale Layer", credentialPolicy: "server-only", status: "planned", role: "海外ASP横断管理候補", agents: ["Global Affiliate Agent", "AI CFO"] },
    ],
  },
];

export const apiMilestones = [
  { phase: "v5.1", title: "API Expansion Core", goal: "接続状態とAI OrchestratorのMock境界を整理" },
  { phase: "v5.2", title: "Social Revenue Engine", goal: "SNS投稿・コメント・DM・インサイトの準備" },
  { phase: "v5.3", title: "Global Affiliate Engine", goal: "海外ASP・多言語投稿・海外SEOの準備" },
  { phase: "v5.4", title: "Auto Publish Loop", goal: "承認後投稿・分析・Memory学習を接続" },
];

export function flattenApiProviders() {
  return apiGroups.flatMap((group) => group.providers.map((provider) => ({
    ...provider,
    groupId: group.id,
    groupName: group.name,
    groupPriority: group.priority,
  })));
}

export function buildClientApiReadiness(providers = []) {
  const total = providers.length;
  const next = providers.filter((provider) => provider.status === "next").length;
  const planned = providers.filter((provider) => provider.status === "planned").length;
  return {
    total,
    ready: 0,
    next,
    planned,
    score: 0,
    nextBestAction: "現在はMock状態のみ確認します。外部接続確認は無効です。",
  };
}
