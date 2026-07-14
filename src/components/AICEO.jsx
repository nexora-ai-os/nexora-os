import { buildCEOBrief } from "../services/ceoEngine";
import { buildAgentBoardReport, buildGovernanceChecklist } from "../services/agentEngine";
import AIWorkforceRegistry from "./AIWorkforceRegistry";

export default function AICEO({
  workItems,
  missionTasks,
  approvals,
  analytics,
  pipelineRuns,
  setPage,
}) {
  const mockRevenue = Number(analytics?.mockRevenue || analytics?.revenue || 0);
  const actualRevenue = Number(analytics?.actualRevenue || 0);
  const revenueView = { ...analytics, revenue: mockRevenue, mockRevenue, actualRevenue };
  const brief = buildCEOBrief({ workItems, missionTasks, approvals, analytics: revenueView, pipelineRuns });
  const agentBoard = buildAgentBoardReport({ workItems, missionTasks, approvals, analytics: revenueView, pipelineRuns });
  const boardForDisplay = agentBoard.board.map((agent) =>
    agent.role === "AI CFO"
      ? {
          ...agent,
          opinion: `Sandbox模擬売上は${mockRevenue.toLocaleString()}円、Actual Revenueは未接続です。ForecastとMockを分けて判断してください。`,
        }
      : agent
  );
  const governanceChecklist = buildGovernanceChecklist();

  const sendCEOBriefToAI = () => {
    const workLines = brief.rankedWork
      .slice(0, 5)
      .map((item, index) => `${index + 1}. ${item.title} / Score:${item.ceoScore} / ROI:${item.roiPerHour}円/h / 理由:${item.reason}`)
      .join("\n");

    const message = `あなたはKEVIRIOのAI CEOです。今日の経営指示を出してください。\n\nCEO Score:${brief.ceoScore}\nSandbox模擬売上:${mockRevenue}円\nActual Revenue:未接続\n月間Mock目標:${brief.monthlyGoal}円\n残り:${brief.remaining}円\n今日のForecast Revenue:${brief.todayExpectedRevenue}円\n承認待ち:${brief.waitingApprovals.length}件\nPipeline:${brief.pipelineCount}件\n\n優先仕事:\n${workLines}\n\nリスク:\n${brief.risks.join(" / ")}\n\nAI Board:\n${boardForDisplay.map((a) => `${a.role}: ${a.opinion}`).join("\\n")}\n\n出力は「事実」「推測」「意見」「今日のCEO指示」「やらないこと」「最終決裁待ち」でお願いします。`;

    localStorage.setItem("kevirio-pending-ai-message", message);
    setPage("assistant");
  };

  return (
    <main className="content">
      <section className="hero">
        <p className="eyebrow">AI CEO v2.9</p>
        <h1>AIが今日の経営判断を出す</h1>
        <p className="lead">
          Work Engine、Mission、Approval、Analyticsを見て、今日やるべきことを経営視点で判断します。
        </p>
        <div className="actions">
          <button onClick={sendCEOBriefToAI}>AI CEOに詳細指示を出させる</button>
          <button onClick={() => setPage("workEngine")}>Work Engineへ</button>
          <button onClick={() => setPage("dashboard")}>Mission Controlへ</button>
        </div>
      </section>

      <div className="ceo-grid">
        <div className="ceo-score-card">
          <span>{brief.ceoScore}</span>
          <p>CEO Confidence Score</p>
        </div>

        <div className="panel">
          <p className="eyebrow">CEO DIAGNOSIS</p>
          <h2>現状判断</h2>
          <div className="mission-list">
            <div>事実: Sandbox模擬売上は{mockRevenue.toLocaleString()}円です。Actual Revenueは未接続です。</div>
            <div>Forecast: 今日の売上予測は{brief.todayExpectedRevenue.toLocaleString()}円です。</div>
            <div>意見: {brief.diagnosis}</div>
          </div>
        </div>
      </div>

      <div className="stats">
        <div className="stat-card"><span>Forecast Revenue</span><strong>{brief.todayExpectedRevenue.toLocaleString()}円</strong><p>上位3件の予測合計</p></div>
        <div className="stat-card"><span>承認待ち</span><strong>{brief.waitingApprovals.length}件</strong><p>Approval停滞リスク</p></div>
        <div className="stat-card"><span>Pipeline</span><strong>{brief.pipelineCount}件</strong><p>一括処理履歴</p></div>
        <div className="stat-card"><span>未完了Mission</span><strong>{brief.openTasks.length}件</strong><p>今日の実行対象</p></div>
      </div>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">AI BOARD</p>
            <h2>AI経営会議</h2>
          </div>
          <span className="badge">{agentBoard.finalDecision}</span>
        </div>
        <div className="grid">
          {boardForDisplay.map((agent) => (
            <div className="card agent-card" key={agent.role}>
              <span className="badge">{agent.role}</span>
              <h2>{agent.stance}</h2>
              <p>{agent.opinion}</p>
              <small>Confidence {agent.confidence}%</small>
            </div>
          ))}
        </div>
        <div className="mission-list">
          <div>次の最小手: {agentBoard.nextBestAction}</div>
          <div>リスク: {agentBoard.riskLevel}</div>
        </div>
      </section>

      <section className="panel governance-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">GOVERNANCE</p>
            <h2>AI実行前提</h2>
          </div>
          <span className="badge">Owner Final</span>
        </div>
        <div className="mission-list">
          {governanceChecklist.map((item) => (
            <div key={item}>{item}</div>
          ))}
        </div>
      </section>

      <AIWorkforceRegistry />

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">CEO ORDERS</p>
            <h2>今日の指示</h2>
          </div>
          <span className="badge">Human Final</span>
        </div>
        <div className="mission-list">
          {brief.orders.map((order, index) => (
            <div key={order}>{index + 1}. {order}</div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">PRIORITY WORK</p>
            <h2>優先仕事ランキング</h2>
          </div>
          <span className="badge">ROI + Strategy</span>
        </div>

        <div className="grid">
          {brief.rankedWork.slice(0, 6).map((item, index) => (
            <div className="card" key={item.id}>
              <span className="badge">No.{index + 1} / Score {item.ceoScore}</span>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
              <ul>
                <li>ROI: {item.roiPerHour.toLocaleString()}円/h</li>
                <li>Forecast Reward: {Number(item.reward || 0).toLocaleString()}円</li>
                <li>理由: {item.reason}</li>
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">BUSINESS MEMORY</p>
            <h2>学習ルール</h2>
          </div>
          <span className="badge">v4.0</span>
        </div>
        <div className="mission-list">
          <div>AI提案、Owner決裁、結果、学びを記録します。</div>
          <div>次の判断精度を上げるため、Business Memoryへ意思決定を残してください。</div>
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">RISK RADAR</p>
            <h2>リスク</h2>
          </div>
        </div>
        <div className="mission-list">
          {brief.risks.length === 0 && <div>大きなリスクは検出されていません。</div>}
          {brief.risks.map((risk) => (
            <div key={risk}>{risk}</div>
          ))}
        </div>
      </section>
    </main>
  );
}
