import TopBar from "./TopBar";
import SocialRevenuePanel from "./SocialRevenuePanel";

export default function Analytics({ analytics, approvals, savedAt, setPage }) {
  const safeApprovals = Array.isArray(approvals) ? approvals : [];
  const approved = safeApprovals.filter((a) => a.status === "承認済み").length;
  const ctr = Number(analytics?.clicks || 0) ? "4.8%" : "0%";
  const revenue = Number(analytics?.revenue || 0);
  const projectedRevenue = revenue + approved * 3800;
  const profit = Math.round(revenue * 0.42);

  return (
    <main className="content">
      <SocialRevenuePanel campaigns={[]} approvals={approvals || []} analytics={analytics || {}} setPage={setPage} />
      <section className="panel"><p className="eyebrow">CONNECTION CORE</p><h2>承認・売上・ROIをここで確認</h2><div className="mission-list"><div>Approvalで承認した案件の成果を記録し、AI CEOの判断材料にします。</div></div></section>
      <TopBar savedAt={savedAt} />

      <div className="panel">
        <h1>Analytics</h1>
        <p className="muted">Phase1-Aでは実データ未接続です。承認済み投稿をもとにMock数値を連動表示。</p>
      </div>

      <div className="stats">
        <div className="stat-card"><span>Mockクリック</span><strong>{analytics?.clicks || 0}</strong><p>実データ未接続</p></div>
        <div className="stat-card"><span>Mock CV</span><strong>{analytics?.cv || 0}</strong><p>成果API未接続</p></div>
        <div className="stat-card"><span>Mock CTR</span><strong>{ctr}</strong><p>投稿実績未接続</p></div>
        <div className="stat-card"><span>実績売上</span><strong>{revenue.toLocaleString()}円</strong><p>{approved}件承認済み / Mock反映</p></div>
      </div>
      <section className="panel">
        <h2>Revenue Dashboard 基盤</h2>
        <div className="mission-list">
          <div>実績売上: {revenue.toLocaleString()}円</div>
          <div>Mock見込み売上: {projectedRevenue.toLocaleString()}円</div>
          <div>Mock利益見込み: {profit.toLocaleString()}円</div>
          <div>Mock案件数: {safeApprovals.length}件 / 承認済み: {approved}件</div>
        </div>
      </section>

      <section className="panel">
        <h2>ASP別メモ</h2>
        <div className="mission-list">
          <div>PLAUD：高単価・SNS相性高</div>
          <div>ConoHa AI Canvas：画像生成系コンテンツと相性高</div>
          <div>Value AI Writer：ブログ導線と相性高</div>
        </div>
      </section>
    </main>
  );
}
