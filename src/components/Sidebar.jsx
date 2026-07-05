const navItems = [
  ["dashboard", "🏠 Dashboard"],
  ["affiliate", "💰 Affiliate Hub"],
  ["content", "✍️ Content Studio"],
  ["approval", "✅ Approval Center"],
  ["analytics", "📊 Analytics"],
  ["assistant", "🤖 AI Assistant"],
  ["settings", "⚙️ Settings"],
];

export default function Sidebar({ page, setPage }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo">N</div>
        <div>
          <h2>NEXORA</h2>
          <p>AI OS v1.6</p>
        </div>
      </div>

      <nav className="nav">
        {navItems.map(([key, label]) => (
          <button key={key} className={page === key ? "active" : ""} onClick={() => setPage(key)}>
            {label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
