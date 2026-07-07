import { useState } from "react";
import { analyzeTrends, buildTrendCEOMessage, initialTrendItems, trendSources } from "../services/trendEngine";

export default function TrendIntelligence({ trendItems, setTrendItems, setDraft, setPage }) {
  const [draft, setDraftLocal] = useState({
    theme: "",
    source: "Manual",
    relatedProgram: "",
    trend: 70,
    revenue: 70,
    competition: 70,
    authority: 70,
    compliance: 80,
    evergreen: 70,
    confidence: 60,
    status: "watch",
    memo: "",
  });

  const analyzed = analyzeTrends(trendItems);
  const top = analyzed[0];

  const addTrend = () => {
    if (!draft.theme.trim()) return;

    setTrendItems((prev) => [
      {
        ...draft,
        id: Date.now(),
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

    setDraftLocal((prev) => ({ ...prev, theme: "", memo: "", relatedProgram: "" }));
  };

  const resetSamples = () => {
    if (!window.confirm("Trendサンプルを初期状態に戻しますか？")) return;
    setTrendItems(initialTrendItems);
  };

  const sendToAI = () => {
    const lines = analyzed
      .slice(0, 6)
      .map((item, index) => `${index + 1}. ${item.theme} / Score:${item.score} / Decision:${item.decision} / 理由:${item.reason}`)
      .join("\\n");

    const message = `AI Trend Intelligenceの結果をもとに、今日狙うべき投稿テーマ・案件を決めてください。\\n\\n候補:\\n${lines}\\n\\n必ず「事実」「推測」「意見」「推奨テーマ」「最終決裁待ち」に分けてください。`;

    localStorage.setItem("kevirio-pending-ai-message", message);
    setPage("assistant");
  };

  const sendToContent = (item) => {
    setDraft({
      title: `${item.theme}｜KEVIRIO投稿案`,
      channel: "Blog / Instagram / Threads / X",
      asp: item.relatedProgram || "KEVIRIO",
      value: item.revenue * 100,
      body: `テーマ：${item.theme}
関連案件：${item.relatedProgram || "未設定"}
Opportunity Score：${item.score}
判断：${item.decision}

【狙い】
${item.memo}

【投稿構成】
1. フック：今このテーマが伸びている理由
2. 問題提起：読者が抱える悩み
3. 解決策：AI/KEVIRIO視点での提案
4. 収益導線：関連案件・サービスへの自然な誘導
5. 注意点：誇大表現を避け、事実と推測を分ける
6. CTA：保存・相談・比較・導入へ誘導

【Connection Core】
この下書きはTrend IntelligenceからContent Studioへ連携されました。

【注意】
最終公開前にApproval Centerで表現チェックを行うこと。
`,
    });

    setPage("content");
  };

  return (
    <main className="content">
      <section className="hero">
        <p className="eyebrow">AI TREND INTELLIGENCE v3.0</p>
        <h1>世界の流れから、次に狙うテーマを決める。</h1>
        <p className="lead">
          無料で確認できるトレンド情報・A8案件・自分との相性をもとに、Opportunity Scoreを算出します。Workflow連携の前段として使います。最終決裁は必ずオーナーです。
        </p>
        <div className="actions">
          <button onClick={sendToAI}>AIに今日の狙いを決めさせる</button>
          <button onClick={resetSamples}>サンプルに戻す</button>
        </div>
      </section>

      <div className="stats">
        <div className="stat-card"><span>登録テーマ</span><strong>{trendItems.length}件</strong><p>分析対象</p></div>
        <div className="stat-card"><span>最優先</span><strong>{top ? top.score : 0}</strong><p>{top ? top.theme : "未登録"}</p></div>
        <div className="stat-card"><span>判断</span><strong>{top ? top.decision : "-"}</strong><p>AI Trend判定</p></div>
        <div className="stat-card"><span>Confidence</span><strong>{top ? top.confidence : 0}%</strong><p>要確認を含む</p></div>
      </div>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">FREE DATA SOURCES</p>
            <h2>無料版データソース</h2>
          </div>
          <span className="badge">Manual First</span>
        </div>
        <div className="grid">
          {trendSources.map((source) => (
            <div className="card" key={source.id}>
              <span className="badge">{source.status}</span>
              <h2>{source.name}</h2>
              <p>{source.note}</p>
              <small>{source.type}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">ADD TREND</p>
            <h2>トレンド候補を登録</h2>
          </div>
          <button onClick={addTrend}>追加</button>
        </div>

        <div className="work-form">
          <input className="search" placeholder="テーマ名" value={draft.theme} onChange={(e) => setDraftLocal({ ...draft, theme: e.target.value })} />
          <textarea className="prompt-box textarea compact" placeholder="メモ / なぜ伸びそうか" value={draft.memo} onChange={(e) => setDraftLocal({ ...draft, memo: e.target.value })} />
          <div className="toolbar">
            <input className="search small" placeholder="取得元" value={draft.source} onChange={(e) => setDraftLocal({ ...draft, source: e.target.value })} />
            <input className="search small" placeholder="関連案件" value={draft.relatedProgram} onChange={(e) => setDraftLocal({ ...draft, relatedProgram: e.target.value })} />
            <input className="search small" type="number" min="0" max="100" value={draft.trend} onChange={(e) => setDraftLocal({ ...draft, trend: e.target.value })} placeholder="Trend" />
            <input className="search small" type="number" min="0" max="100" value={draft.revenue} onChange={(e) => setDraftLocal({ ...draft, revenue: e.target.value })} placeholder="Revenue" />
            <input className="search small" type="number" min="0" max="100" value={draft.competition} onChange={(e) => setDraftLocal({ ...draft, competition: e.target.value })} placeholder="Competition" />
            <input className="search small" type="number" min="0" max="100" value={draft.authority} onChange={(e) => setDraftLocal({ ...draft, authority: e.target.value })} placeholder="Authority" />
            <input className="search small" type="number" min="0" max="100" value={draft.compliance} onChange={(e) => setDraftLocal({ ...draft, compliance: e.target.value })} placeholder="Compliance" />
            <input className="search small" type="number" min="0" max="100" value={draft.evergreen} onChange={(e) => setDraftLocal({ ...draft, evergreen: e.target.value })} placeholder="Evergreen" />
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">OPPORTUNITY RANKING</p>
            <h2>狙うべきテーマ</h2>
          </div>
          <span className="badge">Owner Final Decision</span>
        </div>

        <div className="grid">
          {analyzed.map((item) => (
            <div className="card" key={item.id}>
              <div className="card-header">
                <span className="badge">Score {item.score}</span>
                <span className="badge">{item.decision}</span>
              </div>
              <h2>{item.theme}</h2>
              <p>{item.memo}</p>
              <ul>
                <li>関連案件：{item.relatedProgram || "未設定"}</li>
                <li>取得元：{item.source}</li>
                <li>理由：{item.reason}</li>
                <li>次アクション：{item.nextAction}</li>
              </ul>
              <div className="trend-bars">
                <div>Trend <progress value={item.trend} max="100" /></div>
                <div>Revenue <progress value={item.revenue} max="100" /></div>
                <div>Competition <progress value={item.competition} max="100" /></div>
                <div>Authority <progress value={item.authority} max="100" /></div>
                <div>Compliance <progress value={item.compliance} max="100" /></div>
                <div>Evergreen <progress value={item.evergreen} max="100" /></div>
              </div>
              <div className="actions">
                <button onClick={() => sendToContent(item)}>Content下書きへ</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">CEO SUMMARY</p>
        <h2>AI CEOへの報告</h2>
        <div className="mission-list">
          <div>{buildTrendCEOMessage(trendItems)}</div>
          <div>注意｜無料版は手動登録中心です。データ取得元と取得日時は今後強化します。</div>
          <div>原則｜AIは提案のみ。最終決裁はオーナーが行います。</div>
        </div>
      </section>
    </main>
  );
}
