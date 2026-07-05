import { useState } from "react";
import "./styles.css";

import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
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
import { initialNotifications } from "./data/notifications";
import { initialTodos } from "./data/todos";

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [savedAt, setSavedAt] = useState("未保存");

  const [programs, setPrograms] = useLocalStorage("nexora-programs", initialPrograms, setSavedAt);
  const [approvals, setApprovals] = useLocalStorage("nexora-approvals", initialApprovals, setSavedAt);
  const [analytics, setAnalytics] = useLocalStorage("nexora-analytics", initialAnalytics, setSavedAt);
  const [draft, setDraft] = useLocalStorage("nexora-draft", initialDraft, setSavedAt);
  const [notifications, setNotifications] = useLocalStorage("nexora-notifications", initialNotifications, setSavedAt);
  const [todos, setTodos] = useLocalStorage("nexora-todos", initialTodos, setSavedAt);

  const resetAll = () => {
    const ok = window.confirm("保存データを初期化しますか？");
    if (!ok) return;

    localStorage.removeItem("nexora-programs");
    localStorage.removeItem("nexora-approvals");
    localStorage.removeItem("nexora-analytics");
    localStorage.removeItem("nexora-draft");
    localStorage.removeItem("nexora-notifications");
    localStorage.removeItem("nexora-todos");

    setPrograms(initialPrograms);
    setApprovals(initialApprovals);
    setAnalytics(initialAnalytics);
    setDraft(initialDraft);
    setNotifications(initialNotifications);
    setTodos(initialTodos);
    setPage("dashboard");
    setSavedAt("初期化済み");
  };

  const pages = {
    dashboard: <Dashboard approvals={approvals} programs={programs} analytics={analytics} todos={todos} notifications={notifications} savedAt={savedAt} setPage={setPage} />,
    affiliate: <AffiliateHub programs={programs} setPrograms={setPrograms} setDraft={setDraft} setPage={setPage} savedAt={savedAt} />,
    content: <ContentStudio draft={draft} setDraft={setDraft} setApprovals={setApprovals} setPage={setPage} savedAt={savedAt} />,
    approval: <ApprovalCenter approvals={approvals} setApprovals={setApprovals} setAnalytics={setAnalytics} savedAt={savedAt} />,
    analytics: <Analytics analytics={analytics} approvals={approvals} savedAt={savedAt} />,
    assistant: <AIAssistant programs={programs} approvals={approvals} savedAt={savedAt} />,
    settings: <Settings resetAll={resetAll} savedAt={savedAt} notifications={notifications} setNotifications={setNotifications} todos={todos} setTodos={setTodos} />,
  };

  return (
    <div className="app-shell">
      <Sidebar page={page} setPage={setPage} />
      {pages[page]}
      <FloatingAssistant approvals={approvals} />
    </div>
  );
}
