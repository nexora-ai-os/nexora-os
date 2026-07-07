import {
  approveWorkflow,
  buildWorkflowFromTrend,
  buildWorkflowFromWork,
  executeWorkflow,
  holdWorkflow,
  rejectWorkflow,
  workflowTemplates,
} from "../services/workflowEngine";
import { analyzeTrends } from "../services/trendEngine";
import { analyzeWorkItems } from "../services/workEngine";

export default function WorkflowAutomation({
  workflows,
  setWorkflows,
  trendItems,
  workItems,
  setMissionTasks,
  setDraft,
  setApprovals,
  setNotifications,
  setPage,
}) {
  const analyzedTrends = analyzeTrends(trendItems);
  const analyzedWork = analyzeWorkItems(workItems);

  const addTrendWorkflow = (item) => {
    const workflow = buildWorkflowFromTrend(item);
    setWorkflows((prev) => [workflow, ...prev]);
  };

  const addWorkWorkflow = (item) => {
    const workflow = buildWorkflowFromWork(item);
    setWorkflows((prev) => [workflow, ...prev]);
  };

  const runWorkflow = (workflow) => {
    const updated = executeWorkflow({
      workflow,
      setMissionTasks,
      setDraft,
      setApprovals,
      setNotifications,
    });

    setWorkflows((prev) => prev.map((item) => (item.id === workflow.id ? updated : item)));
  };

  const updateDecision = (workflow, decision) => {
    const updated =
      decision === "approve"
        ? approveWorkflow(workflow)
        : decision === "reject"
          ? rejectWorkflow(workflow)
          : holdWorkflow(workflow);

    setWorkflows((prev) => prev.map((item) => (item.id === workflow.id ? updated : item)));
  };

  const askCEO = (workflow) => {
    const message = `Workflow Automationの判断をAI CEOとしてレビューしてください。

案件:${workflow.title}
関連:${workflow.relatedProgram}
期待売上:${workflow.expectedRevenue}円
リスク:${workflow.riskLevel}
Confidence:${workflow.confidence}%
理由:${workflow.reason}

必ず「事実」「推測」「意見」「リスク」「推奨」「最終決裁待ち」に分けてください。`;

    localStorage.setItem("kevirio-pending-ai-message", message);
    setPage("assistant");
  };

  const stats = {
    total: workflows.length,
    pending: workflows.filter((item) => item.status === "pending-owner").length,
    review: workflows.filter((item) => item.status === "owner-review").length,
    approved: workflows.filter((item) => item.status === "approved-by-owner").length,
  };

  return (
    <main className="content">
      <section className="hero">
        <p className="eyebrow">WORKFLOW AUTOMATION v3.1</p>
        <h1>案件を選ぶ。AIが会社の流れに乗せる。</h1>
        <p className="lead">
          Trend・Work候補を、Connection Core経由でMission・Content・Approvalへ接続します。AIは提案と準備まで。最終決裁は必ずオーナーです。
        </p>
      </section>

      <div className="stats">
        <div className="stat-card"><span>Workflow</span><strong>{stats.total}件</strong><p>登録済み</p></div>
        <div className="stat-card"><span>実行待ち</span><strong>{stats.pending}件</strong><p>Owner Decision前</p></div>
        <div className="stat-card"><span>決裁待ち</span><strong>{stats.review}件</strong><p>最終確認</p></div>
        <div className="stat-card"><span>承認済み</span><strong>{stats.approved}件</strong><p>オーナー承認</p></div>
      </div>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">TEMPLATES</p>
            <h2>Workflowテンプレート</h2>
          </div>
          <span className="badge">Human Final</span>
        </div>
        <div className="grid">
          {workflowTemplates.map((template) => (
            <div className="card" key={template.id}>
              <span className="badge">{template.id}</span>
              <h2>{template.name}</h2>
              <p>{template.description}</p>
              <div className="mission-list">
                {template.steps.map((step) => <div key={step}>□ {step}</div>)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">CREATE FROM TREND</p>
            <h2>TrendからWorkflow作成</h2>
          </div>
          <button onClick={() => setPage("trends")}>Trend Intelligenceへ</button>
        </div>
        <div className="grid">
          {analyzedTrends.slice(0, 3).map((item) => (
            <div className="card" key={item.id}>
              <span className="badge">Score {item.score}</span>
              <h2>{item.theme}</h2>
              <p>{item.reason}</p>
              <ul>
                <li>判断：{item.decision}</li>
                <li>関連：{item.relatedProgram || "未設定"}</li>
                <li>次：{item.nextAction}</li>
              </ul>
              <div className="actions">
                <button onClick={() => addTrendWorkflow(item)}>Workflow化</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">CREATE FROM WORK</p>
            <h2>WorkからWorkflow作成</h2>
          </div>
          <button onClick={() => setPage("workEngine")}>Work Engineへ</button>
        </div>
        <div className="grid">
          {analyzedWork.slice(0, 3).map((item) => (
            <div className="card" key={item.id}>
              <span className="badge">Score {item.score}</span>
              <h2>{item.title}</h2>
              <p>{item.reason}</p>
              <ul>
                <li>ROI：{item.roiPerHour.toLocaleString()}円/h</li>
                <li>判断：{item.decision}</li>
                <li>リスク：{item.riskComment}</li>
              </ul>
              <div className="actions">
                <button onClick={() => addWorkWorkflow(item)}>Workflow化</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">WORKFLOW QUEUE</p>
            <h2>実行キュー</h2>
          </div>
          <span className="badge">Owner Final Decision</span>
        </div>

        <div className="grid">
          {workflows.length === 0 && (
            <div className="card">
              <h2>Workflow未登録</h2>
              <p>TrendまたはWorkからWorkflowを作成してください。</p>
            </div>
          )}

          {workflows.map((workflow) => (
            <div className="card workflow-card" key={workflow.id}>
              <div className="card-header">
                <span className="badge">{workflow.source}</span>
                <span className="badge">{workflow.ownerDecision}</span>
              </div>
              <h2>{workflow.title}</h2>
              <p>{workflow.reason}</p>
              <ul>
                <li>関連：{workflow.relatedProgram}</li>
                <li>期待売上：{Number(workflow.expectedRevenue || 0).toLocaleString()}円</li>
                <li>Risk：{workflow.riskLevel}</li>
                <li>Confidence：{workflow.confidence}%</li>
              </ul>

              <div className="mission-list">
                {workflow.steps.map((step) => (
                  <div key={step.id}>
                    {step.status === "done" ? "✅" : "□"} {step.label}
                  </div>
                ))}
              </div>

              <div className="ai-report">
                <strong>AI権限</strong>
                <p>AIは分析・下書き・承認待ち作成まで。公開・契約・支払い・投稿確定は実行しません。最終決裁はオーナーです。</p>
              </div>

              <div className="actions">
                <button onClick={() => runWorkflow(workflow)}>Workflow実行</button>
                <button onClick={() => askCEO(workflow)}>AI CEOレビュー</button>
                <button onClick={() => updateDecision(workflow, "approve")}>承認</button>
                <button onClick={() => updateDecision(workflow, "hold")}>保留</button>
                <button onClick={() => updateDecision(workflow, "reject")}>却下</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
