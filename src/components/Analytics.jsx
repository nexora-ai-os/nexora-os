import TopBar from "./TopBar";
import SocialRevenuePanel from "./SocialRevenuePanel";

function formatYen(value) {
  return `${Number(value || 0).toLocaleString()}円`;
}

export default function Analytics({ analytics, approvals, savedAt, setPage }) {
  const safeApprovals = Array.isArray(approvals) ? approvals : [];
  const approved = safeApprovals.filter((a) => ["承認済み", "謇ｿ隱肴ｸ医∩"].includes(a.status)).length;
  const mockClicks = Number(analytics?.mockClicks || analytics?.clicks || 0);
  const mockCv = Number(analytics?.mockCv || analytics?.cv || 0);
  const mockRevenue = Number(analytics?.mockRevenue || analytics?.revenue || 0);
  const forecastRevenue = Number(analytics?.forecastRevenue || 0) + approved * 3800;
  const actualRevenue = Number(analytics?.actualRevenue || 0);
  const ctr = mockClicks ? "4.8%" : "0%";

  const separatedAnalytics = {
    ...analytics,
    revenue: mockRevenue,
    mockRevenue,
    forecastRevenue,
    actualRevenue,
  };

  return (
    <main className="content">
      <SocialRevenuePanel campaigns={[]} approvals={approvals || []} analytics={separatedAnalytics} setPage={setPage} />
      <section className="panel">
        <p className="eyebrow">CONNECTION CORE</p>
        <h2>Mock / Forecast / Actualを分けて確認</h2>
        <div className="mission-list">
          <div>承認済み案件はMock指標として扱います。</div>
          <div>Actual Revenueは外部売上データ未接続のため0円固定です。</div>
        </div>
      </section>
      <TopBar savedAt={savedAt} />

      <div className="panel">
        <h1>Analytics</h1>
        <p className="muted">この画面はSandboxとMockの確認用です。Production公開、外部API取得、Actual Revenue確定は行いません。</p>
      </div>

      <div className="stats">
        <div className="stat-card">
          <span>Mock Revenue</span>
          <strong>{formatYen(mockRevenue)}</strong>
          <p>承認操作からの模擬値</p>
        </div>
        <div className="stat-card">
          <span>Forecast Revenue</span>
          <strong>{formatYen(forecastRevenue)}</strong>
          <p>AI予測値。実売上ではありません。</p>
        </div>
        <div className="stat-card">
          <span>Actual Revenue</span>
          <strong>{formatYen(actualRevenue)}</strong>
          <p>未接続。UI操作では増加しません。</p>
        </div>
        <div className="stat-card">
          <span>Mock CTR</span>
          <strong>{ctr}</strong>
          <p>クリック {mockClicks} / CV {mockCv}</p>
        </div>
      </div>

      <section className="panel">
        <h2>Revenue境界</h2>
        <div className="mission-list">
          <div>Mock: {formatYen(mockRevenue)} / Sandbox・デモ由来</div>
          <div>Forecast: {formatYen(forecastRevenue)} / AI予測由来</div>
          <div>Actual: {formatYen(actualRevenue)} / 外部売上データ未接続</div>
          <div>Mock値とActual値は合算しません。</div>
        </div>
      </section>

      <section className="panel">
        <h2>ASP別メモ</h2>
        <div className="mission-list">
          <div>PLAUD: Mock候補。SNS相性を確認中。</div>
          <div>ConoHa AI Canvas: Mock候補。画像生成コンテンツ向け。</div>
          <div>Value AI Writer: Mock候補。ブログ導線向け。</div>
        </div>
      </section>
    </main>
  );
}
