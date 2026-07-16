import React from "react";

export function PageContainer({ children, className = "" }) {
  return <main className={`content ${className}`.trim()}>{children}</main>;
}

export function SectionTitle({ eyebrow, title, action, badge }) {
  return (
    <div className="section-head">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
      </div>
      <div className="section-head-actions">
        {badge ? <span className="badge">{badge}</span> : null}
        {action}
      </div>
    </div>
  );
}

export function GlassPanel({ children, className = "", compact = false }) {
  return <section className={`panel ${compact ? "panel-compact" : ""} ${className}`.trim()}>{children}</section>;
}

export function StatusBadge({ status }) {
  const raw = status || "planned";
  const labels = {
    "mock-only": "Mock専用",
    mock: "Mock",
    "configured-unverified": "未検証",
    planned: "予定",
    disabled: "無効",
    active: "Mock稼働",
    ready: "未検証",
    connected: "未検証",
    pending: "待機中",
    standby: "待機中",
    designing: "設計済み",
    "mock-running": "Mock稼働",
    positive: "予測",
    warning: "要確認",
    soft: "待機中",
    todo: "未着手",
    "in-progress": "準備中",
    done: "完了",
  };
  const label = labels[raw] || "未検証";
  const tone = raw === "mock-only" || raw === "mock" || raw === "mock-running" ? "soft" : raw === "disabled" || raw === "warning" ? "warning" : "soft";
  return <span className={`status-badge ${tone}`}>{label}</span>;
}

export function Button({ children, onClick, variant = "primary", className = "", disabled = false }) {
  return (
    <button className={`ui-button ${variant} ${className}`.trim()} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function Card({ children, className = "" }) {
  return <div className={`card ${className}`.trim()}>{children}</div>;
}

export function Loading({ label = "読み込み中" }) {
  return <div className="loading-state">{label}</div>;
}

export function EmptyState({ title, message }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}
