import TopBar from "./TopBar";

export default function ApprovalCenter({ approvals, setApprovals, setAnalytics, savedAt }) {
  const safeApprovals = Array.isArray(approvals) ? approvals : [];
  const waiting = safeApprovals.filter((a) => a.status === "承認待ち").length;
  const highCost = safeApprovals.filter((a) => Number(a.value || 0) > 500000).length;

  const updateStatus = (id, status) => {
    const target = safeApprovals.find((a) => a.id === id);

    setApprovals((prev) =>
      (Array.isArray(prev) ? prev : []).map((a) => {
        if (a.id !== id) return a;
        if (status === "承認済み") return { ...a, status, counted: true };
        return { ...a, status };
      })
    );

    if (status === "承認済み" && target && !target.counted) {
      setAnalytics((prev) => ({
        clicks: Number(prev?.clicks || 0) + 38,
        cv: Number(prev?.cv || 0) + 1,
        revenue: Number(prev?.revenue || 0) + Number(target.value || 0),
      }));
    }
  };

  const approveAll = () => {
    const targets = safeApprovals.filter((a) => a.status === "承認待ち" && !a.counted);
    if (!targets.length) return;

    setApprovals((prev) => (Array.isArray(prev) ? prev : []).map((a) => a.status === "承認待ち" ? { ...a, status: "承認済み", counted: true } : a));
    setAnalytics((prev) => ({
      clicks: Number(prev?.clicks || 0) + targets.length * 38,
      cv: Number(prev?.cv || 0) + targets.length,
      revenue: Number(prev?.revenue || 0) + targets.reduce((sum, a) => sum + Number(a.value || 0), 0),
    }));
  };

  return (
    <main className="content">
      <section className="panel"><p className="eyebrow">CONNECTION CORE</p><h2>承認後の次アクション</h2><div className="mission-list"><div>承認した案件はAnalyticsで売上・ROI確認へ進めてください。</div><div>公開・投稿・送信はオーナー最終決裁後に実行してください。</div></div></section>
      <TopBar notifications={waiting} savedAt={savedAt} />

      <div className="panel">
        <h1>Approval Center</h1>
        <p className="muted">承認するとAnalyticsとDashboardへ反映されます。高額案件はOwner承認を必須にします。</p>
        <div className="actions">
          <button onClick={approveAll}>✅ 承認待ちを一括承認</button>
        </div>
        <div className="mission-list">
          <div>承認待ち: {waiting}件</div>
          <div>高コスト承認対象: {highCost}件</div>
          <div>外部送信・投稿・決済は承認後のみ。</div>
        </div>
      </div>

      <div className="grid">
        {safeApprovals.map((a) => (
          <div className="card" key={a.id}>
            <span className="badge">{a.status}</span>
            <h2>{a.title}</h2>
            <p>{a.channel}</p>
            <p>案件：{a.asp}</p>
            <p>投稿予定：{a.time}</p>
            <p>予測価値：{a.value.toLocaleString()}円</p>
            <div className="actions">
              <button onClick={() => updateStatus(a.id, "承認済み")}>✅ 承認</button>
              <button onClick={() => updateStatus(a.id, "修正待ち")}>🟡 修正</button>
              <button onClick={() => updateStatus(a.id, "保留")}>⏸ 保留</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
