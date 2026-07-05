import { useMemo, useState } from "react";
import "./styles.css";

const initialPrograms = [
{ name: "PLAUD", asp: "A8.net", category: "AIボイスレコーダー", reward: "購入10%", status: "提携済み", score: 95, favorite: true },
{ name: "ConoHa AI Canvas", asp: "A8.net", category: "AI画像生成", reward: "500円〜4,000円", status: "提携済み", score: 93, favorite: true },
{ name: "Value AI Writer", asp: "A8.net", category: "SEO記事生成AI", reward: "有料40%", status: "提携済み", score: 90, favorite: true },
{ name: "Twomi", asp: "A8.net", category: "AI × SNS", reward: "300円", status: "提携済み", score: 89, favorite: false },
{ name: "Doraverse", asp: "A8.net", category: "AI SaaS", reward: "62円〜", status: "提携済み", score: 84, favorite: false },
{ name: "RingConn", asp: "A8.net", category: "AIスマートリング", reward: "購入7%", status: "提携済み", score: 82, favorite: false },
];

const initialApprovals = [
{ id: 1, title: "ChatGPT便利機能3選", channel: "Instagram / Threads", asp: "PLAUD", time: "20:15", status: "承認待ち" },
{ id: 2, title: "AI画像生成で時短する方法", channel: "TikTok / Shorts", asp: "ConoHa AI Canvas", time: "19:40", status: "修正待ち" },
{ id: 3, title: "ブログ記事をAIで量産する方法", channel: "Blog / X", asp: "Value AI Writer", time: "明日 09:00", status: "保留" },
];

function TopBar() {
return (
<div className="topbar">
<div>
<p className="eyebrow">TODAY / REVENUE MODE</p>
<strong>Good Morning, 健さん</strong>
</div>
<div className="top-actions">
<button className="icon-btn">🔔 3</button>
<button className="profile-btn">KEN</button>
</div>
</div>
);
}

function Dashboard({ approvals, programs }) {
const waiting = approvals.filter((a) => a.status === "承認待ち").length;
const favorites = programs.filter((p) => p.favorite).length;

return (
<main className="content">
<TopBar />

<div className="hero">
<p className="eyebrow">NEXORA COMMAND CENTER</p>
<h1>AIが稼ぐ準備を進める。健さんは承認するだけ。</h1>
<p className="lead">今日のテーマ・案件・投稿・承認・分析をここから始めます。</p>
</div>

<div className="stats">
<div className="stat-card"><span>今月目標</span><strong>30,000円</strong><p>Phase1：月3万円</p></div>
<div className="stat-card"><span>承認待ち</span><strong>{waiting}件</strong><p>確認して投稿へ</p></div>
<div className="stat-card"><span>お気に入り案件</span><strong>{favorites}件</strong><p>優先運用候補</p></div>
<div className="stat-card"><span>今日の予測</span><strong>2,400円</strong><p>AI予測・仮データ</p></div>
</div>

<section className="panel">
<h2>AI Revenue Brief</h2>
<div className="mission-list">
<div>01｜PLAUD：ChatGPT便利機能ネタと相性が高い</div>
<div>02｜ConoHa AI Canvas：AI画像生成ネタで展開しやすい</div>
<div>03｜Value AI Writer：ブログ・SEO系導線に向いている</div>
</div>
</section>
</main>
);
}

function AffiliateHub({ programs, setPrograms, setGenerated, setPage }) {
const [query, setQuery] = useState("");

const filtered = useMemo(() => {
return programs.filter((p) =>
`${p.name} ${p.asp} ${p.category}`.toLowerCase().includes(query.toLowerCase())
);
}, [programs, query]);

const toggleFavorite = (name) => {
setPrograms((prev) => prev.map((p) => p.name === name ? { ...p, favorite: !p.favorite } : p));
};

const generateIdea = (item, type) => {
const text = `【${type}】
案件：${item.name}
カテゴリ：${item.category}
報酬：${item.reward}
Revenue Score：${item.score}

投稿テーマ案：
1. ${item.category}で作業時間を減らす方法
2. 初心者でも使いやすい${item.name}活用法
3. 副業・仕事効率化に${item.name}が向いている理由

CTA：
詳しくはプロフィールリンクから確認。`;

setGenerated(text);
setPage("content");
};

return (
<main className="content">
<TopBar />

<div className="panel">
<h1>Affiliate Hub</h1>
<p className="muted">案件管理・検索・お気に入り・優先度確認。</p>
<input className="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="案件名・ASP・カテゴリで検索" />
</div>

<div className="grid">
{filtered.map((item) => (
<div className="card offer-card" key={item.name}>
<div className="card-header">
<div>
<h2>{item.name}</h2>
<p>{item.category}</p>
</div>
<span className="badge">Score {item.score}</span>
</div>

<ul>
<li>ASP：{item.asp}</li>
<li>報酬：{item.reward}</li>
<li>状態：{item.status}</li>
<li>お気に入り：{item.favorite ? "YES" : "NO"}</li>
</ul>

<div className="actions">
<button onClick={() => toggleFavorite(item.name)}>{item.favorite ? "★ 解除" : "★ 追加"}</button>
<button onClick={() => generateIdea(item, "投稿ネタ")}>📝 投稿ネタ</button>
<button onClick={() => generateIdea(item, "記事ネタ")}>📖 記事ネタ</button>
<button onClick={() => generateIdea(item, "動画台本")}>🎬 動画台本</button>
</div>
</div>
))}
</div>
</main>
);
}

function ContentStudio({ generated, setGenerated }) {
const [theme, setTheme] = useState("ChatGPT便利機能3選");
const [media, setMedia] = useState("Instagram / Threads / Blog");

const createPrompt = () => {
setGenerated(`テーマ：${theme}
媒体：${media}

Instagram構成：
1枚目：結論
2枚目：悩み
3枚目：便利機能3選
4枚目：使い方
5枚目：おすすめ案件導線
6枚目：保存CTA

Threads投稿：
AIを使って作業時間を減らしたい人は、まず「${theme}」から試すのがおすすめです。

ブログ構成：
H2：なぜ今${theme}が重要か
H2：初心者向けの使い方
H2：おすすめツール
H2：注意点
H2：まとめ`);
};

return (
<main className="content">
<TopBar />

<div className="panel">
<h1>Content Studio</h1>
<p className="muted">SNS・ブログ・動画台本の生成拠点。</p>

<input className="search" value={theme} onChange={(e) => setTheme(e.target.value)} />
<input className="search" value={media} onChange={(e) => setMedia(e.target.value)} />

<div className="actions">
<button onClick={createPrompt}>✨ 生成する</button>
<button onClick={() => navigator.clipboard.writeText(generated)}>📋 コピー</button>
<button>💾 保存</button>
<button>📅 予約へ</button>
</div>

<pre className="prompt-box">{generated || "ここに生成結果が表示されます。"}</pre>
</div>
</main>
);
}

function ApprovalCenter({ approvals, setApprovals }) {
const updateStatus = (id, status) => {
setApprovals((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
};

return (
<main className="content">
<TopBar />

<div className="panel">
<h1>Approval Center</h1>
<p className="muted">AI生成物を確認・承認・修正・保留する画面。</p>
</div>

<div className="grid">
{approvals.map((a) => (
<div className="card" key={a.id}>
<span className="badge">{a.status}</span>
<h2>{a.title}</h2>
<p>{a.channel}</p>
<p>案件：{a.asp}</p>
<p>投稿予定：{a.time}</p>
<div className="actions">
<button onClick={() => updateStatus(a.id, "承認済み")}>✅ 承認</button>
<button onClick={() => updateStatus(a.id, "修正待ち")}>🟡 修正</button>
<button onClick={() => updateStatus(a.id, "保留")}>⏸ 保留</button>
</div>
</div>
))}
</div>
</main>
);
}

function Analytics() {
return (
<main className="content">
<TopBar />
<div className="panel"><h1>Analytics</h1><p className="muted">売上・クリック・CV・成果分析。</p></div>
<div className="stats">
<div className="stat-card"><span>クリック</span><strong>0</strong><p>計測準備中</p></div>
<div className="stat-card"><span>CV</span><strong>0</strong><p>成果待ち</p></div>
<div className="stat-card"><span>CTR</span><strong>0%</strong><p>投稿後に記録</p></div>
<div className="stat-card"><span>AI経由売上</span><strong>0円</strong><p>初月計測</p></div>
</div>
</main>
);
}

function Assistant() {
return (
<main className="content">
<TopBar />
<div className="panel assistant-panel">
<h1>AI Assistant</h1>
<div className="chat-bubble">健さん、今日はPLAUD・ConoHa AI Canvas・Value AI Writerを優先します。</div>
<div className="chat-bubble">Content Studioで投稿を作り、Approval Centerで承認してください。</div>
</div>
</main>
);
}

function Settings() {
return (
<main className="content">
<TopBar />
<div className="panel">
<h1>Settings / Profile</h1>
<div className="mission-list">
<div>Profile｜健 / NEXORA Owner</div>
<div>Notifications｜承認待ち・投稿予定・売上通知</div>
<div>User Management｜v1は疑似ログイン</div>
<div>Security｜Basic認証稼働中</div>
</div>
</div>
</main>
);
}

function FloatingAssistant() {
return (
<div className="floating-ai">
<strong>🤖 NEXORA AI</strong>
<p>今日の優先：PLAUD投稿 → Content生成 → 承認</p>
</div>
);
}

export default function App() {
const [page, setPage] = useState("dashboard");
const [programs, setPrograms] = useState(initialPrograms);
const [approvals, setApprovals] = useState(initialApprovals);
const [generated, setGenerated] = useState("");

const pages = {
dashboard: <Dashboard approvals={approvals} programs={programs} />,
affiliate: <AffiliateHub programs={programs} setPrograms={setPrograms} setGenerated={setGenerated} setPage={setPage} />,
content: <ContentStudio generated={generated} setGenerated={setGenerated} />,
approval: <ApprovalCenter approvals={approvals} setApprovals={setApprovals} />,
analytics: <Analytics />,
assistant: <Assistant />,
settings: <Settings />,
};

return (
<div className="app-shell">
<aside className="sidebar">
<div className="brand">
<div className="logo">N</div>
<div><h2>NEXORA</h2><p>AI OS v1.3</p></div>
</div>

<nav className="nav">
<button className={page === "dashboard" ? "active" : ""} onClick={() => setPage("dashboard")}>🏠 Dashboard</button>
<button className={page === "affiliate" ? "active" : ""} onClick={() => setPage("affiliate")}>💰 Affiliate Hub</button>
<button className={page === "content" ? "active" : ""} onClick={() => setPage("content")}>✍️ Content Studio</button>
<button className={page === "approval" ? "active" : ""} onClick={() => setPage("approval")}>✅ Approval Center</button>
<button className={page === "analytics" ? "active" : ""} onClick={() => setPage("analytics")}>📊 Analytics</button>
<button className={page === "assistant" ? "active" : ""} onClick={() => setPage("assistant")}>🤖 AI Assistant</button>
<button className={page === "settings" ? "active" : ""} onClick={() => setPage("settings")}>⚙️ Settings</button>
</nav>
</aside>

{pages[page]}
<FloatingAssistant />
</div>
);
}
