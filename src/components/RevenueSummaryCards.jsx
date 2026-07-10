function formatYen(value) {
  return `${Number(value || 0).toLocaleString()}円`;
}

export default function RevenueSummaryCards({
  campaignCount = 0,
  pendingApprovals = 0,
  pipelineCount = 0,
  forecastRevenue = 0,
  mockRevenue = 0,
  budgetRemaining = 0,
  activeAi = 0,
  eventCount = 0,
  expanded = false,
}) {
  const primaryCards = [
    { label: "売上見込み", value: formatYen(forecastRevenue), note: "サンプル予測" },
    { label: "承認待ち", value: `${pendingApprovals}件`, note: "Owner確認が必要" },
    { label: "進行中案件", value: `${pipelineCount}件`, note: "Mock作業のみ" },
    { label: "AI社員状態", value: `${activeAi}/15`, note: "Mock稼働" },
  ];

  const secondaryCards = [
    { label: "Campaign", value: `${campaignCount}件` },
    { label: "Budget残量", value: `$${Number(budgetRemaining || 0).toFixed(2)}` },
    { label: "Event件数", value: `${eventCount}件` },
    { label: "Mock売上", value: formatYen(mockRevenue) },
    { label: "実績売上", value: "未接続" },
  ];

  return (
    <section className="panel revenue-status-panel">
      <div className="section-head compact">
        <div>
          <p className="eyebrow">Revenue Status</p>
          <h2>売上状況</h2>
        </div>
        <span className="badge">実績売上: 未接続</span>
      </div>

      <div className="revenue-kpi-grid">
        {primaryCards.map((card) => (
          <div className="stat-card revenue-kpi-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.note}</p>
          </div>
        ))}
      </div>

      {expanded && (
        <div className="secondary-kpi-list">
          {secondaryCards.map((card) => (
            <div key={card.label}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
