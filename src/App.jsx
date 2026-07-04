import { useState } from "react";
import AffiliateHub from "./src/pages/AffiliateHub";
import "./styles.css";

function Dashboard() {
return (
<main className="content">
<h1>Dashboard</h1>
<div className="card">
<h2>ようこそ</h2>
<p>Dashboardの表示テストです。</p>
</div>
</main>
);
}

function Placeholder({ title }) {
return (
<main className="content">
<h1>{title}</h1>
<div className="card">
<p>この画面はこれから実装します。</p>
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
<h2>NEXORA AI OS</h2>
<p>{page}</p>
</div>

<nav className="nav">
<button className={page === "dashboard" ? "active" : ""} onClick={() => setPage("dashboard")}>
Dashboard
</button>
<button className={page === "affiliate" ? "active" : ""} onClick={() => setPage("affiliate")}>
Affiliate Hub
</button>
<button className={page === "tools" ? "active" : ""} onClick={() => setPage("tools")}>
AI Tools
</button>
<button className={page === "settings" ? "active" : ""} onClick={() => setPage("settings")}>
Settings
</button>
</nav>
</aside>

{page === "dashboard" && <Dashboard />}
{page === "affiliate" && <AffiliateHub />}
{page === "tools" && <Placeholder title="AI Tools" />}
{page === "settings" && <Placeholder title="Settings" />}
</div>
);
}
