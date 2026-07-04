import "./styles.css";

export default function App() {
return (
<div className="app-shell">
<aside className="sidebar">
<div className="brand">
<h2>NEXORA AI OS</h2>
<p>Dashboard</p>
</div>

<nav className="nav">
<button className="active">Dashboard</button>
<button>Affiliate Hub</button>
<button>AI Tools</button>
<button>Settings</button>
</nav>
</aside>

<main className="content">
<h1>Dashboard</h1>
<div className="card">
<h2>ようこそ</h2>
<p>Dashboardの表示テストです。</p>
</div>
</main>
</div>
);
}
