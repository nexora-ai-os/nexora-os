import BrandMark from "./BrandMark";

const primaryItems = [
  ["home", "🏠 Home"],
  ["campaign", "🚀 Campaign"],
  ["approval", "✅ Approval"],
  ["analytics", "📊 Analytics"],
  ["apiCenter", "🔌 API / AI"],
];

const advancedItems = [
  ["ceo", "👑 AI CEO"],
  ["memory", "🧬 Business Memory"],
  ["opportunity", "💰 Opportunity"],
  ["trends", "📡 Trend"],
  ["workflows", "⚙️ Workflow"],
  ["dashboard", "🌿 Mission"],
  ["workEngine", "🧬 Work Engine"],
  ["work", "🧠 Work Command"],
  ["affiliate", "💠 Affiliate"],
  ["content", "✍️ Content"],
  ["assistant", "✨ AI Companion"],
  ["settings", "⚙️ Settings"],
];

export default function Sidebar({ page, setPage }) {
  const renderButton = ([key, label]) => (
    <button key={key} className={page === key ? "active" : ""} onClick={() => setPage(key)}>
      {label}
    </button>
  );

  return (
    <aside className="sidebar">
      <div className="brand">
        <BrandMark size={48} />
        <div>
          <h2>KEVIRIO</h2>
          <p>Autonomous Business OS v5.0</p>
        </div>
      </div>

      <nav className="nav">
        <p className="nav-label">Command</p>
        {primaryItems.map(renderButton)}

        <p className="nav-label">Advanced Engines</p>
        {advancedItems.map(renderButton)}
      </nav>
    </aside>
  );
}
