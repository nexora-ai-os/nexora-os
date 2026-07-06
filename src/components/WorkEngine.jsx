import { useState } from "react";
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
  return new Date().toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
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
  const analyzed = analyzeWorkItems(workItems);
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

    setWorkItems((prev) => [newItem, ...prev]);
    addLog(`案件を受信：${newItem.title}`);
    setDraftLocal((prev) => ({ ...prev, title: "", description: "" }));
  };

  const createMissionTasks = (item) => {
    return item.generatedTasks.map((task) => ({
      id: Date.now() + Math.random(),
      title: task.title,
      category: task.category,
      priority: task.priority,
      status: "todo",
      due: "今日",
      value: task.value,
      note: `Auto Flow Engineから生成 / ROI ${item.roiPerHour.toLocaleString()}円/h`,
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
想定報酬：${item.reward.toLocaleString()}円
ROI：${item.roiPerHour.toLocaleString()}円/h

【狙い】
${item.description || "この仕事を収益につながる導線へ変換する。"}

【優先理由】
・ROI ${item.roiPerHour.toLocaleString()}円/h
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
`,
      asp: item.source || "KEVIRIO",
      value: item.reward || 1000,
    };
  };

  const createApproval = (item) => ({
    id: Date.now(),
    title: item.title,
    channel: item.type === "affiliate" ? "Blog / SNS" : "営業 / 応募",
    asp: item.source || "KEVIRIO",
    time: "今日",
    status: "承認待ち",
    value: item.reward || 1000,
    counted: false,
    risk: item.riskComment,
  });

  const runAutoFlow = async (item) => {
    setLoadingId(item.id);

    for (const step of FLOW_STEPS) {
      addLog(`${step}：${item.title}`);
      await new Promise((resolve) => setTimeout(resolve, 220));
    }

    const tasks = createMissionTasks(item);
    const contentDraft = createContentDraft(item);
    const approval = createApproval(item);

    setMissionTasks((prev) => [...tasks, ...prev]);
    setDraft(contentDraft);
    setApprovals((prev) => [approval, ...prev]);
    setNotifications?.((prev) => [
      {
        id: Date.now(),
        title: "Auto Flow完了",
        body: `${item.title}をMission・Content・Approvalへ自動連携しました。`,
        read: false,
      },
      ...prev,
    ]);

    setWorkItems((prev) =>
      prev.map((work) =>
        work.id === item.id
          ? {
              ...work,
              flowStatus: "completed",
              aiReport:
                work.aiReport ||
                `Auto Flow完了。Missionタスク${tasks.length}件、Content下書き1件、Approval承認待ち1件を生成しました。`,
            }
          : work
      )
    );

    setLoadingId(null);
  };

  const analyzeWithAI = async (item) => {
    setLoadingId(item.id);
    addLog(`AI解析開始：${item.title}`);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `次の仕事をKEVIRIO Work Engineとして分析してください。\n\n仕事名:${item.title}\n種類:${item.type}\nカテゴリ:${item.category}\n内容:${item.description}\n報酬:${item.reward}円\n想定時間:${item.estimatedHours}時間\nROI:${item.roiPerHour}円/h\nスコア:${item.score}\nリスク:${item.riskComment}\n\n必ず以下の形式で返してください。\n【事実】\n【推測】\n【意見】\n【優先順位】\n【法務・コンプラ注意】\n【今日やる作業3つ】`,
          context: {
            provider: "auto",
            mode: "work-engine",
            revenue: 0,
            monthlyGoal: 300000,
            todos: [item.title],
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI analysis failed.");

      setWorkItems((prev) =>
        prev.map((work) =>
          work.id === item.id
            ? { ...work, aiReport: data.text, aiProvider: data.provider || "auto" }
            : work
        )
      );
      addLog(`AI解析完了：${item.title}`);
    } catch (error) {
      setWorkItems((prev) =>
        prev.map((work) =>
          work.id === item.id
            ? {
                ...work,
                aiReport:
                  "AI解析に失敗しました。\n要確認: OPENAI_API_KEY / GEMINI_API_KEY / GEMINI_MODEL の設定とRedeploy状況を確認してください。\n詳細: " +
                  error.message,
                aiProvider: "error",
              }
            : work
        )
      );
      addLog(`AI解析失敗：${item.title}`);
    } finally {
      setLoadingId(null);
    }
  };

  const sendToAI = (item) => {
    const message = `次の仕事を実行計画にしてください。\n\nタイトル:${item.title}\n内容:${item.description}\n報酬:${item.reward}円\nROI:${item.roiPerHour}円/h\n判断:${item.decision}\nリスク:${item.riskComment}\n\n出力は「事実」「推測」「意見」「実行手順」「作るべき文章」に分けてください。`;
    localStorage.setItem("kevirio-pending-ai-message", message);
    setPage("assistant");
  };

  const removeWorkItem = (id) => {
    if (!window.confirm("この仕事を削除しますか？")) return;
    setWorkItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <main className="content">
      <section className="hero">
        <p className="eyebrow">AUTO FLOW ENGINE v2.8</p>
        <h1>仕事を入れる。AIが流す。</h1>
        <p className="lead">
          Work EngineがROI・優先順位・コンプライアンスを確認し、Mission・Content・Approvalへ自動連携します。
        </p>
      </section>

      <div className="stats">
        <div className="stat-card"><span>登録仕事</span><strong>{workItems.length}件</strong><p>解析対象</p></div>
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
          <span className="badge">Auto Flow Ready</span>
        </div>
        <div className="mission-list">
          {analyzed.slice(0, 3).map((item, index) => (
            <div key={item.id}>
              {index + 1}. {item.title}｜ROI {item.roiPerHour.toLocaleString()}円/h｜Score {item.score}｜{item.decision}
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
          {flowLogs.map((log) => (
            <div key={log.id}>{log.time}｜{log.text}</div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">ANALYSIS QUEUE</p>
            <h2>Work Engine判断</h2>
          </div>
          <span className="badge">ROI + Compliance + Auto Flow</span>
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
                  <li>報酬：{item.reward.toLocaleString()}円</li>
                  <li>想定時間：{item.estimatedHours}h</li>
                  <li>ROI：{item.roiPerHour.toLocaleString()}円/h</li>
                  <li>優先理由：{item.reason}</li>
                </ul>

                <div className="mission-list">
                  {checks.map((check) => (
                    <div key={check.label}>✔ {check.label}：{check.status}</div>
                  ))}
                </div>

                {item.aiReport && (
                  <div className="ai-report">
                    <strong>AI解析結果（{item.aiProvider || "auto"}）</strong>
                    <p>{item.aiReport}</p>
                  </div>
                )}

                {item.flowStatus === "completed" && (
                  <div className="ai-report">
                    <strong>Auto Flow完了</strong>
                    <p>Mission・Content・Approvalへ自動連携済みです。</p>
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
