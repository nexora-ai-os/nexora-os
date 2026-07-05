export default function TopBar({ notifications = 0, savedAt = "未保存" }) {
  return (
    <div className="topbar">
      <div>
        <p className="eyebrow">NEXORA COMMAND CENTER</p>
        <strong>Good Morning, 健さん</strong>
        <p className="muted">保存状態：{savedAt}</p>
      </div>
      <div className="top-actions">
        <button className="icon-btn">🔔 {notifications}</button>
        <button className="profile-btn">KEN</button>
      </div>
    </div>
  );
}
