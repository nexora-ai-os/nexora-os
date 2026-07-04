import { useState } from "react";
import AffiliateHub from "./src/pages/AffiliateHub";
import "./styles.css";

const menuItems = [
{ id: "dashboard", label: "Dashboard" },
{ id: "ai-coo", label: "AI COO" },
{ id: "affiliate", label: "Affiliate Hub" },
{ id: "content", label: "Content Studio" },
{ id: "approval", label: "Approval Center" },
{ id: "analytics", label: "Analytics" },
{ id: "settings", label: "Settings" },
];

function Dashboard() {
return (
<section className="panel">
<h1>NEXORA AI OS</h1>
<p className="muted">
AIが稼ぐ準備を進め、健さんは承認だけするためのBusiness Operating System。
</p>

<div className="grid">
<div className="card">
<h2>今月目標</h2>
<p className="big">30,000円</p>
<p className="muted">Phase1：まずは月3万円を作る</p>
</div>

<div className="card">
<h2>承認待ち</h2>
<p className="big">0件</p>
<p className="muted">AI生成コンテンツの確認待ち</p>
</div>

<div className="card">
<h2>稼働中Issue</h2>
<p className="big">3件</p>
<p className="muted">AI COO / Affiliate Hub / ASP Search</p>
</div>
</div>
</section>
);
}

function Placeholder({ title }) {
return (
<section className="panel">
<h1>{title}</h1>
<p className="muted">この画面はこれから実装します。</p>
</section>
);
}

export default function App() {
const [activePage, setActivePage] = useState("dashboard");

const renderPage = () => {
if (activePage === "dashboard") return <Dashboard />;
if (activePage === "affiliate") return <AffiliateHub />;
if (activePage === "ai-coo") return <Placeholder title="AI COO" />;
if (activePage === "content") return <Placeholder title="Content Studio" />;
if (activePage === "approval") return <Placeholder title="Approval Center" />;
if (activePage === "analytics") return <Placeholder title="Analytics" />;
if (activePage === "settings") return <Placeholder title="Settings" />;
return <Dashboard />;
};

return (
<div className="app-shell">
<aside className="sidebar">
<div className="brand">
<div className="logo">N</div>
<div>
<strong>NEXORA</strong>
<span>AI OS v2</span>
</div>
</div>

<nav>
{menuItems.map((item) => (
<button
key={item.id}
className={activePage === item.id ? "nav-item active" : "nav-item"}
onClick={() => setActivePage(item.id)}
>
{item.label}
</button>
))}
</nav>
</aside>

<main className="main-content">{renderPage()}</main>
</div>
);
}
