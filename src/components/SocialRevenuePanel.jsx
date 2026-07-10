import { buildSocialRevenueSummary, buildSocialTasks, socialPlatforms } from "../services/socialRevenueEngine";

export default function SocialRevenuePanel({ campaigns = [], approvals = [], analytics = {}, setPage, compact = false }) {
  const summary = buildSocialRevenueSummary({ campaigns, approvals, analytics });
  const tasks = buildSocialTasks(summary);

  return (
    <section className={`panel social-revenue-panel ${compact ? "compact-panel" : ""}`}>
      <div className="section-head">
        <div>
          <p className="eyebrow">SOCIAL REVENUE ENGINE v5.2</p>
          <h2>SNS収益化・投稿管理</h2>
        </div>
        <span className="badge">Mock / Owner Approval Required</span>
      </div>

      <div className="stats mini-stats">
        <div className="stat-card"><span>Mock準備率</span><strong>{summary.socialReadiness}%</strong><p>SNS API未接続</p></div>
        <div className="stat-card"><span>Mock投稿案</span><strong>{summary.pendingPosts}本</strong><p>承認/準備対象</p></div>
        <div className="stat-card"><span>未接続Community</span><strong>{summary.commentsToReview + summary.dmToReview}件</strong><p>コメント/DM実取得なし</p></div>
        <div className="stat-card"><span>Mock収益見込み</span><strong>{summary.estimatedRevenue.toLocaleString()}円</strong><p>SNS実績未接続</p></div>
      </div>

      <div className="mission-list">
        <div>次の最善手｜{summary.nextBestAction}</div>
        <div>原則｜予約投稿・DM返信・コメント返信は承認後のみ実行。</div>
      </div>

      {!compact && (
        <>
          <div className="grid">
            {tasks.map((task) => (
              <div className="card" key={task.id}>
                <span className="badge">{task.status}</span>
                <h2>{task.title}</h2>
                <p>{task.ownerAction}</p>
                <small>{task.aiAgents.join(" / ")}</small>
              </div>
            ))}
          </div>

          <div className="section-head social-subhead">
            <div>
              <p className="eyebrow">PLATFORMS</p>
              <h2>対応予定SNS</h2>
            </div>
          </div>

          <div className="connection-flow">
            {socialPlatforms.map((platform) => (
              <span key={platform.id}>{platform.name}</span>
            ))}
          </div>
        </>
      )}

      <div className="actions">
        <button onClick={() => setPage?.("campaign")}>Campaignを作る</button>
        <button onClick={() => setPage?.("approval")}>承認待ちを見る</button>
        <button onClick={() => setPage?.("analytics")}>結果を見る</button>
      </div>
    </section>
  );
}
