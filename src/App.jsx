import { useState } from "react";
import AffiliateHub from "./src/pages/AffiliateHub";
import "./styles.css";

function Dashboard() {
return (
<main className="content">
<div className="hero">
<p className="eyebrow">NEXORA COMMAND CENTER</p>
<h1>AIが稼ぐ準備を進める。健さんは承認するだけ。</h1>
<p className="lead">
SNS・ブログ・アフィリエイト運営を、最小作業で回すためのAI Business OS。
</p>
</div>

<div className="stats">
<div className="stat-card">
<span>今月目標</span>
<strong>30,000円</strong>
<p>Phase1：まずは月3万円</p>
</div>
<div className="stat-card">
<span>承認待ち</span>
<strong>0件</strong>
<p>AI生成コンテンツ</p>
</div>
<div className="stat-card">
<span>登録ASP案件</span>
<strong>8件</strong>
<p>A8中心に拡張中</p>
</div>
</div>

<section className="panel">
<h2>今日のRevenue Mission</h2>
<div className="mission-list">
<div>01｜伸びそうなAIネタを1つ選ぶ</div>
<div>02｜Affiliate Hubから案件を選ぶ</div>
<div>03｜投稿案を作成して承認する</div>
</div>
</section>
</main>
);
}

function Placeholder({ title }) {
return (
<main className="content">
<div className="panel">
<h1>{title}</h1>
<p className="muted">この画面は次の開発フェーズで実装します。</p>
</div>
</main>
);
}

export default function App() {
const [page, setPage] = useState("dashboard");

return (
<div className="app-shell">
<aside className="sidebar">
<div className="brand">
<div className="logo">N</div>
<div>
<h2>NEXORA</h2>
<p>AI OS v1</p>
</div>
</div>

<nav className="nav">
<button className={page === "dashboard" ? "active" : ""} onClick={() => setPage("dashboard")}>
Dashboard
</button>
<button className={page === "affiliate" ? "active" : ""} onClick={() => setPage("affiliate")}>
Affiliate Hub
</button>
<button className={page === "content" ? "active" : ""} onClick={() => setPage("content")}>
Content Studio
</button>
<button className={page === "approval" ? "active" : ""} onClick={() => setPage("approval")}>
Approval Center
</button>
<button className={page === "analytics" ? "active" : ""} onClick={() => setPage("analytics")}>
Analytics
</button>
<button className={page === "settings" ? "active" : ""} onClick={() => setPage("settings")}>
Settings
</button>
</nav>
</aside>

{page === "dashboard" && <Dashboard />}
{page === "affiliate" && <AffiliateHub />}
{page === "content" && <Placeholder title="Content Studio" />}
{page === "approval" && <Placeholder title="Approval Center" />}
{page === "analytics" && <Placeholder title="Analytics" />}
{page === "settings" && <Placeholder title="Settings" />}
</div>
);
}
