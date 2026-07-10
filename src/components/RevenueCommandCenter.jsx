import { useState } from "react";
import { mvp15WorkforceRegistry } from "../data/aiWorkforceRegistry.js";
import { mockEventLedger } from "../data/mockEventLedger.js";
import { CAMPAIGN_TYPES } from "../services/revenueCampaignService";
import { validateEventLedger } from "../services/eventLedgerService.js";
import OwnerActionQueue from "./OwnerActionQueue";
import RevenueSummaryCards from "./RevenueSummaryCards";

const detailStages = ["Opportunity", "Campaign", "Package", "Approval", "Result", "Revenue"];
const priorityEmployeeIds = ["F01", "M26", "F24", "F04", "F16"];

function getCampaignTypeCount(campaigns, campaignType) {
  return campaigns.filter((campaign) => campaign.campaignType === campaignType).length;
}

function getPendingApprovals(approvals, approvalsOS) {
  return [...approvals, ...approvalsOS].filter((item) => String(item.status || "").includes("待") || String(item.status || "").includes("謇")).length;
}

function getForecastRevenue(forecasts) {
  return forecasts.find((item) => String(item.label || "").includes("Revenue") || String(item.label || "").includes("売上") || String(item.label || "").includes("螢"))?.value || 0;
}

function getMockRevenue(revenues) {
  return revenues.find((item) => String(item.label || "").includes("Mock"))?.value || revenues[0]?.value || 0;
}

function buildOwnerActions({ hasCampaigns, pendingApprovals }) {
  return [
    {
      title: hasCampaigns ? "Revenue Packageを確認する" : "Campaignを作成する",
      reason: hasCampaigns ? "次の判断は、収益化パッケージの確認です。" : "収益化の起点になるMock Campaignが必要です。",
      nextScreen: "Campaign",
      page: "campaign",
      aiOwner: "Aegis / Ren",
    },
    {
      title: "承認待ちを確認する",
      reason: `${pendingApprovals}件のOwner確認があります。`,
      nextScreen: "Approval",
      page: "approval",
      aiOwner: "Aegis",
    },
    {
      title: "Legal確認を進める",
      reason: "公開や外部意図の前に、Mockレビューが必要です。",
      nextScreen: "Operations",
      page: "operations",
      aiOwner: "Aoi",
    },
    {
      title: "Brand QAを見る",
      reason: "表現・導線・クリエイティブのズレを先に減らします。",
      nextScreen: "Campaign",
      page: "campaign",
      aiOwner: "Yui / Kana",
    },
    {
      title: "Performanceを確認する",
      reason: "Forecast、Mock、未接続のActualを分けて確認します。",
      nextScreen: "Analytics",
      page: "analytics",
      aiOwner: "Hana",
    },
  ];
}

function ToggleButton({ open, onClick, children }) {
  return (
    <button className="detail-toggle" onClick={onClick} type="button">
      {open ? "閉じる" : children}
    </button>
  );
}

function PipelineSummary({ shortTermCount, coreMediaCount, expanded, onToggle }) {
  return (
    <section className="panel compact-command-panel">
      <div className="section-head compact">
        <div>
          <p className="eyebrow">Revenue Pipeline</p>
          <h2>収益パイプライン</h2>
        </div>
        <ToggleButton open={expanded} onClick={onToggle}>詳細を見る</ToggleButton>
      </div>
      <div className="pipeline-summary-grid">
        <div>
          <span>短期収益</span>
          <strong>進行中 {shortTermCount}件</strong>
          <p>SHORT_TERM_SERVICE</p>
        </div>
        <div>
          <span>本命事業</span>
          <strong>準備中 {coreMediaCount}件</strong>
          <p>CORE_MEDIA</p>
        </div>
      </div>
      {expanded && (
        <div className="pipeline-detail-flow">
          {detailStages.map((stage) => (
            <span key={stage}>{stage}</span>
          ))}
        </div>
      )}
    </section>
  );
}

function AiSummary({ expanded, onToggle }) {
  const activeCount = mvp15WorkforceRegistry.filter((employee) => employee.runtimeStatus === "MOCK_READY").length;
  const priorityEmployees = priorityEmployeeIds.map((id) => mvp15WorkforceRegistry.find((employee) => employee.employeeId === id)).filter(Boolean);
  const employees = expanded ? mvp15WorkforceRegistry : priorityEmployees;

  return (
    <section className="panel compact-command-panel">
      <div className="section-head compact">
        <div>
          <p className="eyebrow">AI Workforce</p>
          <h2>AI社員</h2>
        </div>
        <ToggleButton open={expanded} onClick={onToggle}>全員を見る</ToggleButton>
      </div>
      <div className="ai-summary-strip">
        <div><strong>{activeCount}名</strong><span>Mock稼働</span></div>
        <div><strong>0名</strong><span>要確認</span></div>
        <div><strong>0名</strong><span>停止中</span></div>
        <div><strong>無効</strong><span>外部実行</span></div>
      </div>
      <div className="workforce-summary-grid compact">
        {employees.map((employee) => (
          <div className="workforce-summary-card" key={employee.employeeId}>
            <span className="badge">{employee.employeeId}</span>
            <strong>{employee.displayName}</strong>
            <p>{employee.departmentName}</p>
            <ul>
              <li>担当: {employee.supportedArtifactTypes[0]}</li>
              <li>Mock稼働: true</li>
              <li>次の仕事: {employee.primaryResponsibilities[0]}</li>
              <li>停止理由: 外部実行無効</li>
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function EventSummary({ expanded, onToggle }) {
  const eventValidation = validateEventLedger(mockEventLedger);
  const events = [...mockEventLedger].sort((a, b) => b.sequenceNo - a.sequenceNo).slice(0, expanded ? 6 : 3);

  return (
    <section className="panel compact-command-panel">
      <div className="section-head compact">
        <div>
          <p className="eyebrow">Event Summary</p>
          <h2>最新イベント履歴</h2>
          <p className="muted">Mock監査履歴 / 正式な監査証跡ではありません</p>
        </div>
        <ToggleButton open={expanded} onClick={onToggle}>履歴を見る</ToggleButton>
      </div>
      <div className="event-summary-list compact">
        {events.map((event) => (
          <div className="event-summary-item" key={event.eventId}>
            <span>{event.sequenceNo}</span>
            <strong>{event.eventName}</strong>
            <small>{event.actor.displayName} / {event.target.targetType}</small>
            <em>{event.occurredAt}</em>
          </div>
        ))}
      </div>
      <small className="command-note">Validation: {eventValidation.valid ? "OK" : "NG"} / Read only</small>
    </section>
  );
}

export default function RevenueCommandCenter({
  approvals = [],
  approvalsOS = [],
  forecasts = [],
  revenues = [],
  revenueCampaigns = [],
  campaigns = [],
  tasks = [],
  budget,
  setPage,
}) {
  const [openPanel, setOpenPanel] = useState("");
  const combinedCampaignCount = revenueCampaigns.length + campaigns.length;
  const shortTermCount = getCampaignTypeCount(revenueCampaigns, CAMPAIGN_TYPES.SHORT_TERM_SERVICE);
  const coreMediaCount = getCampaignTypeCount(revenueCampaigns, CAMPAIGN_TYPES.CORE_MEDIA) + campaigns.length;
  const pendingApprovals = getPendingApprovals(approvals, approvalsOS);
  const activeAi = mvp15WorkforceRegistry.filter((employee) => employee.runtimeStatus === "MOCK_READY").length;
  const openTasks = tasks.filter((task) => task.status !== "done").length;
  const forecastRevenue = getForecastRevenue(forecasts);
  const mockRevenue = getMockRevenue(revenues);
  const ownerActions = buildOwnerActions({ hasCampaigns: combinedCampaignCount > 0, pendingApprovals });
  const nextAction = ownerActions[0];

  const togglePanel = (panelName) => setOpenPanel((current) => (current === panelName ? "" : panelName));

  return (
    <main className="content revenue-command-center">
      <section className="hero revenue-command-hero simplified">
        <div>
          <p className="eyebrow">売上司令室 / Revenue Command Center</p>
          <h1>おはようございます。今日の優先事項を確認しましょう。</h1>
          <p className="lead">
            ここはOwnerの意思決定画面です。表示のみで、承認確定・収益確定・外部実行は行いません。
          </p>
          <div className="connection-flow">
            <span>開発モード</span>
            <span>Mock Only</span>
            <span>外部接続なし</span>
            <span>本番OFF</span>
          </div>
        </div>
        <div className="today-focus-card">
          <p className="eyebrow">今日やること</p>
          <strong>{nextAction.title}</strong>
          <p>まずはこの1件を確認してください。</p>
          <button type="button" onClick={() => setPage(nextAction.page)}>確認先へ移動</button>
        </div>
      </section>

      <OwnerActionQueue actions={ownerActions} setPage={setPage} />

      <RevenueSummaryCards
        campaignCount={combinedCampaignCount}
        pendingApprovals={pendingApprovals}
        pipelineCount={openTasks}
        forecastRevenue={forecastRevenue}
        mockRevenue={mockRevenue}
        budgetRemaining={budget?.monthlyRemaining || 0}
        activeAi={activeAi}
        eventCount={mockEventLedger.length}
        expanded={openPanel === "kpi"}
      />

      <section className="command-collapse-row">
        <ToggleButton open={openPanel === "kpi"} onClick={() => togglePanel("kpi")}>補助KPIを見る</ToggleButton>
        <ToggleButton open={openPanel === "pipeline"} onClick={() => togglePanel("pipeline")}>Pipeline詳細</ToggleButton>
        <ToggleButton open={openPanel === "ai"} onClick={() => togglePanel("ai")}>AI社員詳細</ToggleButton>
        <ToggleButton open={openPanel === "events"} onClick={() => togglePanel("events")}>Event履歴</ToggleButton>
      </section>

      <PipelineSummary
        shortTermCount={shortTermCount}
        coreMediaCount={coreMediaCount}
        expanded={openPanel === "pipeline"}
        onToggle={() => togglePanel("pipeline")}
      />

      <AiSummary expanded={openPanel === "ai"} onToggle={() => togglePanel("ai")} />

      <EventSummary expanded={openPanel === "events"} onToggle={() => togglePanel("events")} />
    </main>
  );
}
