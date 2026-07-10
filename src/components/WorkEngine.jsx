import { useState } from "react";
import { canExecute, createPhase1Context, EXECUTION_MODES } from "../services/safetyEngine";
import { analyzeWorkItems } from "../services/workEngine";

const FLOW_STEPS = [
  "案件を受信",
  "ROIを計算",
  "優先順位を判定",
  "コンプライアンス確認",
  "Missionを生成",
  "Content下書きを生成",
  "Approvalへ送信",
  "Analyticsへ反映",
  "完了",
];

function timeNow() {
  return new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

function guardForWork(actionType, item = {}) {
  return canExecute(createPhase1Context({
    executionMode: EXECUTION_MODES.DEVELOPMENT,
    actionType,
    isExternalRequest: false,
    ownerApproved: false,
    approvalValid: false,
    provider: { id: "local-mock", status: "mock-only" },
    estimatedTaskCost: 0,
    estimatedWorkflowCost: actionType === "workflow-auto-flow" ? 0.001 : 0,
    mockOnly: true,
    workflowType: actionType === "workflow-auto-flow" ? "workflow-auto-flow" : "internal-mock",
    workflowId: item.id || null,
    employeeId: "work-engine",
  }));
}

function complianceChecks(item) {
  const risk = Number(item.complianceRisk || 1);

  return [
    { label: "景表法", status: risk >= 4 ? "要確認" : "OK" },
    { label: "薬機法", status: item.category?.includes("健康") || item.category?.includes("フィットネス") ? "要注意" : "OK" },
    { label: "ステマ規制", status: item.type === "affiliate" ? "PR表記必須" : "OK" },
    { label: "著作権", status: "OK" },
    { label: "ブランド表現", status: risk >= 3 ? "要確認" : "OK" },
  ];
}

function riskLevel(item) {
  const risk = Number(item.complianceRisk || 1);
  if (risk >= 4) return { label: "高", icon: "🔴" };
  if (risk >= 3) return { label: "中", icon: "🟡" };
  return { label: "低", icon: "🟢" };
}

export default function WorkEngine({
  workItems,
  setWorkItems,
  setMissionTasks,
  setDraft,
  setApprovals,
  setNotifications,
  setPage,
}) {
  const [draft, setDraftLocal] = useState({
    title: "",
    source: "Manual",
    type: "sales",
    category: "営業",
    reward: 5000,
    difficulty: 2,
    estimatedHours: 1,
    urgency: 3,
    strategicFit: 4,
    complianceRisk: 2,
    description: "",
  });
  const [loadingId, setLoadingId] = useState(null);
  const [flowLogs, setFlowLogs] = useState([]);

  const safeWorkItems = Array.isArray(workItems) ? workItems : [];
  const analyzed = analyzeWorkItems(safeWorkItems);
  const top = analyzed[0];

  const addLog = (text) => {
    setFlowLogs((prev) => [{ id: Date.now() + Math.random(), time: timeNow(), text }, ...prev].slice(0, 16));
  };

  const addWorkItem = () => {
    if (!draft.title.trim()) return;

    const newItem = {
      ...draft,
      id: Date.now(),
      reward: Number(draft.reward || 0),
      difficulty: Number(draft.difficulty || 1),
      estimatedHours: Number(draft.estimatedHours || 1),
      urgency: Number(draft.urgency || 1),
      strategicFit: Number(draft.strategicFit || 1),
      complianceRisk: Number(draft.complianceRisk || 1),
      status: "analysis",
      aiReport: "",
      flowStatus: "registered",
      recommendedOutputs:
        draft.type === "affiliate"
          ? ["SEO記事", "SNS投稿", "比較記事"]
          : ["応募文", "営業文", "質問テンプレート"],
    };

    setWorkItems((prev) => [newItem, ...(Array.isArray(prev) ? prev : [])]);
    addLog(`案件を受信：${newItem.title}`);
    setDraftLocal((prev) => ({ ...prev, title: "", description: "" }));
  };

  const createMissionTasks = (item) => {
    const sourceTasks = Array.isArray(item.generatedTasks) && item.generatedTasks.length
      ? item.generatedTasks
      : [
          { title: `${item.title}｜構成を作る`, category: "Workflow", priority: "high", value: Math.round(Number(item.reward || 1000) / 3) },
          { title: `${item.title}｜下書きを作る`, category: "Content", priority: "high", value: Math.round(Number(item.reward || 1000) / 3) },
          { title: `${item.title}｜Approvalで確認する`, category: "Approval", priority: "medium", value: Math.round(Number(item.reward || 1000) / 3) },
        ];

    return sourceTasks.map((task) => ({
      id: Date.now() + Math.random(),
      title: task.title,
      category: task.category,
      priority: task.priority,
      status: "todo",
      due: "今日",
      value: task.value,
      note: `Auto Flow Engineから生成 / ROI ${Number(item.roiPerHour || 0).toLocaleString()}円/h / Phase1-A Mock`,
    }));
  };

  const createContentDraft = (item) => {
    const title =
      item.type === "affiliate"
        ? `${item.title}｜AI活用・時短・収益化につなげる投稿`
        : `${item.title}｜提案文・応募文のたたき台`;

    return {
      title,
      channel: item.type === "affiliate" ? "Blog / Instagram / Threads" : "応募文 / 営業文",
      body: `テーマ：${item.title}
カテゴリ：${item.category}
想定報酬：${Number(item.reward || 0).toLocaleString()}円
ROI：${Number(item.roiPerHour || 0).toLocaleString()}円/h

【狙い】
${item.description || "この仕事を収益につながる導線へ変換する。"}

【優先理由】
・ROI ${Number(item.roiPerHour || 0).toLocaleString()}円/h
・スコア ${item.score}
・判断：${item.decision}
・リスク：${item.riskComment}

【構成案】
1. 結論：なぜ今このテーマが重要か
2. 課題：読者・顧客が抱えている問題
3. 解決策：KEVIRIO視点での提案
4. 実行：今日やるべき具体策
5. 注意点：誇大表現・法務リスクを避ける
6. CTA：相談・応募・比較・導入へつなげる

【コンプラ注意】
${item.riskComment}

【Phase1-A】
これは内部Mock下書きです。外部送信・投稿・決済・API実通信は行っていません。
`,
      asp: item.source || "KEVIRIO",
      value: Number(item.reward || 1000),
    };
  };

  const createApproval = (item) => ({
    id: Date.now() + 4,
    title: item.title,
    channel: item.type === "affiliate" ? "Blog / SNS" : "営業 / 応募",
    asp: item.source || "KEVIRIO",
    time: "今日",
    status: "承認待ち",
    value: Number(item.reward || 1000),
    counted: false,
    risk: item.riskComment,
  });

  const runAutoFlow = async (item) => {
    const guard = guardForWork("workflow-auto-flow", item);
    if (!guard.allowed) {
      addLog(`Blocked: ${guard.reasonCode}`);
      return;
    }

    setLoadingId(item.id);
    for (const step of FLOW_STEPS) {
      addLog(`${step}：${item.title}`);
      await new Promise((resolve) => setTimeout(resolve, 220));
    }

    const tasks = createMissionTasks(item);
    const contentDraft = createContentDraft(item);
    const approval = createApproval(item);

    setMissionTasks((prev) => [...tasks, ...(Array.isArray(prev) ? prev : [])]);
    setDraft(contentDraft);
    setApprovals((prev) => [approval, ...(Array.isArray(prev) ? prev : [])]);
    setNotifications?.((prev) => [
      { id: Date.now(), title: "Auto Flow mock completed", body: `${item.title} moved to Mission / Content / Approval as mock.`, read: false },
      ...(Array.isArray(prev) ? prev : []),
    ]);

    setWorkItems((prev) =>
      (Array.isArray(prev) ? prev : []).map((work) =>
        work.id === item.id
          ? {
              ...work,
              flowStatus: "completed",
              aiReport:
                work.aiReport ||
                `Auto Flow完了。Missionタスク${tasks.length}件、Content下書き1件、Approval承認待ち1件を生成しました。Phase1-A Mockのため外部API通信は行っていません。`,
              aiProvider: work.aiProvider || "local-mock",
            }
          : work
      )
    );
    setLoadingId(null);
  };

  const analyzeWithAI = async (item) => {
    const guard = guardForWork("ai-chat", item);
    setLoadingId(item.id);
    addLog(`AI解析Mock開始：${item.title}`);

    setWorkItems((prev) =>
      (Array.isArray(prev) ? prev : []).map((work) =>
        work.id === item.id
          ? {
              ...work,
              aiReport: [
                "【事実】",
                "Phase1-A Development Modeの内部Mock解析です。外部API通信、fetch、課金処理は行っていません。",
                "",
                "【推測】",
                `${item.reason || "ROI・優先順位・リスクから、承認前の準備対象として扱えます。"}`,
                "",
                "【意見】",
                `判断は「${item.decision}」、リスクは「${item.riskComment || riskLevel(item).label}」です。`,
                "",
                "【優先順位】",
                `ROI ${Number(item.roiPerHour || 0).toLocaleString()}円/h、Score ${item.score}。`,
                "",
                "【法務・コンプラ注意】",
                complianceChecks(item).map((check) => `${check.label}: ${check.status}`).join(" / "),
                "",
                "【今日やる作業3つ】",
                "1. 構成案を作る",
                "2. 下書きを作る",
                "3. Approval CenterでOwner確認へ回す",
                "",
                `Guard: ${guard.reasonCode}`,
              ].join("\n"),
              aiProvider: guard.allowed ? "local-mock" : "blocked",
            }
          : work
      )
    );
    addLog(guard.allowed ? `AI解析Mock完了：${item.title}` : `AI解析Mock拒否：${item.title}`);
    setLoadingId(null);
  };

  const sendToAI = (item) => {
    const message = `次の仕事を実行計画にしてください。\n\nタイトル:${item.title}\n内容:${item.description}\n報酬:${item.reward}円\nROI:${item.roiPerHour}円/h\n判断:${item.decision}\nリスク:${item.riskComment}\n\n出力は「事実」「推測」「意見」「実行手順」「作るべき文章」に分けてください。\n\nPhase1-A note: AI Assistant will return a mock response only.`;
    localStorage.setItem("kevirio-pending-ai-message", message);
    setPage("assistant");
  };

  const removeWorkItem = (id) => {
    if (!window.confirm("この仕事を削除しますか？")) return;
    setWorkItems((prev) => (Array.isArray(prev) ? prev.filter((item) => item.id !== id) : []));
  };

  return (
    <main className="content">
      <section className="hero">
        <p className="eyebrow">AUTO FLOW ENGINE v2.8</p>
        <h1>仕事を入れる。AIが流す。</h1>
        <p className="lead">
          Work EngineがROI・優先順位・コンプライアンスを確認し、Mission・Content・Approvalへ内部Mockで連携します。外部API通信は行いません。
        </p>
      </section>

      <div className="stats">
        <div className="stat-card"><span>登録仕事</span><strong>{safeWorkItems.length}件</strong><p>解析対象</p></div>
        <div className="stat-card"><span>最優先</span><strong>{top ? top.score : 0}</strong><p>{top ? top.title : "未登録"}</p></div>
        <div className="stat-card"><span>最大ROI</span><strong>{top ? top.roiPerHour.toLocaleString() : 0}円/h</strong><p>時間効率</p></div>
        <div className="stat-card"><span>判断</span><strong>{top ? top.decision : "-"}</strong><p>Work Engine判定</p></div>
      </div>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">ROI RANKING</p>
            <h2>本日のおすすめ</h2>
          </div>
          <span className="badge">Mock Only</span>
        </div>
        <div className="mission-list">
          {analyzed.slice(0, 3).map((item, index) => (
            <div key={item.id}>
              {index + 1}. {item.title}｜ROI {Number(item.roiPerHour || 0).toLocaleString()}円/h｜Score {item.score}｜{item.decision}
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">ADD WORK</p>
            <h2>仕事を登録</h2>
          </div>
          <button onClick={addWorkItem}>解析に追加</button>
        </div>
        <div className="work-form">
          <input className="search" placeholder="仕事名 / 案件名" value={draft.title} onChange={(e) => setDraftLocal({ ...draft, title: e.target.value })} />
          <textarea className="prompt-box textarea compact" placeholder="内容メモ" value={draft.description} onChange={(e) => setDraftLocal({ ...draft, description: e.target.value })} />
          <div className="toolbar">
            <select className="search small" value={draft.type} onChange={(e) => setDraftLocal({ ...draft, type: e.target.value })}>
              <option value="sales">営業</option>
              <option value="affiliate">アフィリエイト</option>
              <option value="content">コンテンツ</option>
            </select>
            <input className="search small" value={draft.category} onChange={(e) => setDraftLocal({ ...draft, category: e.target.value })} placeholder="カテゴリ" />
            <input className="search small" type="number" value={draft.reward} onChange={(e) => setDraftLocal({ ...draft, reward: e.target.value })} placeholder="報酬" />
            <input className="search small" type="number" step="0.25" value={draft.estimatedHours} onChange={(e) => setDraftLocal({ ...draft, estimatedHours: e.target.value })} placeholder="時間" />
            <input className="search small" type="number" min="1" max="5" value={draft.urgency} onChange={(e) => setDraftLocal({ ...draft, urgency: e.target.value })} placeholder="緊急度" />
            <input className="search small" type="number" min="1" max="5" value={draft.strategicFit} onChange={(e) => setDraftLocal({ ...draft, strategicFit: e.target.value })} placeholder="相性" />
            <input className="search small" type="number" min="1" max="5" value={draft.complianceRisk} onChange={(e) => setDraftLocal({ ...draft, complianceRisk: e.target.value })} placeholder="リスク" />
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">AI THINKING LOG</p>
            <h2>Auto Flow処理ログ</h2>
          </div>
        </div>
        <div className="mission-list">
          {flowLogs.length === 0 && <div>まだ処理ログはありません。仕事を登録し、Auto Flowを実行してください。</div>}
          {flowLogs.map((log) => <div key={log.id}>{log.time}｜{log.text}</div>)}
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">ANALYSIS QUEUE</p>
            <h2>Work Engine判断</h2>
          </div>
          <span className="badge">ROI + Compliance + Mock Auto Flow</span>
        </div>
        <div className="grid">
          {analyzed.map((item) => {
            const risk = riskLevel(item);
            const checks = complianceChecks(item);
            return (
              <div className="card work-card" key={item.id}>
                <div className="card-header">
                  <span className="badge">Score {item.score}</span>
                  <span className="badge">{item.decision}</span>
                  <span className="badge">{risk.icon} Risk {risk.label}</span>
                </div>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
                <ul>
                  <li>報酬：{Number(item.reward || 0).toLocaleString()}円</li>
                  <li>想定時間：{item.estimatedHours}h</li>
                  <li>ROI：{Number(item.roiPerHour || 0).toLocaleString()}円/h</li>
                  <li>優先理由：{item.reason}</li>
                </ul>

                <div className="mission-list">
                  {checks.map((check) => (
                    <div key={check.label}>✔ {check.label}：{check.status}</div>
                  ))}
                </div>

                {item.aiReport && (
                  <div className="ai-report">
                    <strong>AI解析結果（{item.aiProvider || "local-mock"}）</strong>
                    <p>{item.aiReport}</p>
                  </div>
                )}
                {item.flowStatus === "completed" && (
                  <div className="ai-report">
                    <strong>Auto Flow完了</strong>
                    <p>Mission・Content・Approvalへ内部Mockで連携済みです。外部送信は行っていません。</p>
                  </div>
                )}
                <div className="actions">
                  <button onClick={() => runAutoFlow(item)} disabled={loadingId === item.id}>
                    {loadingId === item.id ? "処理中..." : "✨ Auto Flow"}
                  </button>
                  <button onClick={() => analyzeWithAI(item)} disabled={loadingId === item.id}>
                    AI解析
                  </button>
                  <button onClick={() => sendToAI(item)}>AIに実行計画</button>
                  <button onClick={() => removeWorkItem(item.id)}>削除</button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
