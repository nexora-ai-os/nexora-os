import { buildAgentBoardReport } from "../services/agentEngine";
import { analyzeMemory } from "../services/memoryEngine";

export default function HomeCommandCenter({
  approvals,
  analytics,
  missionTasks,
  workItems,
  pipelineRuns,
  workflows,
  memoryRecords,
  decisionJournal,
  campaigns,
  setPage,
}) {
  const agentBoard = buildAgentBoardReport({
    workItems,
    missionTasks,
    approvals,
    analytics,
    pipelineRuns,
  });

  const memory = analyzeMemory({ memoryRecords, decisionJournal });
  const pendingApprovals = approvals.filter((item) => item.status === "承認待ち");
  const openMissions = missionTasks.filter((item) => item.status !== "done");
  const revenue = Number(analytics.revenue || 0);
  const goal = Number(analytics.monthlyGoal || 300000);
  const remaining = Math.max(goal - revenue, 0);

  return (
    <main className="content v5-home">
      <section className="hero v5-hero">
        <p className="eyebrow">KEVIRIO v5 SIMPLE COMMAND OS</p>
        <h1>やることは選ぶだけ。あとはAI社員が準備する。</h1>
        <p className="lead">
          9割はAIが調査・比較・作成・整理・予約準備まで進め、健さんは確認・承認・軽い修正だけを行います。
        </p>
        <div className="actions">
          <button onClick={() => setPage("campaign")}>🚀 1テーマから投稿を作る</button>
          <button onClick={() => setPage("approval")}>✅ 承認待ちを見る</button>
          <button onClick={() => setPage("apiCenter")}>🔌 API接続を確認</button>
        </div>
      </section>

      <div className="stats">
        <div className="stat-card"><span>承認待ち</span><strong>{pendingApprovals.length}件</strong><p>人間の1割作業</p></div>
        <div className="stat-card"><span>未完了Mission</span><strong>{openMissions.length}件</strong><p>AI準備済み作業</p></div>
        <div className="stat-card"><span>月目標まで</span><strong>{remaining.toLocaleString()}円</strong><p>Revenue OS</p></div>
        <div className="stat-card"><span>Memory</span><strong>{memory.learningScore}</strong><p>学習スコア</p></div>
      </div>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">TODAY'S COMMAND</p>
            <h2>今日の最短アクション</h2>
          </div>
          <span className="badge">3〜5 clicks</span>
        </div>
        <div className="v5-command-grid">
          <button onClick={() => setPage("campaign")}>
            <strong>🚀 Campaignを作る</strong>
            <span>1テーマ → 日本3本 + 海外3本 + 承認待ち</span>
          </button>
          <button onClick={() => setPage("approval")}>
            <strong>✅ 承認する</strong>
            <span>AIが作った投稿・記事・下書きを確認</span>
          </button>
          <button onClick={() => setPage("analytics")}>
            <strong>📊 結果を見る</strong>
            <span>売上・ROI・反応を確認</span>
          </button>
          <button onClick={() => setPage("memory")}>
            <strong>🧬 学習させる</strong>
            <span>判断・結果・学びを記録</span>
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">AI BOARD</p>
            <h2>AI社員の統合判断</h2>
          </div>
          <span className="badge">{agentBoard.finalDecision}</span>
        </div>
        <div className="grid">
          {agentBoard.board.slice(0, 6).map((agent) => (
            <div className="card agent-card" key={agent.role}>
              <span className="badge">{agent.role}</span>
              <h2>{agent.stance}</h2>
              <p>{agent.opinion}</p>
              <small>Confidence {agent.confidence}%</small>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">AUTOMATION MAP</p>
            <h2>裏側で動くAI社員</h2>
          </div>
          <span className="badge">AI Staff</span>
        </div>
        <div className="connection-flow">
          <span>Research</span>
          <span>Trend</span>
          <span>Opportunity</span>
          <span>Content</span>
          <span>Translator</span>
          <span>Creative</span>
          <span>Video</span>
          <span>Legal</span>
          <span>Publisher</span>
          <span>Analytics</span>
          <span>Memory</span>
        </div>
        <div className="mission-list">
          <div>原則｜AIは準備まで。投稿・契約・送信・決済は承認後のみ。</div>
          <div>目的｜機能は増やすが、操作は減らす。</div>
          <div>Campaign数｜{campaigns.length}件</div>
        </div>
      </section>
    </main>
  );
}
