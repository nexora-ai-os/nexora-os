import TopBar from "./TopBar";
import { buildMissionSummary, priorityIcon, priorityLabel } from "../services/missionEngine";

export default function Dashboard({
  approvals,
  programs,
  analytics,
  notifications,
  opportunities,
  pipelineRuns,
  missionTasks,
  setMissionTasks,
  savedAt,
  setPage,
}) {
  const unread = notifications.filter((n) => !n.read).length;
  const approved = approvals.filter((a) => a.status === "承認済み").length;
  const predicted = programs.filter((p) => p.favorite).reduce((sum, p) => sum + p.predicted, 0);
  const summary = buildMissionSummary({ tasks: missionTasks, approvals, analytics, pipelineRuns });

  const toggleMissionTask = (id) => {
    setMissionTasks((prev) => prev.map((task) => task.id === id ? { ...task, status: task.status === "done" ? "todo" : "done" } : task));
  };

  const addQuickTask = () => {
    const title = window.prompt("追加する仕事を入力してください");
    if (!title) return;
    setMissionTasks((prev) => [{ id: Date.now(), title, category: "手動追加", priority: "medium", status: "todo", due: "今日", value: 1000, note: "Mission Controlから追加" }, ...prev]);
  };

  const askMissionAI = () => {
    const taskLines = missionTasks
      .filter((task) => task.status !== "done")
      .map((task) => `・${priorityLabel(task.priority)}｜${task.title}｜価値目安${task.value || 0}円`)
      .join("\n");

    const message = `Mission Controlを見て、今日やるべきことを整理してください。\n\n現在の未完了タスク:\n${taskLines}\n\n承認待ち:${summary.waiting}件\n現在売上:${analytics.revenue || 0}円\n月間目標:${summary.monthlyGoal}円\n\n出力は「事実」「推測」「意見」「今すぐやる1つ」に分けてください。`;
    localStorage.setItem("kevirio-pending-ai-message", message);
    setPage("assistant");
  };

  return (
    <main className="content">
      <TopBar notifications={unread + summary.waiting} savedAt={savedAt} />

      <div className="hero mission-hero">
        <div>
          <p className="eyebrow">MISSION CONTROL v2.3</p>
          <h1>今日、最初にやることはこれです。</h1>
          <p className="lead">{summary.focus}</p>
          <div className="actions">
            <button onClick={askMissionAI}>AIに今日の作戦を聞く</button>
            <button onClick={() => setPage("work")}>新しい仕事を登録</button>
            <button onClick={addQuickTask}>タスク追加</button>
          </div>
        </div>
        <div className="mission-orb">
          <span>{summary.progress}%</span>
          <small>Monthly Goal</small>
        </div>
      </div>

      <div className="stats">
        <div className="stat-card"><span>残り目標</span><strong>{summary.remaining.toLocaleString()}円</strong><p>月間目標 {summary.monthlyGoal.toLocaleString()}円</p></div>
        <div className="stat-card"><span>今日の価値目安</span><strong>{summary.projectedValue.toLocaleString()}円</strong><p>未完了タスク合計</p></div>
        <div className="stat-card"><span>未完了タスク</span><strong>{summary.openTasksCount}件</strong><p>最優先 {summary.highTasksCount}件</p></div>
        <div className="stat-card"><span>リスク</span><strong>{summary.riskLevel}</strong><p>承認待ち {summary.waiting}件</p></div>
      </div>

      <section className="panel">
        <div className="section-head">
          <div><p className="eyebrow">TODAY'S MISSIONS</p><h2>今日の実行リスト</h2></div>
          <span className="badge">Revenue First</span>
        </div>

        <div className="mission-list">
          {missionTasks.map((task) => (
            <button key={task.id} className={`wide-btn mission-task ${task.status === "done" ? "done" : ""}`} onClick={() => toggleMissionTask(task.id)}>
              <div className="task-row">
                <strong>{task.status === "done" ? "✅" : "□"} {priorityIcon(task.priority)} {task.title}</strong>
                <span>{priorityLabel(task.priority)}</span>
              </div>
              <p>{task.category}｜期限: {task.due}｜価値目安: {(task.value || 0).toLocaleString()}円</p>
              <small>{task.note}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div><p className="eyebrow">AI BRIEF</p><h2>KEVIRIOの現状判断</h2></div>
          <button onClick={() => setPage("assistant")}>AI Companionへ</button>
        </div>
        <div className="mission-list">
          <div>事実｜承認待ちは{summary.waiting}件、Pipelineは{summary.pipelineCount}件、現在売上は{(analytics.revenue || 0).toLocaleString()}円です。</div>
          <div>推測｜今のボトルネックは「案件数」より「今日の実行量」です。未完了タスクを処理すれば収益導線が進みます。</div>
          <div>意見｜今日は「{summary.focus}」を最初に処理してください。迷ったらAIに作戦を聞いてから動くのが効率的です。</div>
        </div>
      </section>

      <section className="panel">
        <h2>Workflow Summary</h2>
        <div className="mission-list">
          <div>A8・お気に入り案件の予測売上：{predicted.toLocaleString()}円</div>
          <div>Work Queue：{opportunities.length}件</div>
          <div>承認済み：{approved}件</div>
          <div>クリック：{analytics.clicks} / CV：{analytics.cv}</div>
        </div>
      </section>
    </main>
  );
}
