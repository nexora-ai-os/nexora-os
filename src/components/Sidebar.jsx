import BrandMark from "./BrandMark";

const navItems = [
  ["ceo", "👑 AI CEO"],
  ["trends", "📡 Trend Intelligence"],
  ["dashboard", "🌿 Mission Control"],
  ["workEngine", "🧬 Work Engine"],
  ["work", "🧠 Work Command"],
  ["affiliate", "💠 Affiliate Hub"],
  ["content", "✍️ Content Studio"],
  ["approval", "✅ Approval Center"],
  ["analytics", "📊 Analytics"],
  ["assistant", "✨ AI Companion"],
  ["settings", "⚙️ Settings"],
];

export default function Sidebar({ page, setPage }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <BrandMark size={48} />
        <div>
          <h2>KEVIRIO</h2>
          <p>AI Business OS v2.0</p>
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
