export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const providers = [
    {
      id: "openai",
      name: "OpenAI",
      configured: Boolean(process.env.OPENAI_API_KEY),
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      role: "推論・文章生成・実務支援",
      priority: "primary",
    },
    {
      id: "gemini",
      name: "Gemini",
      configured: Boolean(process.env.GEMINI_API_KEY),
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      role: "長文・無料枠・バックアップAI",
      priority: "secondary",
    },
    {
      id: "anthropic",
      name: "Claude / Anthropic",
      configured: Boolean(process.env.ANTHROPIC_API_KEY),
      model: process.env.ANTHROPIC_MODEL || "未設定",
      role: "企画・仕様書・長文レビュー",
      priority: "future",
    },
    {
      id: "perplexity",
      name: "Perplexity",
      configured: Boolean(process.env.PERPLEXITY_API_KEY),
      model: process.env.PERPLEXITY_MODEL || "未設定",
      role: "検索・最新情報・競合調査",
      priority: "future",
    },
  ];

  const readyCount = providers.filter((provider) => provider.configured).length;
  const automationReady =
    providers.some((provider) => provider.id === "openai" && provider.configured) &&
    providers.some((provider) => provider.id === "gemini" && provider.configured);

  return res.status(200).json({
    ok: true,
    generatedAt: new Date().toISOString(),
    automationReady,
    readyCount,
    providers,
    principles: [
      "APIキーは画面に表示しない",
      "AIは分析・提案・下書きまで",
      "最終決裁は必ずオーナー",
      "外部送信・投稿・契約・決済は自動実行しない",
    ],
  });
}
