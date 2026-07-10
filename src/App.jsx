import { useMemo, useState } from "react";
import "./styles.css";
import ErrorBoundary from "./components/ErrorBoundary";
import BudgetGuardModal from "./components/BudgetGuardModal";
import { canExecute, createBudgetState, createPhase1Context, defaultBudgetConfig, EXECUTION_MODES } from "./services/safetyEngine";

import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import AICEO from "./components/AICEO";
import TrendIntelligence from "./components/TrendIntelligence";
import WorkflowAutomation from "./components/WorkflowAutomation";
import APIControlCenter from "./components/APIControlCenter";
import OpportunityEngine from "./components/OpportunityEngine";
import WorkCommand from "./components/WorkCommand";
import WorkEngine from "./components/WorkEngine";
import AffiliateHub from "./components/AffiliateHub";
import ContentStudio from "./components/ContentStudio";
import ApprovalCenter from "./components/ApprovalCenter";
import Analytics from "./components/Analytics";
import AIAssistant from "./components/AIAssistant";
import Settings from "./components/Settings";
import FloatingAssistant from "./components/FloatingAssistant";

import { useLocalStorage } from "./hooks/useLocalStorage";
import { initialPrograms } from "./data/programs";
import { initialApprovals } from "./data/approvals";
import { initialAnalytics } from "./data/analytics";
import { initialDraft } from "./data/draft";
import { initialNotifications as initialLegacyNotifications } from "./data/notifications";
import { initialTodos } from "./data/todos";
import { initialChatMessages } from "./data/chat";
import { initialOpportunities } from "./data/opportunities";
import { initialPipelineRuns } from "./data/pipeline";
import { initialMissionTasks } from "./data/tasks";
import { initialWorkItems } from "./data/workItems";
import { initialTrendItems } from "./services/trendEngine";
import { initialBusinessMemory, initialOpportunities as initialRevenueOpportunities } from "./services/opportunityEngine";
import BusinessMemory from "./components/BusinessMemory";
import { initialDecisionJournal, initialMemoryRecords } from "./services/memoryEngine";
import HomeCommandCenter from "./components/HomeCommandCenter";
import CampaignOS from "./components/CampaignOS";
import RevenueCampaignFoundation from "./components/RevenueCampaignFoundation";
import OperationCommandCenter from "./components/OperationCommandCenter";
import RevenueCommandCenter from "./components/RevenueCommandCenter";
import { initialCampaigns } from "./services/campaignEngine";
import {
  initialAgents,
  initialTasks,
  initialIntegrations,
  initialWorkflows,
  initialNotifications as initialPlatformNotifications,
  initialApiStatuses,
  initialDepartments,
  initialModes,
  initialApprovalsOS,
  initialRevenues,
  initialForecasts,
  initialRisks,
  initialTrendScores,
  initialMarketInsights,
  initialNextActions,
} from "./data/platformOS";

export default function App() {
  const [page, setPage] = useState("home");
  const [savedAt, setSavedAt] = useState("未保存");
  const [budget] = useState(() => createBudgetState(defaultBudgetConfig));
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  const [programs, setPrograms] = useLocalStorage("nexora-programs", initialPrograms, setSavedAt);
  const [approvals, setApprovals] = useLocalStorage("nexora-approvals", initialApprovals, setSavedAt);
  const [analytics, setAnalytics] = useLocalStorage("nexora-analytics", initialAnalytics, setSavedAt);
  const [draft, setDraft] = useLocalStorage("nexora-draft", initialDraft, setSavedAt);
  const [notifications, setNotifications] = useLocalStorage("nexora-notifications", initialLegacyNotifications, setSavedAt);
  const [todos, setTodos] = useLocalStorage("nexora-todos", initialTodos, setSavedAt);
  const [chatMessages, setChatMessages] = useLocalStorage("nexora-chat", initialChatMessages, setSavedAt);
  const [opportunities, setOpportunities] = useLocalStorage("nexora-opportunities", initialOpportunities, setSavedAt);
  const [pipelineRuns, setPipelineRuns] = useLocalStorage("kevirio-pipeline-runs", initialPipelineRuns, setSavedAt);
  const [missionTasks, setMissionTasks] = useLocalStorage("kevirio-mission-tasks", initialMissionTasks, setSavedAt);
  const [workItems, setWorkItems] = useLocalStorage("kevirio-work-items", initialWorkItems, setSavedAt);
  const [trendItems, setTrendItems] = useLocalStorage("kevirio-trend-items", initialTrendItems, setSavedAt);
  const [revenueOpportunities, setRevenueOpportunities] = useLocalStorage("kevirio-revenue-opportunities", initialRevenueOpportunities, setSavedAt);
  const [businessMemory, setBusinessMemory] = useLocalStorage("kevirio-business-memory", initialBusinessMemory, setSavedAt);
  const [memoryRecords, setMemoryRecords] = useLocalStorage("kevirio-memory-records", initialMemoryRecords, setSavedAt);
  const [decisionJournal, setDecisionJournal] = useLocalStorage("kevirio-decision-journal", initialDecisionJournal, setSavedAt);
  const [campaigns, setCampaigns] = useLocalStorage("kevirio-campaigns", initialCampaigns, setSavedAt);
  const [revenueCampaigns, setRevenueCampaigns] = useLocalStorage("kevirio.revenueCampaigns.v1", [], setSavedAt);
  const [agents, setAgents] = useLocalStorage("kevirio-agents", initialAgents, setSavedAt);
  const [platformTasks, setPlatformTasks] = useLocalStorage("kevirio-platform-tasks", initialTasks, setSavedAt);
  const [integrations, setIntegrations] = useLocalStorage("kevirio-integrations", initialIntegrations, setSavedAt);
  const [workflows, setWorkflows] = useLocalStorage("kevirio-workflows", initialWorkflows, setSavedAt);
  const [platformNotifications, setPlatformNotifications] = useLocalStorage("kevirio-platform-notifications", initialPlatformNotifications, setSavedAt);
  const [apiStatuses, setApiStatuses] = useLocalStorage("kevirio-api-statuses", initialApiStatuses, setSavedAt);
  const [departments, setDepartments] = useLocalStorage("kevirio-departments", initialDepartments, setSavedAt);
  const [modes, setModes] = useLocalStorage("kevirio-modes", initialModes, setSavedAt);
  const [approvalsOS, setApprovalsOS] = useLocalStorage("kevirio-approvals-os", initialApprovalsOS, setSavedAt);
  const [revenues, setRevenues] = useLocalStorage("kevirio-revenues", initialRevenues, setSavedAt);
  const [forecasts, setForecasts] = useLocalStorage("kevirio-forecasts", initialForecasts, setSavedAt);
  const [risks, setRisks] = useLocalStorage("kevirio-risks", initialRisks, setSavedAt);
  const [trendScores, setTrendScores] = useLocalStorage("kevirio-trend-scores", initialTrendScores, setSavedAt);
  const [marketInsights, setMarketInsights] = useLocalStorage("kevirio-market-insights", initialMarketInsights, setSavedAt);
  const [nextActions, setNextActions] = useLocalStorage("kevirio-next-actions", initialNextActions, setSavedAt);

  const resetAll = () => {
    const ok = window.confirm("保存データを初期化しますか？");
    if (!ok) return;

    localStorage.removeItem("nexora-programs");
    localStorage.removeItem("nexora-approvals");
    localStorage.removeItem("nexora-analytics");
    localStorage.removeItem("nexora-draft");
    localStorage.removeItem("nexora-notifications");
    localStorage.removeItem("nexora-todos");
    localStorage.removeItem("nexora-chat");
    localStorage.removeItem("nexora-opportunities");
    localStorage.removeItem("nexora-pipeline-runs");
    localStorage.removeItem("kevirio.revenueCampaigns.v1");

    setPrograms(initialPrograms);
    setApprovals(initialApprovals);
    setAnalytics(initialAnalytics);
    setDraft(initialDraft);
    setNotifications(initialLegacyNotifications);
    setTodos(initialTodos);
    setChatMessages(initialChatMessages);
    setRevenueOpportunities(initialRevenueOpportunities);
    setPipelineRuns(initialPipelineRuns);
    setMissionTasks(initialMissionTasks);
    setWorkItems(initialWorkItems);
    setTrendItems(initialTrendItems);
    setWorkflows(initialWorkflows);
    setMemoryRecords(initialMemoryRecords);
    setDecisionJournal(initialDecisionJournal);
    setCampaigns(initialCampaigns);
    setRevenueCampaigns([]);
    setRevenueOpportunities(initialRevenueOpportunities);
    setBusinessMemory(initialBusinessMemory);
    setAgents(initialAgents);
    setPlatformTasks(initialTasks);
    setIntegrations(initialIntegrations);
    setWorkflows(initialWorkflows);
    setPlatformNotifications(initialPlatformNotifications);
    setApiStatuses(initialApiStatuses);
    setDepartments(initialDepartments);
    setModes(initialModes);
    setApprovalsOS(initialApprovalsOS);
    setRevenues(initialRevenues);
    setForecasts(initialForecasts);
    setRisks(initialRisks);
    setTrendScores(initialTrendScores);
    setMarketInsights(initialMarketInsights);
    setNextActions(initialNextActions);
    setPage("home");
    setSavedAt("初期化済み");
  };

  const pages = useMemo(() => ({
    home: <RevenueCommandCenter approvals={approvals} approvalsOS={approvalsOS} forecasts={forecasts} revenues={revenues} revenueCampaigns={revenueCampaigns} campaigns={campaigns} tasks={platformTasks} budget={budget} setPage={setPage} />,
    campaign: (
      <main className="content">
        <RevenueCampaignFoundation budget={budget} revenueCampaigns={revenueCampaigns} setRevenueCampaigns={setRevenueCampaigns} />
        <CampaignOS embedded campaigns={campaigns} setCampaigns={setCampaigns} setDraft={setDraft} setApprovals={setApprovals} setWorkflows={setWorkflows} setDecisionJournal={setDecisionJournal} setMemoryRecords={setMemoryRecords} setPage={setPage} />
      </main>
    ),
    ceo: <AICEO workItems={workItems} missionTasks={missionTasks} approvals={approvals} analytics={analytics} pipelineRuns={pipelineRuns} setPage={setPage} />,
    apiCenter: <APIControlCenter setPage={setPage} budget={budget} />,
    memory: <BusinessMemory memoryRecords={memoryRecords} setMemoryRecords={setMemoryRecords} decisionJournal={decisionJournal} setDecisionJournal={setDecisionJournal} setPage={setPage} />,
    opportunity: <OpportunityEngine opportunities={revenueOpportunities} setOpportunities={setRevenueOpportunities} businessMemory={businessMemory} setBusinessMemory={setBusinessMemory} analytics={analytics} setWorkflows={setWorkflows} setDraft={setDraft} setPage={setPage} />,
    trends: <TrendIntelligence trendItems={trendItems} setTrendItems={setTrendItems} setDraft={setDraft} setPage={setPage} />,
    workflows: <WorkflowAutomation workflows={workflows} setWorkflows={setWorkflows} trendItems={trendItems} workItems={workItems} setMissionTasks={setMissionTasks} setDraft={setDraft} setApprovals={setApprovals} setNotifications={setNotifications} setPage={setPage} />,
    dashboard: <Dashboard approvals={approvals} programs={programs} analytics={analytics} notifications={notifications} opportunities={opportunities} pipelineRuns={pipelineRuns} missionTasks={missionTasks} setMissionTasks={setMissionTasks} savedAt={savedAt} setPage={setPage} />,
    workEngine: <WorkEngine workItems={workItems} setWorkItems={setWorkItems} setMissionTasks={setMissionTasks} setDraft={setDraft} setApprovals={setApprovals} setNotifications={setNotifications} setPage={setPage} />,
    work: <WorkCommand opportunities={opportunities} setOpportunities={setOpportunities} pipelineRuns={pipelineRuns} setPipelineRuns={setPipelineRuns} setDraft={setDraft} setApprovals={setApprovals} setNotifications={setNotifications} setPage={setPage} savedAt={savedAt} />,
    affiliate: <AffiliateHub programs={programs} setPrograms={setPrograms} setDraft={setDraft} setPage={setPage} savedAt={savedAt} />,
    content: <ContentStudio draft={draft} setDraft={setDraft} setApprovals={setApprovals} setPage={setPage} savedAt={savedAt} />,
    approval: <ApprovalCenter approvals={approvals} setApprovals={setApprovals} setAnalytics={setAnalytics} savedAt={savedAt} />,
    analytics: <Analytics analytics={analytics} approvals={approvals} savedAt={savedAt} setPage={setPage} />,
    operations: <OperationCommandCenter tasks={platformTasks} integrations={integrations} workflows={workflows} setPage={setPage} />,
    assistant: <AIAssistant programs={programs} approvals={approvals} chatMessages={chatMessages} setChatMessages={setChatMessages} setDraft={setDraft} setPage={setPage} savedAt={savedAt} />,
    settings: <Settings resetAll={resetAll} savedAt={savedAt} notifications={notifications} setNotifications={setNotifications} todos={todos} setTodos={setTodos} />,
  }), [
    agents,
    analytics,
    approvals,
    approvalsOS,
    apiStatuses,
    budget,
    businessMemory,
    campaigns,
    chatMessages,
    departments,
    draft,
    forecasts,
    integrations,
    marketInsights,
    memoryRecords,
    missionTasks,
    modes,
    nextActions,
    notifications,
    opportunities,
    pipelineRuns,
    platformNotifications,
    platformTasks,
    programs,
    revenueOpportunities,
    revenueCampaigns,
    revenues,
    risks,
    setApprovals,
    setAnalytics,
    setBusinessMemory,
    setCampaigns,
    setChatMessages,
    setDecisionJournal,
    setDraft,
    setMissionTasks,
    setMemoryRecords,
    setNotifications,
    setOpportunities,
    setPage,
    setPipelineRuns,
    setPrograms,
    setRevenueOpportunities,
    setRevenueCampaigns,
    setSavedAt,
    setTodos,
    setTrendItems,
    setWorkItems,
    setWorkflows,
    todos,
    trendItems,
    trendScores,
    workItems,
    workflows,
    workItems,
    savedAt,
    decisionJournal,
    setApprovals,
    setAnalytics,
    setCampaigns,
    setChatMessages,
    setDecisionJournal,
    setDraft,
    setMissionTasks,
    setMemoryRecords,
    setNotifications,
    setOpportunities,
    setPage,
    setPipelineRuns,
    setPrograms,
    setRevenueOpportunities,
    setSavedAt,
    setTodos,
    setTrendItems,
    setWorkItems,
    setWorkflows,
    todos,
    trendItems,
    trendScores,
    workItems,
    workflows,
  ]);

  return (
    <div className="app-shell">
      <Sidebar page={page} setPage={setPage} />
      <ErrorBoundary>
        {pages[page]}
      </ErrorBoundary>
      <FloatingAssistant approvals={approvals} setPage={setPage} />
      <BudgetGuardModal
        budget={budget}
        open={showBudgetModal}
        onApprove={() => {
          const guard = canExecute(createPhase1Context({
            executionMode: EXECUTION_MODES.DEVELOPMENT,
            actionType: "external-api",
            isExternalRequest: true,
            ownerApproved: true,
            approvalValid: true,
            provider: { id: "external-provider", status: "configured-unverified" },
            mockOnly: false,
          }));
          setShowBudgetModal(false);
          setSavedAt(`Owner確認候補: Phase1-Aでは外部処理は実行しません (${guard.reasonCode})`);
        }}
        onCancel={() => setShowBudgetModal(false)}
      />
    </div>
  );
}
