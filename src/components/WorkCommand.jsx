import { useState } from "react";
import TopBar from "./TopBar";
import { analyzeOpportunity, buildContentFromAnalysis } from "../services/workflowEngine";

export default function WorkCommand({ opportunities, setOpportunities, setDraft, setPage, savedAt }) {
  const [input, setInput] = useState("PLAUDを使って議事録作成を時短する投稿を作りたい");
  const [analysis, setAnalysis] = useState(null);

  const runAnalysis = () => {
    const result = analyzeOpportunity(input);
    setAnalysis(result);
    setOpportunities((prev) => [
      {
        id: Date.now(),
        title: result.title,
        source: "AI Command",
        description: input,
        status: "分析済み",
        priority: result.score >= 90 ? "高" : "中",
        score: result.score,
        estimate: result.estimate,
      },
      ...prev,
    ]);
  };

  const sendToStudio = () => {
    if (!analysis) return;
    setDraft(buildContentFromAnalysis(analysis));
    setPage("content");
  };

  return (
    <main className="content">
      <TopBar savedAt={savedAt} />

      <div className="hero">
        <p className="eyebrow">NEXORA WORK COMMAND</p>
        <h1>案件・ネタ・指示を入れると、AIが仕事化します。</h1>
        <p className="lead">分析 → 投稿案 → Content Studio → Approval Center までの入口です。</p>
      </div>

      <section className="panel">
        <h2>AIに仕事を渡す</h2>
        <textarea
          className="prompt-box textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="例：PLAUDを使って議事録作成を時短する投稿を作りたい"
        />
        <div className="actions">
          <button onClick={runAnalysis}>🧠 分析する</button>
          <button onClick={sendToStudio} disabled={!analysis}>✍️ Content Studioへ送る</button>
        </div>
      </section>

      {analysis && (
        <section className="panel">
          <h2>分析結果</h2>
          <div className="stats">
            <div className="stat-card"><span>Revenue Score</span><strong>{analysis.score}</strong><p>{analysis.category}</p></div>
            <div className="stat-card"><span>予測価値</span><strong>{analysis.estimate.toLocaleString()}円</strong><p>仮推定</p></div>
            <div className="stat-card"><span>優先度</span><strong>{analysis.score >= 90 ? "高" : "中"}</strong><p>投稿候補</p></div>
            <div className="stat-card"><span>次アクション</span><strong>{analysis.nextActions.length}</strong><p>作業に分解済み</p></div>
          </div>

          <div className="mission-list">
            <div>{analysis.summary}</div>
            {analysis.nextActions.map((a) => <div key={a}>次：{a}</div>)}
          </div>
        </section>
      )}

      <section className="panel">
        <h2>Work Queue</h2>
        <div className="grid">
          {opportunities.map((item) => (
            <div className="card" key={item.id}>
              <span className="badge">{item.status}</span>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
              <p>優先度：{item.priority}</p>
              <p>Score：{item.score}</p>
              <p>予測：{item.estimate.toLocaleString()}円</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
