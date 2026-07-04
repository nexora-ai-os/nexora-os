import { useMemo, useState } from "react";
import "./styles.css";

const affiliatePrograms = [
{ name: "PLAUD", asp: "A8.net", category: "AIボイスレコーダー", reward: "購入10%", status: "提携済み", score: 95, favorite: true },
{ name: "ConoHa AI Canvas", asp: "A8.net", category: "AI画像生成", reward: "500円〜4,000円", status: "提携済み", score: 93, favorite: true },
{ name: "Value AI Writer", asp: "A8.net", category: "SEO記事生成AI", reward: "有料40%", status: "提携済み", score: 90, favorite: true },
{ name: "Twomi", asp: "A8.net", category: "AI × SNS", reward: "300円", status: "提携済み", score: 89, favorite: false },
{ name: "Doraverse", asp: "A8.net", category: "AI SaaS", reward: "62円〜", status: "提携済み", score: 84, favorite: false },
{ name: "RingConn", asp: "A8.net", category: "AIスマートリング", reward: "購入7%", status: "提携済み", score: 82, favorite: false },
{ name: "ココナラ", asp: "A8.net", category: "副業・スキル販売", reward: "100円〜", status: "提携済み", score: 78, favorite: false },
{ name: "SAZO", asp: "A8.net", category: "韓国購入代行", reward: "購入5%", status: "提携済み", score: 65, favorite: false },
];

const approvals = [
{ title: "ChatGPT便利機能3選", channel: "Instagram / Threads", asp: "PLAUD", time: "20:15", status: "承認待ち" },
{ title: "AI画像生成で時短する方法", channel: "TikTok / Shorts", asp: "ConoHa AI Canvas", time: "19:40", status: "修正待ち" },
{ title: "ブログ記事をAIで量産する方法", channel: "Blog / X", asp: "Value AI Writer", time: "明日 09:00", status: "保留" },
];

function Login({ onLogin }) {
return (
<div className="login-screen">
<div className="login-card">
<div className="logo big-logo">N</div>
<h1>NEXORA AI OS</h1>
<p>AIが稼ぐ準備を進め、人は承認だけする。</p>
<button onClick={onLogin}>Enter Command Center</button>
</div>
</div>
);
}

function Dashboard() {
return (
<main className="content">
<div className="hero">
<p className="eyebrow">NEXORA COMMAND CENTER</p>
<h1>AIが稼ぐ準備を進める。健さんは承認するだけ。</h1>
<p className="lead">SNS・ブログ・アフィリエイト運営を最小作業で回すAI Business OS。</p>
</div>

<div className="stats">
<div className="stat-card"><span>今月目標</span><strong>30,000円</strong><p>Phase1：月3万円</p></div>
<div className="stat-card"><span>現在売上</span><strong>0円</strong><p>記録開始待ち</p></div>
<div className="stat-card"><span>承認待ち</span><strong>3件</strong><p>投稿候補</p></div>
<div className="stat-card"><span>登録案件</span><strong>8件</strong><p>A8中心</p></div>
</div>

<section className="panel">
<h2>AI Assistant Brief</h2>
<p className="muted">今日は「ChatGPT便利機能」「AI画像生成」「AI議事録」系の投稿を優先候補にします。</p>
<div className="mission-list">
<div>01｜Affiliate Hubで使う案件を選ぶ</div>
<div>02｜Content Studioで投稿案を生成する</div>
<div>03｜Approval Centerで確認・承認する</div>
</div>
</section>
</main>
);
}

function AffiliateHub() {
const [query, setQuery] = useState("");
const filtered = useMemo(() => {
return affiliatePrograms.filter((p) =>
`${p.name} ${p.asp} ${p.category}`.toLowerCase().includes(query.toLowerCase())
);
}, [query]);

return (
<main className="content">
<div className="panel">
<h1>Affiliate Hub</h1>
<p className="muted">案件管理・検索・お気に入り・優先度確認。</p>
<input className="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="案件名・ASP・カテゴリで検索" />
</div>

<div className="grid">
{filtered.map((item) => (
<div className="card" key={item.name}>
<div className="card-header">
<h2>{item.name}</h2>
<span className="badge">{item.asp}</span>
</div>
<p>{item.category}</p>
<ul>
<li>報酬：{item.reward}</li>
<li>状態：{item.status}</li>
<li>Revenue Score：{item.score}</li>
<li>お気に入り：{item.favorite ? "YES" : "NO"}</li>
</ul>
<div className="actions">
<button>投稿ネタ</button>
<button>記事生成</button>
<button>優先度</button>
</div>
</div>
))}
</div>
</main>
);
}

function ContentStudio() {
const [theme, setTheme] = useState("ChatGPT便利機能3選");
const prompt = `テーマ：${theme}

出力：
1. Instagramカルーセル構成
2. Threads投稿3案
3. X投稿3案
4. TikTok/Shorts台本
5. ブログ構成
6. おすすめASP導線
7. CTA
8. ハッシュタグ`;

return (
<main className="content">
<div className="panel">
<h1>Content Studio</h1>
<p className="muted">1テーマからSNS・ブログ・動画台本を生成する場所。</p>
<input className="search" value={theme} onChange={(e) => setTheme(e.target.value)} />
<pre className="prompt-box">{prompt}</pre>
<button className="primary-btn" onClick={() => navigator.clipboard.writeText(prompt)}>プロンプトをコピー</button>
</div>
</main>
);
}

function ApprovalCenter() {
return (
<main className="content">
<div className="panel">
<h1>Approval Center</h1>
<p className="muted">AI生成物を確認・承認・修正・保留する画面。</p>
</div>
<div className="grid">
{approvals.map((a) => (
<div className="card" key={a.title}>
<span className="badge">{a.status}</span>
<h2>{a.title}</h2>
<p>{a.channel}</p>
<p>案件：{a.asp}</p>
<p>投稿予定：{a.time}</p>
<div className="actions">
<button>承認</button>
<button>修正</button>
<button>保留</button>
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
<div className="panel">
<h1>Analytics</h1>
<p className="muted">売上・クリック・CV・成果分析。</p>
</div>
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
<div className="panel assistant-panel">
<h1>AI Assistant</h1>
<p className="muted">執事チャット風の提案画面。</p>
<div className="chat-bubble">健さん、本日はPLAUD・ConoHa AI Canvas・Value AI Writerの3案件を優先候補にします。</div>
<div className="chat-bubble user">今日やることを3つに絞って。</div>
<div className="chat-bubble">1. ChatGPT便利機能投稿作成 2. Affiliate Hub案件確認 3. Approval Center承認</div>
</div>
</main>
);
}

function Settings() {
return (
<main className="content">
<div className="panel">
<h1>Settings / Profile</h1>
<p className="muted">通知・プロフィール・ユーザー管理・ログイン設定。</p>
<div className="mission-list">
<div>Profile｜健 / NEXORA Owner</div>
<div>Notifications｜承認待ち・投稿予定・売上通知</div>
<div>User Management｜v1は疑似ログイン、v2で本実装</div>
<div>Security｜Basic認証稼働中</div>
</div>
</div>
</main>
);
}

export default function App() {
const [loggedIn, setLoggedIn] = useState(true);
const [page, setPage] = useState("dashboard");

if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />;

const pages = {
dashboard: <Dashboard />,
affiliate: <AffiliateHub />,
content: <ContentStudio />,
approval: <ApprovalCenter />,
analytics: <Analytics />,
assistant: <Assistant />,
settings: <Settings />,
};

return (
<div className="app-shell">
<aside className="sidebar">
<div className="brand">
<div className="logo">N</div>
<div><h2>NEXORA</h2><p>AI OS v1</p></div>
</div>

<nav className="nav">
<button className={page === "dashboard" ? "active" : ""} onClick={() => setPage("dashboard")}>Dashboard</button>
<button className={page === "affiliate" ? "active" : ""} onClick={() => setPage("affiliate")}>Affiliate Hub</button>
<button className={page === "content" ? "active" : ""} onClick={() => setPage("content")}>Content Studio</button>
<button className={page === "approval" ? "active" : ""} onClick={() => setPage("approval")}>Approval Center</button>
<button className={page === "analytics" ? "active" : ""} onClick={() => setPage("analytics")}>Analytics</button>
<button className={page === "assistant" ? "active" : ""} onClick={() => setPage("assistant")}>AI Assistant</button>
<button className={page === "settings" ? "active" : ""} onClick={() => setPage("settings")}>Settings / Profile</button>
</nav>

<button className="logout" onClick={() => setLoggedIn(false)}>Lock OS</button>
</aside>

{pages[page]}
</div>
);
}
