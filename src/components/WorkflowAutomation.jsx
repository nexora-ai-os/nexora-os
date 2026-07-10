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
import { buildAutomationStatus as buildConnectionStatus } from "../services/connectionEngine";
import { buildCostEstimate, canExecute, createPhase1Context, EXECUTION_MODES } from "../services/safetyEngine";

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
  const safeWorkflows = Array.isArray(workflows) ? workflows : [];
  const safeTrendItems = Array.isArray(trendItems) ? trendItems : [];
  const safeWorkItems = Array.isArray(workItems) ? workItems : [];
  const analyzedTrends = analyzeTrends(safeTrendItems);
  const analyzedWork = analyzeWorkItems(safeWorkItems);

  const addTrendWorkflow = (item) => {
    const workflow = buildWorkflowFromTrend(item || {});
    setWorkflows((prev) => [workflow, ...(Array.isArray(prev) ? prev : [])]);
  };

  const addWorkWorkflow = (item) => {
    const workflow = buildWorkflowFromWork(item || {});
    setWorkflows((prev) => [workflow, ...(Array.isArray(prev) ? prev : [])]);
  };

  const runWorkflow = (workflow) => {
    const guard = canExecute(createPhase1Context({
      executionMode: EXECUTION_MODES.DEVELOPMENT,
      actionType: "workflow-execute",
      isExternalRequest: false,
      ownerApproved: false,
      approvalValid: false,
      provider: { id: "local-mock", status: "mock-only" },
      estimatedTaskCost: 0,
      estimatedWorkflowCost: 0.001,
      mockOnly: true,
      workflowType: workflow?.templateId || workflow?.type || "workflow-execute",
      workflowId: workflow?.id || null,
      employeeId: "workflow-automation",
    }));

    if (!guard.allowed) {
      setNotifications?.((prev) => [
        {
          id: Date.now(),
          title: "Workflow blocked by Safety Engine",
          body: `Phase1-A blocked execution: ${guard.reasonCode}`,
          read: false,
        },
        ...(Array.isArray(prev) ? prev : []),
      ]);
      return;
    }

    const updated = executeWorkflow({
      workflow,
      setMissionTasks,
      setDraft,
      setApprovals,
      setNotifications,
      context: {
        executionMode: EXECUTION_MODES.DEVELOPMENT,
        actionType: "workflow-execute",
        isExternalRequest: false,
        ownerApproved: false,
        approvalValid: false,
        provider: { id: "local-mock", status: "mock-only" },
        estimatedTaskCost: 0,
        estimatedWorkflowCost: 0.001,
        mockOnly: true,
        workflowType: workflow?.templateId || workflow?.type || "workflow-execute",
        workflowId: workflow?.id || null,
        employeeId: "workflow-automation",
      },
    });

    if (updated?.blocked) {
      setNotifications?.((prev) => [
        {
          id: Date.now(),
          title: "Workflow blocked by Safety Engine",
          body: `Phase1-A blocked execution: ${updated.reasonCode}`,
          read: false,
        },
        ...(Array.isArray(prev) ? prev : []),
      ]);
      return;
    }

    setWorkflows((prev) => (Array.isArray(prev) ? prev.map((item) => (item.id === workflow.id ? updated : item)) : []));
  };

  const updateDecision = (workflow, decision) => {
    const updated =
      decision === "approve"
        ? approveWorkflow(workflow)
        : decision === "reject"
          ? rejectWorkflow(workflow)
          : holdWorkflow(workflow);

    setWorkflows((prev) => (Array.isArray(prev) ? prev.map((item) => (item.id === workflow.id ? updated : item)) : []));
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

  const connectionStatus = buildConnectionStatus({ workflows: safeWorkflows, missionTasks: [], approvals: [], draft: null });
  const workflowCostEstimate = buildCostEstimate({ workflow: "mock-workflow", provider: "mock", amount: 1 });

  const stats = {
    total: safeWorkflows.length,
    pending: safeWorkflows.filter((item) => item.status === "pending-owner").length,
    review: safeWorkflows.filter((item) => item.status === "owner-review").length,
    approved: safeWorkflows.filter((item) => item.status === "approved-by-owner").length,
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

      <section className="panel connection-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">AUTOMATION LOOP</p>
            <h2>今の接続状態</h2>
          </div>
          <span className="badge">Score {connectionStatus.readinessScore}</span>
        </div>
        <div className="connection-flow">
          <span>Opportunity / Trend</span>
          <span>Workflow</span>
          <span>Mission</span>
          <span>Content</span>
          <span>Approval</span>
          <span>Analytics</span>
          <span>AI CEO</span>
        </div>
        <div className="mission-list">
          <div>次の最善手：{connectionStatus.nextBestAction}</div>
          <div>原則：AIは準備まで。投稿・契約・送信・決済はオーナー承認後。</div>
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">WORKFLOW COST SIMULATOR</p>
            <h2>実行コストの見積もり</h2>
          </div>
          <span className="badge">Mock / Safe</span>
        </div>
        <div className="mission-list">
          <div>対象: {workflowCostEstimate.workflow}</div>
          <div>推定コスト: {workflowCostEstimate.estimatedCost} USD</div>
          <div>承認必要: {workflowCostEstimate.requiresApproval ? "はい" : "いいえ"}</div>
          <div>実行可否: {workflowCostEstimate.safeToRun ? "安全に実行可能" : "Owner承認が必要"}</div>
        </div>
      </section>

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
                {(Array.isArray(template.steps) ? template.steps : []).map((step) => <div key={step}>□ {step}</div>)}
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
          {safeWorkflows.length === 0 && (
            <div className="card">
              <h2>Workflow未登録</h2>
              <p>TrendまたはWorkからWorkflowを作成してください。</p>
            </div>
          )}

          {safeWorkflows.map((workflow) => (
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
                {(Array.isArray(workflow.steps) ? workflow.steps : []).map((step) => (
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
                <button onClick={() => runWorkflow(workflow)}>Mission・Content・Approvalへ流す</button>
                <button onClick={() => askCEO(workflow)}>AI CEOに判断依頼</button>
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
