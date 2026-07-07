import TopBar from "./TopBar";

export default function Analytics({ analytics, approvals, savedAt }) {
  const approved = approvals.filter((a) => a.status === "承認済み").length;
  const ctr = analytics.clicks ? "4.8%" : "0%";

  return (
    <main className="content">
      <section className="panel"><p className="eyebrow">CONNECTION CORE</p><h2>承認・売上・ROIをここで確認</h2><div className="mission-list"><div>Approvalで承認した案件の成果を記録し、AI CEOの判断材料にします。</div></div></section>
      <TopBar savedAt={savedAt} />

      <div className="panel">
        <h1>Analytics</h1>
        <p className="muted">承認済み投稿をもとに仮数値を連動表示。</p>
      </div>

      <div className="stats">
        <div className="stat-card"><span>クリック</span><strong>{analytics.clicks}</strong><p>承認ごとに加算</p></div>
        <div className="stat-card"><span>CV</span><strong>{analytics.cv}</strong><p>成果待ち</p></div>
        <div className="stat-card"><span>CTR</span><strong>{ctr}</strong><p>投稿後に記録</p></div>
        <div className="stat-card"><span>AI経由売上</span><strong>{analytics.revenue.toLocaleString()}円</strong><p>{approved}件承認済み</p></div>
      </div>

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
