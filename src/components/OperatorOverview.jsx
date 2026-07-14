import React, { memo, useMemo, useState } from "react";
import { Button, Card, EmptyState, GlassPanel, SectionTitle, StatusBadge } from "./shared/UIComponents";
import MotionBackground from "./shared/MotionBackground";
import { useAdaptiveData } from "./shared/useAdaptiveData";

const OperatorOverview = ({
  approvals = [],
  approvalsOS = [],
  analytics = {},
  agents = [],
  tasks = [],
  integrations = [],
  forecasts = [],
  trendScores = [],
  marketInsights = [],
  nextActions = [],
  notifications = [],
  setPage,
}) => {
  const [query, setQuery] = useState("");
  const filteredAgents = useAdaptiveData(agents, query);
  const pendingApprovals = approvals.filter((item) => item.status === "謇ｿ隱榊ｾ・■" || item.status === "承認待ち").length;
  const mockAgents = agents.filter((agent) => agent.status === "mock-running").length;
  const openTasks = tasks.filter((task) => task.status !== "done").length;
  const mockRevenue = Number(analytics.mockRevenue || analytics.revenue || 0);
  const actualRevenue = Number(analytics.actualRevenue || 0);
  const revenueForecast = forecasts.find((item) => String(item.label || "").includes("売上") || String(item.label || "").includes("Revenue"))?.value || 0;
  const profitForecast = forecasts.find((item) => String(item.label || "").includes("利益"))?.value || 0;
  const primaryAction = nextActions[0] || { title: "承認待ちを確認", action: "Approval Centerへ進む" };
  const configuredCount = integrations.filter((item) => item.status === "mock-only" || item.status === "configured-unverified").length;

  const summaryCards = useMemo(() => [
    { label: "Sandbox模擬売上", value: `${mockRevenue.toLocaleString()}円`, hint: "Mock由来 / Actual未接続" },
    { label: "Actual Revenue", value: `${actualRevenue.toLocaleString()}円`, hint: "未接続 / UI操作で増加しない" },
    { label: "Mock利益予測", value: `${profitForecast.toLocaleString()}円`, hint: "サンプル予測" },
    { label: "Mock承認待ち", value: `${pendingApprovals}件`, hint: "Mockデータ / Owner判断待ち" },
  ], [actualRevenue, mockRevenue, pendingApprovals, profitForecast]);

  return (
    <MotionBackground className="operator-overview">
      <GlassPanel className="overview-hero">
        <div className="overview-hero__copy">
          <p className="eyebrow">AUTONOMOUS BUSINESS OS</p>
          <h1>AI社員が準備し、Ownerは判断する</h1>
          <p className="lead">
            売上・利益・案件・承認・トレンド・リスクを一目で確認し、次に進むべきアクションを導きます。ここで表示する売上はSandbox模擬値です。
          </p>
          <div className="actions">
            <Button onClick={() => setPage("approval")}>承認待ちを確認</Button>
            <Button onClick={() => setPage("campaign")}>次の施策を作る</Button>
            <Button onClick={() => setPage("analytics")}>Mock / Actualを確認</Button>
          </div>
        </div>
        <div className="overview-hero__meta">
          <div className="overview-orb">
            <span>{Math.round((mockRevenue / Math.max(revenueForecast, 1)) * 100)}%</span>
            <small>Mock Goal</small>
          </div>
          <div className="hero-micro-list">
            <div>Mock承認待ち {pendingApprovals}件</div>
            <div>Mock稼働AI {mockAgents}人</div>
            <div>未完了タスク {openTasks}件</div>
            <div>API設定候補 {configuredCount}件 / 接続確認未実施</div>
          </div>
        </div>
      </GlassPanel>

      <div className="overview-grid">
        {summaryCards.map((card) => (
          <Card className="kpi-card" key={card.label}>
            <p className="eyebrow">{card.label}</p>
            <h3>{card.value}</h3>
            <p>{card.hint}</p>
          </Card>
        ))}
      </div>

      <div className="overview-grid overview-grid--wide">
        <GlassPanel className="overview-panel">
          <SectionTitle eyebrow="APPROVAL QUEUE" title="承認待ちリスト" action={<Button onClick={() => setPage("approval")}>確認</Button>} />
          {approvalsOS.length ? (
            <div className="approval-list">
              {approvalsOS.map((item) => (
                <div className="approval-item" key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.status}</p>
                  </div>
                  <StatusBadge status={item.priority === "high" ? "warning" : "soft"} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="承認待ちはありません" message="AIが用意した案件はここに集約されます。" />
          )}
        </GlassPanel>

        <GlassPanel className="overview-panel">
          <SectionTitle eyebrow="AI WORKFORCE" title="AI社員のMock状態" />
          <input className="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="AI社員を検索" />
          <div className="agent-mini-grid">
            {filteredAgents.slice(0, 4).map((agent) => (
              <div className="agent-mini-card" key={agent.id}>
                <div className="agent-mini-card__top">
                  <span className="agent-icon">{agent.icon}</span>
                  <StatusBadge status={agent.status} />
                </div>
                <strong>{agent.name}</strong>
                <p>{agent.specialty}</p>
                <small>{agent.taskCount}件のMock担当</small>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>

      <div className="overview-grid overview-grid--wide">
        <GlassPanel className="overview-panel">
          <SectionTitle eyebrow="TREND SIGNAL" title="市場シグナル" />
          <div className="score-grid">
            {trendScores.map((score) => (
              <div className="score-card" key={score.label}>
                <span>{score.value}</span>
                <p>{score.label}</p>
              </div>
            ))}
          </div>
          <div className="insight-list">
            {marketInsights.map((insight) => (
              <div className="insight-item" key={insight.id}>
                <strong>{insight.title}</strong>
                <p>{insight.detail}</p>
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel className="overview-panel">
          <SectionTitle eyebrow="OPERATIONS" title="次に取るべき行動" />
          <div className="next-action-card">
            <strong>{primaryAction.title}</strong>
            <p>{primaryAction.action}を進めると、次の判断に入れます。</p>
            <Button onClick={() => setPage("assistant")}>AIに相談</Button>
          </div>
          <div className="integration-list">
            {integrations.slice(0, 5).map((item) => (
              <div className="integration-item" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.description}</p>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>

      <div className="overview-grid overview-grid--wide">
        <GlassPanel className="overview-panel">
          <SectionTitle eyebrow="NOTIFICATIONS" title="重要通知" />
          <div className="notification-list">
            {notifications.slice(0, 3).map((item) => (
              <div className="notification-item" key={item.id}>
                <strong>{item.title}</strong>
                <p>{item.type}</p>
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel className="overview-panel">
          <SectionTitle eyebrow="WORKFLOW" title="自動化フロー" />
          <div className="workflow-list">
            {tasks.slice(0, 3).map((task) => (
              <div className="workflow-item" key={task.id}>
                <strong>{task.title}</strong>
                <p>{task.note}</p>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>
    </MotionBackground>
  );
};

export default memo(OperatorOverview);
