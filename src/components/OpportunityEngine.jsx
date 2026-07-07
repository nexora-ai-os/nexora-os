import { useState } from "react";
import {
  analyzeOpportunities,
  buildBoardOpinions,
  buildRevenueSummary,
  initialOpportunities,
} from "../services/opportunityEngine";
import { buildWorkflowFromTrend } from "../services/workflowEngine";

export default function OpportunityEngine({
  opportunities,
  setOpportunities,
  businessMemory,
  setBusinessMemory,
  analytics,
  setWorkflows,
  setDraft,
  setPage,
}) {
  const [draft, setOpportunityDraft] = useState({
    title: "",
    program: "",
    source: "Manual",
    expectedRevenue: 5000,
    expectedHours: 1,
    trend: 70,
    revenue: 70,
    competition: 70,
    authority: 75,
    compliance: 80,
    evergreen: 70,
    confidence: 65,
    memo: "",
  });

  const summary = buildRevenueSummary(opportunities, analytics, businessMemory);
  const ranked = summary.ranked;
  const top = ranked[0];
  const board = buildBoardOpinions(top);

  const addOpportunity = () => {
    if (!draft.title.trim()) return;

    setOpportunities((prev) => [
      {
        ...draft,
        id: Date.now(),
        expectedRevenue: Number(draft.expectedRevenue || 0),
        expectedHours: Number(draft.expectedHours || 1),
        trend: Number(draft.trend || 0),
        revenue: Number(draft.revenue || 0),
        competition: Number(draft.competition || 0),
        authority: Number(draft.authority || 0),
        compliance: Number(draft.compliance || 0),
        evergreen: Number(draft.evergreen || 0),
        confidence: Number(draft.confidence || 0),
      },
      ...prev,
    ]);

    setOpportunityDraft((prev) => ({ ...prev, title: "", memo: "", program: "" }));
  };

  const resetSamples = () => {
    if (!window.confirm("Opportunityサンプルを初期状態へ戻しますか？")) return;
    setOpportunities(initialOpportunities);
  };

  const sendToWorkflow = (item) => {
    const workflow = buildWorkflowFromTrend({
      ...item,
      theme: item.title,
      relatedProgram: item.program,
      score: item.score,
      reason: item.reason,
    });

    setWorkflows((prev) => [workflow, ...prev]);
    setPage("workflows");
  };

  const sendToContent = (item) => {
    setDraft({
      title: `${item.title}｜Revenue Content案`,
      channel: "Blog / Instagram / Threads / X",
      asp: item.program || "KEVIRIO",
      value: item.expectedRevenue || 1000,
      body: `テーマ：${item.title}
関連案件：${item.program || "未設定"}
Opportunity Score：${item.score}
ROI：${item.roiPerHour.toLocaleString()}円/h
期待売上：${Number(item.expectedRevenue || 0).toLocaleString()}円
判断：${item.decision}

【事実】
無料/手動データと既存データからOpportunity Engineが評価しました。

【推測】
${item.reason}

【意見】
まずは小さく投稿・記事化し、結果をBusiness Memoryへ記録してください。

【やらないこと】
${item.notDo}

【要確認】
公開前にApproval Centerで法務・ブランド・ASP規約を確認してください。

【最終決裁】
投稿・公開・契約・送信はオーナー承認後に行うこと。
`,
    });
    setPage("content");
  };

  const addMemory = (item, result = "検証予定") => {
    setBusinessMemory((prev) => [
      {
        id: Date.now(),
        type: "opportunity",
        title: item.title,
        result,
        scoreImpact: item.score,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const askAI = () => {
    const lines = ranked
      .slice(0, 5)
      .map((item, index) => `${index + 1}. ${item.title} / Score:${item.score} / ROI:${item.roiPerHour}円/h / 判断:${item.decision} / 理由:${item.reason}`)
      .join("\\n");

    const message = `Opportunity Engineの結果をもとに、今日の収益化判断をしてください。

候補:
${lines}

月間目標:${summary.monthlyGoal}円
現在売上:${summary.currentRevenue}円
残り:${summary.remaining}円
今日の期待売上:${summary.expectedTodayRevenue}円

必ず「事実」「推測」「意見」「やること」「やらないこと」「要確認」「最終決裁待ち」に分けてください。`;

    localStorage.setItem("kevirio-pending-ai-message", message);
    setPage("assistant");
  };

  return (
    <main className="content">
      <section className="hero">
        <p className="eyebrow">OPPORTUNITY ENGINE v3.3</p>
        <h1>収益機会を見つけ、やるべき案件を決める。</h1>
        <p className="lead">
          Trend・Revenue・Competition・Authority・Compliance・Evergreen・ROIを総合評価し、収益化の優先順位を提案します。Connection Coreへ連携可能です。
        </p>
        <div className="actions">
          <button onClick={askAI}>AIに収益判断を依頼</button>
          <button onClick={resetSamples}>サンプルに戻す</button>
        </div>
      </section>

      <div className="stats">
        <div className="stat-card"><span>今日の期待売上</span><strong>{summary.expectedTodayRevenue.toLocaleString()}円</strong><p>上位3件合計</p></div>
        <div className="stat-card"><span>平均ROI</span><strong>{summary.avgRoi.toLocaleString()}円/h</strong><p>上位3件</p></div>
        <div className="stat-card"><span>月目標まで</span><strong>{summary.remaining.toLocaleString()}円</strong><p>Revenue OS</p></div>
        <div className="stat-card"><span>Memory</span><strong>{summary.memoryCount}件</strong><p>学習ログ</p></div>
      </div>

      <section className="panel">
        <p className="eyebrow">AI CEO BRIEF</p>
        <h2>今日の収益判断</h2>
        <div className="mission-list">
          <div>事実｜現在売上 {summary.currentRevenue.toLocaleString()}円 / 月間目標 {summary.monthlyGoal.toLocaleString()}円</div>
          <div>推測｜今日の期待売上は {summary.expectedTodayRevenue.toLocaleString()}円です。</div>
          <div>意見｜{summary.ceoMessage}</div>
          <div>要確認｜公開・送信・契約はオーナー承認後に行うこと。</div>
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">AI BOARD</p>
            <h2>AI経営会議 初期版</h2>
          </div>
          <span className="badge">Owner Final</span>
        </div>
        <div className="grid">
          {board.map((member) => (
            <div className="card" key={member.role}>
              <span className="badge">{member.role}</span>
              <p>{member.opinion}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">ADD OPPORTUNITY</p>
            <h2>収益機会を登録</h2>
          </div>
          <button onClick={addOpportunity}>追加</button>
        </div>
        <div className="work-form">
          <input className="search" placeholder="テーマ / 案件名" value={draft.title} onChange={(e) => setOpportunityDraft({ ...draft, title: e.target.value })} />
          <textarea className="prompt-box textarea compact" placeholder="メモ / 狙い" value={draft.memo} onChange={(e) => setOpportunityDraft({ ...draft, memo: e.target.value })} />
          <div className="toolbar">
            <input className="search small" placeholder="関連案件" value={draft.program} onChange={(e) => setOpportunityDraft({ ...draft, program: e.target.value })} />
            <input className="search small" placeholder="取得元" value={draft.source} onChange={(e) => setOpportunityDraft({ ...draft, source: e.target.value })} />
            <input className="search small" type="number" value={draft.expectedRevenue} onChange={(e) => setOpportunityDraft({ ...draft, expectedRevenue: e.target.value })} placeholder="期待売上" />
            <input className="search small" type="number" step="0.25" value={draft.expectedHours} onChange={(e) => setOpportunityDraft({ ...draft, expectedHours: e.target.value })} placeholder="時間" />
            <input className="search small" type="number" value={draft.trend} onChange={(e) => setOpportunityDraft({ ...draft, trend: e.target.value })} placeholder="Trend" />
            <input className="search small" type="number" value={draft.revenue} onChange={(e) => setOpportunityDraft({ ...draft, revenue: e.target.value })} placeholder="Revenue" />
            <input className="search small" type="number" value={draft.competition} onChange={(e) => setOpportunityDraft({ ...draft, competition: e.target.value })} placeholder="Competition" />
            <input className="search small" type="number" value={draft.authority} onChange={(e) => setOpportunityDraft({ ...draft, authority: e.target.value })} placeholder="Authority" />
            <input className="search small" type="number" value={draft.compliance} onChange={(e) => setOpportunityDraft({ ...draft, compliance: e.target.value })} placeholder="Compliance" />
            <input className="search small" type="number" value={draft.evergreen} onChange={(e) => setOpportunityDraft({ ...draft, evergreen: e.target.value })} placeholder="Evergreen" />
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">REVENUE RANKING</p>
            <h2>収益機会ランキング</h2>
          </div>
          <span className="badge">Human Final Decision</span>
        </div>

        <div className="grid">
          {ranked.map((item) => (
            <div className="card" key={item.id}>
              <div className="card-header">
                <span className="badge">Score {item.score}</span>
                <span className="badge">{item.decision}</span>
              </div>
              <h2>{item.title}</h2>
              <p>{item.memo}</p>
              <ul>
                <li>関連案件：{item.program || "未設定"}</li>
                <li>期待売上：{Number(item.expectedRevenue || 0).toLocaleString()}円</li>
                <li>ROI：{item.roiPerHour.toLocaleString()}円/h</li>
                <li>理由：{item.reason}</li>
                <li>やらないこと：{item.notDo}</li>
                <li>Risk：{item.risk}</li>
              </ul>
              <div className="actions">
                <button onClick={() => sendToWorkflow(item)}>Workflow化</button>
                <button onClick={() => sendToContent(item)}>Contentへ</button>
                <button onClick={() => addMemory(item, "検証予定")}>Memory記録</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">BUSINESS MEMORY</p>
            <h2>学習ログ</h2>
          </div>
        </div>
        <div className="mission-list">
          {businessMemory.map((memory) => (
            <div key={memory.id}>
              {memory.title}｜{memory.result}｜Impact {memory.scoreImpact}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
