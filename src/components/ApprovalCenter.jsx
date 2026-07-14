import TopBar from "./TopBar";

const WAITING_STATUSES = ["承認待ち", "謇ｿ隱榊ｾ・■"];
const APPROVED_STATUSES = ["承認済み", "謇ｿ隱肴ｸ医∩"];
const APPROVED_STATUS = "承認済み";
const REVISION_STATUS = "修正待ち";
const HOLD_STATUS = "保留";

function isWaiting(status) {
  return WAITING_STATUSES.includes(status);
}

function isApproved(status) {
  return APPROVED_STATUSES.includes(status);
}

function formatYen(value) {
  return `${Number(value || 0).toLocaleString()}円`;
}

function toMockAnalytics(prev, addClicks, addCv, addRevenue) {
  return {
    ...prev,
    clicks: Number(prev?.clicks || 0) + addClicks,
    cv: Number(prev?.cv || 0) + addCv,
    mockClicks: Number(prev?.mockClicks || prev?.clicks || 0) + addClicks,
    mockCv: Number(prev?.mockCv || prev?.cv || 0) + addCv,
    mockRevenue: Number(prev?.mockRevenue || prev?.revenue || 0) + addRevenue,
    forecastRevenue: Number(prev?.forecastRevenue || 0),
    actualRevenue: Number(prev?.actualRevenue || 0),
  };
}

export default function ApprovalCenter({ approvals, setApprovals, setAnalytics, savedAt }) {
  const safeApprovals = Array.isArray(approvals) ? approvals : [];
  const waiting = safeApprovals.filter((a) => isWaiting(a.status)).length;
  const highCost = safeApprovals.filter((a) => Number(a.value || 0) > 500000).length;

  const updateStatus = (id, status) => {
    const target = safeApprovals.find((a) => a.id === id);

    setApprovals((prev) =>
      (Array.isArray(prev) ? prev : []).map((a) => {
        if (a.id !== id) return a;
        if (status === APPROVED_STATUS) return { ...a, status, counted: true };
        return { ...a, status };
      })
    );

    if (status === APPROVED_STATUS && target && !target.counted && !isApproved(target.status)) {
      setAnalytics((prev) => toMockAnalytics(prev, 38, 1, Number(target.value || 0)));
    }
  };

  const approveAll = () => {
    const targets = safeApprovals.filter((a) => isWaiting(a.status) && !a.counted);
    if (!targets.length) return;

    setApprovals((prev) =>
      (Array.isArray(prev) ? prev : []).map((a) =>
        isWaiting(a.status) ? { ...a, status: APPROVED_STATUS, counted: true } : a
      )
    );
    setAnalytics((prev) =>
      toMockAnalytics(
        prev,
        targets.length * 38,
        targets.length,
        targets.reduce((sum, a) => sum + Number(a.value || 0), 0)
      )
    );
  };

  return (
    <main className="content">
      <section className="panel">
        <p className="eyebrow">CONNECTION CORE</p>
        <h2>承認後の次アクション</h2>
        <div className="mission-list">
          <div>承認した案件はAnalyticsへMock指標として反映します。</div>
          <div>外部投稿・送信・決済はOwnerの最終判断後も自動実行しません。</div>
        </div>
      </section>
      <TopBar notifications={waiting} savedAt={savedAt} />

      <div className="panel">
        <h1>Approval Center</h1>
        <p className="muted">承認操作はMock Revenueだけを更新します。Actual Revenueは未接続のまま変更しません。</p>
        <div className="actions">
          <button onClick={approveAll}>承認待ちを一括承認</button>
        </div>
        <div className="mission-list">
          <div>承認待ち: {waiting}件</div>
          <div>高コスト確認対象: {highCost}件</div>
          <div>外部通信・Production・Actual Revenue記録は無効です。</div>
        </div>
      </div>

      <div className="grid">
        {safeApprovals.map((a) => (
          <div className="card" key={a.id}>
            <span className="badge">{a.status}</span>
            <h2>{a.title}</h2>
            <p>{a.channel}</p>
            <p>案件: {a.asp}</p>
            <p>投稿予定: {a.time}</p>
            <p>Mock見込み: {formatYen(a.value)}</p>
            <div className="actions">
              <button onClick={() => updateStatus(a.id, APPROVED_STATUS)}>承認</button>
              <button onClick={() => updateStatus(a.id, REVISION_STATUS)}>修正</button>
              <button onClick={() => updateStatus(a.id, HOLD_STATUS)}>保留</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
