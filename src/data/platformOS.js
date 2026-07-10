export const initialAgents = [
  {
    id: "sales-ai",
    name: "売上分析AI",
    role: "Revenue Analyst",
    department: "Revenue",
    specialty: "売上予測・利益分析",
    skills: ["予測", "利益管理", "KPI分析"],
    status: "mock-running",
    taskCount: 4,
    api: ["OpenAI", "Google Analytics"],
    priority: "high",
    description: "Mockデータの売上、利益、案件進捗から次の打ち手を整理します。",
    icon: "📈",
  },
  {
    id: "trend-ai",
    name: "トレンド分析AI",
    role: "Trend Scout",
    department: "Market",
    specialty: "日本/海外トレンド分析",
    skills: ["トレンド観測", "比較分析", "伸び筋判断"],
    status: "mock-running",
    taskCount: 3,
    api: ["Perplexity", "Google"],
    priority: "high",
    description: "Mockデータで日本・海外の流行と伸び代を比較して優先順位を出します。",
    icon: "🧭",
  },
  {
    id: "content-ai",
    name: "文書作成AI",
    role: "Content Operator",
    department: "Content",
    specialty: "提案文・投稿文・報告書",
    skills: ["文章作成", "要約", "提案文生成"],
    status: "standby",
    taskCount: 2,
    api: ["OpenAI", "Claude"],
    priority: "medium",
    description: "承認前の案を整え、説明文と提案文を生成します。",
    icon: "✍️",
  },
  {
    id: "design-ai",
    name: "デザインAI",
    role: "Creative Partner",
    department: "Design",
    specialty: "Canva・素材案",
    skills: ["画像案", "バナー", "SNS素材"],
    status: "pending",
    taskCount: 1,
    api: ["Canva"],
    priority: "medium",
    description: "広告素材や投稿画像の方向性を整理します。",
    icon: "🎨",
  },
];

export const initialTasks = [
  {
    id: "task-1",
    title: "海外ASP案件の比較整理",
    category: "Revenue",
    priority: "high",
    status: "todo",
    due: "今日",
    value: 260000,
    note: "収益性と承認率を比較します。",
  },
  {
    id: "task-2",
    title: "日本/海外トレンドの要約",
    category: "Market",
    priority: "high",
    status: "in-progress",
    due: "今日",
    value: 180000,
    note: "伸びそうなテーマを整理します。",
  },
  {
    id: "task-3",
    title: "承認待ち投稿案のレビュー",
    category: "Governance",
    priority: "medium",
    status: "todo",
    due: "今晩",
    value: 140000,
    note: "ブランドと法務の観点で確認します。",
  },
];

export const initialIntegrations = [
  { id: "openai", name: "OpenAI API", status: "mock-only", category: "AI", description: "Phase1-Aでは実通信禁止" },
  { id: "claude", name: "Claude API", status: "planned", category: "AI", description: "長文レビュー・品質保証" },
  { id: "perplexity", name: "Perplexity API", status: "planned", category: "Research", description: "最新情報・競合調査" },
  { id: "google", name: "Google Workspace", status: "configured-unverified", category: "Workspace", description: "Drive / Sheets / Gmail / Calendar" },
  { id: "canva", name: "Canva API", status: "planned", category: "Design", description: "素材・バナー作成" },
  { id: "sns", name: "SNS API", status: "disabled", category: "Social", description: "投稿・コメント・DM準備" },
  { id: "asp", name: "ASP API", status: "planned", category: "Revenue", description: "案件・成果分析" },
  { id: "mcp", name: "MCP Server", status: "planned", category: "Infrastructure", description: "外部ツール接続基盤" },
];

export const initialWorkflows = [
  {
    id: "wf-1",
    title: "案件→調査→提案→承認",
    summary: "営業AIがMock案件を整理し、調査AIが情報整理し、文書AIが提案案を作成します。",
    status: "mock",
  },
  {
    id: "wf-2",
    title: "トレンド→投稿案→承認",
    summary: "トレンド分析AIがMockの伸び筋を見て、投稿案を作成します。",
    status: "planned",
  },
];

export const initialNotifications = [
  { id: "n1", title: "Mock承認待ち案件があります", type: "approval", read: false },
  { id: "n2", title: "トレンド分析AIがMockデータの伸び筋を整理しました", type: "insight", read: false },
  { id: "n3", title: "Mock状態を確認しました。外部接続テストは未実施です。", type: "system", read: true },
];

export const initialApiStatuses = [
  { id: "api-1", name: "OpenAI", status: "mock-only", usage: "実通信禁止" },
  { id: "api-2", name: "Claude", status: "planned", usage: "未接続" },
  { id: "api-3", name: "Perplexity", status: "planned", usage: "未接続" },
  { id: "api-4", name: "Google", status: "configured-unverified", usage: "未検証" },
];

export const initialDepartments = [
  { id: "revenue", name: "Revenue", color: "#4f8cff" },
  { id: "market", name: "Market", color: "#7b61ff" },
  { id: "content", name: "Content", color: "#2f9d7b" },
  { id: "design", name: "Design", color: "#ff7a3d" },
];

export const initialWorkflowRuns = [
  { id: "run-1", workflowId: "wf-1", status: "mock", cost: 0.001, note: "Development Modeでモック実行" },
];

export const initialProposals = [
  { id: "proposal-1", title: "海外向け提案案", status: "draft", value: 320000 },
];

export const initialRevenueForecasts = [
  { id: "forecast-1", month: "2026-07", projectedRevenue: 420000, projectedProfit: 174000, confidence: 0.82 },
];

export const initialApiProviders = [
  { id: "mock-local", name: "Local Mock", status: "mock-only", cost: 0.0, mode: "development" },
];

export const initialApiUsageLogs = [
  { id: "usage-1", provider: "mock-local", cost: 0.001, status: "mock", note: "無料/ローカル処理" },
];

export const initialBudgets = [
  { id: "budget-1", monthlyBudgetLimit: 5, dailyBudgetLimit: 0.2, monthlyUsed: 0.01, dailyUsed: 0.0 },
];

export const initialBudgetAlerts = [
  { id: "alert-1", level: "info", message: "予算は安全圏です。" },
];

export const initialEmergencyStopState = { active: false, reason: "", triggeredAt: null };

export const initialCostSimulations = [
  { id: "sim-1", workflow: "案件→調査→提案→承認", estimatedCost: 0.001, safe: true },
];

export const initialFreeApiSources = [
  { id: "free-1", name: "Google Trends", status: "planned", note: "Phase1-AではMockのみ" },
];

export const initialOwnerSettings = {
  ownerApproved: false,
  productionMode: false,
  requireBudgetGuard: true,
  auditLogEnabled: true,
};

export const initialExecutionLogs = [
  { id: "exec-1", workflowId: "wf-1", status: "mock", detail: "承認前のモック実行" },
];

export const initialRiskAlerts = [
  { id: "risk-1", title: "高額APIはOwner承認必須", level: "medium" },
];

export const initialModes = [
  { id: "operator", name: "Operator Mode", summary: "AI社員に仕事を依頼し、承認と進行確認を行う" },
  { id: "developer", name: "Developer Mode", summary: "API、ログ、ルーティング、MCPを管理する" },
];

export const initialApprovalsOS = [
  { id: "app-1", title: "海外向け投稿案", status: "承認待ち", priority: "high" },
  { id: "app-2", title: "ASP案件比較レポート", status: "承認待ち", priority: "medium" },
];

export const initialRevenues = [
  { label: "今月Mock", value: 312000 },
  { label: "先月サンプル", value: 286000 },
  { label: "前月サンプル", value: 243000 },
];

export const initialForecasts = [
  { label: "Mock売上予測", value: 420000, tone: "positive" },
  { label: "Mock利益予測", value: 174000, tone: "positive" },
  { label: "Mock案件増加予測", value: 18, tone: "positive" },
];

export const initialRisks = [
  { id: "risk-1", title: "承認が滞ると実行が遅れる", level: "medium" },
  { id: "risk-2", title: "海外市場の表現差異に注意", level: "low" },
  { id: "risk-3", title: "SNS規約の更新がある可能性", level: "medium" },
];

export const initialTrendScores = [
  { label: "Japan Trend Score", value: 82 },
  { label: "Global Trend Score", value: 76 },
  { label: "Buzz Potential", value: 88 },
  { label: "Sales Potential", value: 81 },
];

export const initialMarketInsights = [
  { id: "insight-1", title: "日本向けの勝ち筋", detail: "短期施策と継続投稿の組み合わせが有効です。" },
  { id: "insight-2", title: "海外向けの勝ち筋", detail: "比較コンテンツと実用的な提案が伸びやすいです。" },
];

export const initialNextActions = [
  { id: "next-1", title: "承認待ち案件をレビュー", action: "承認" },
  { id: "next-2", title: "トレンド分析AIのレポートを確認", action: "確認" },
  { id: "next-3", title: "API接続の準備状況を更新", action: "設定" },
];
