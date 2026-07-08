import { useState } from "react";
import {
  analyzeMemory,
  buildAIMemoryBrief,
  buildMemoryRecordFromDecision,
  initialDecisionJournal,
  initialMemoryRecords,
} from "../services/memoryEngine";

export default function BusinessMemory({
  memoryRecords,
  setMemoryRecords,
  decisionJournal,
  setDecisionJournal,
  setPage,
}) {
  const [draft, setDraft] = useState({
    title: "",
    aiProposal: "",
    ownerDecision: "承認",
    outcome: "",
    impact: 70,
    lesson: "",
    category: "revenue",
  });

  const analysis = analyzeMemory({ memoryRecords, decisionJournal });

  const addDecision = () => {
    if (!draft.title.trim()) return;

    const decision = {
      ...draft,
      id: Date.now(),
      date: new Date().toISOString(),
      impact: Number(draft.impact || 0),
    };

    setDecisionJournal((prev) => [decision, ...prev]);
    setMemoryRecords((prev) => [buildMemoryRecordFromDecision(decision), ...prev]);
    setDraft({
      title: "",
      aiProposal: "",
      ownerDecision: "承認",
      outcome: "",
      impact: 70,
      lesson: "",
      category: "revenue",
    });
  };

  const resetSamples = () => {
    if (!window.confirm("Business Memoryを初期サンプルに戻しますか？")) return;
    setMemoryRecords(initialMemoryRecords);
    setDecisionJournal(initialDecisionJournal);
  };

  const askAI = () => {
    const message = `${buildAIMemoryBrief({ memoryRecords, decisionJournal })}

上記をもとに、次の意思決定を改善するための提案をしてください。
必ず「事実」「推測」「意見」「要確認」「次に記録すべきデータ」「最終決裁待ち」に分けてください。`;

    localStorage.setItem("kevirio-pending-ai-message", message);
    setPage("assistant");
  };

  return (
    <main className="content">
      <section className="hero">
        <p className="eyebrow">BUSINESS MEMORY v4.0</p>
        <h1>AIが提案し、オーナーが決め、結果を学習する。</h1>
        <p className="lead">
          AI提案・健さんの最終判断・実行結果・学びを記録し、KEVIRIOを健さん専用のAI Business OSへ育てます。
        </p>
        <div className="actions">
          <button onClick={askAI}>MemoryをAIに分析させる</button>
          <button onClick={resetSamples}>サンプルに戻す</button>
        </div>
      </section>

      <div className="stats">
        <div className="stat-card"><span>Learning Score</span><strong>{analysis.learningScore}</strong><p>学習進捗</p></div>
        <div className="stat-card"><span>Memory</span><strong>{analysis.totalMemory}件</strong><p>記録数</p></div>
        <div className="stat-card"><span>Decision</span><strong>{analysis.totalDecisions}件</strong><p>意思決定ログ</p></div>
        <div className="stat-card"><span>Avg Impact</span><strong>{analysis.avgImpact}</strong><p>平均効果</p></div>
      </div>

      <section className="panel">
        <p className="eyebrow">MEMORY RECOMMENDATION</p>
        <h2>次に学習すべきこと</h2>
        <div className="mission-list">
          <div>意見｜{analysis.recommendation}</div>
          <div>原則｜AIは提案・分析・記録まで。最終決裁は必ずオーナー。</div>
          <div>要確認｜売上・CTR・CV・保存率などの実データは今後追加記録してください。</div>
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">ADD DECISION</p>
            <h2>意思決定を記録</h2>
          </div>
          <button onClick={addDecision}>記録する</button>
        </div>

        <div className="work-form">
          <input className="search" placeholder="判断タイトル" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <textarea className="prompt-box textarea compact" placeholder="AIの提案" value={draft.aiProposal} onChange={(e) => setDraft({ ...draft, aiProposal: e.target.value })} />
          <textarea className="prompt-box textarea compact" placeholder="結果・学び" value={draft.lesson} onChange={(e) => setDraft({ ...draft, lesson: e.target.value })} />
          <div className="toolbar">
            <select className="search small" value={draft.ownerDecision} onChange={(e) => setDraft({ ...draft, ownerDecision: e.target.value })}>
              <option value="承認">承認</option>
              <option value="却下">却下</option>
              <option value="保留">保留</option>
              <option value="修正">修正</option>
            </select>
            <input className="search small" placeholder="結果" value={draft.outcome} onChange={(e) => setDraft({ ...draft, outcome: e.target.value })} />
            <input className="search small" type="number" min="0" max="100" value={draft.impact} onChange={(e) => setDraft({ ...draft, impact: e.target.value })} />
            <input className="search small" placeholder="カテゴリ" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">AI DECISION JOURNAL</p>
            <h2>意思決定ログ</h2>
          </div>
          <span className="badge">Owner Final</span>
        </div>

        <div className="grid">
          {decisionJournal.map((item) => (
            <div className="card memory-card" key={item.id}>
              <span className="badge">{item.ownerDecision}</span>
              <h2>{item.title}</h2>
              <p>{item.lesson}</p>
              <ul>
                <li>AI提案：{item.aiProposal}</li>
                <li>結果：{item.outcome}</li>
                <li>Impact：{item.impact}</li>
                <li>Category：{item.category}</li>
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">MEMORY RECORDS</p>
            <h2>学習データ</h2>
          </div>
        </div>

        <div className="mission-list">
          {memoryRecords.map((item) => (
            <div key={item.id}>
              {item.title}｜{item.insight}｜Impact {item.scoreImpact}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
