import { useEffect, useState } from "react";

const defaultStatus = {
  ok: false,
  automationReady: false,
  readyCount: 0,
  providers: [],
  principles: [],
};

export default function APIControlCenter({ setPage }) {
  const [status, setStatus] = useState(defaultStatus);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStatus = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/status");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "API status check failed");
      }

      setStatus(data);
    } catch (err) {
      setError(err.message);
      setStatus(defaultStatus);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const configured = status.providers.filter((provider) => provider.configured);
  const future = status.providers.filter((provider) => !provider.configured);

  return (
    <main className="content">
      <section className="hero">
        <p className="eyebrow">AI / API CONTROL CENTER v3.2</p>
        <h1>AI自動化の土台を安定させる。</h1>
        <p className="lead">
          KEVIRIOのAIプロバイダー状態を確認し、自動化に必要なAPI基盤を管理します。APIキーの値は表示しません。
        </p>
        <div className="actions">
          <button onClick={loadStatus}>{loading ? "確認中..." : "再確認"}</button>
          <button onClick={() => setPage("assistant")}>AI Companionへ</button>
          <button onClick={() => setPage("workflows")}>Workflow Automationへ</button>
        </div>
      </section>

      <div className="stats">
        <div className="stat-card">
          <span>AI Ready</span>
          <strong>{status.readyCount}件</strong>
          <p>設定済みプロバイダー</p>
        </div>
        <div className="stat-card">
          <span>Automation</span>
          <strong>{status.automationReady ? "Ready" : "Setup"}</strong>
          <p>OpenAI + Gemini</p>
        </div>
        <div className="stat-card">
          <span>Primary</span>
          <strong>{configured[0]?.name || "-"}</strong>
          <p>主力AI</p>
        </div>
        <div className="stat-card">
          <span>Security</span>
          <strong>Safe</strong>
          <p>キー非表示</p>
        </div>
      </div>

      {error && (
        <section className="panel danger-panel">
          <p className="eyebrow">ERROR</p>
          <h2>API状態を取得できませんでした</h2>
          <p>{error}</p>
        </section>
      )}

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">PROVIDERS</p>
            <h2>AIプロバイダー状態</h2>
          </div>
          <span className="badge">{loading ? "Checking" : "Updated"}</span>
        </div>

        <div className="grid">
          {status.providers.map((provider) => (
            <div className="card" key={provider.id}>
              <div className="card-header">
                <span className="badge">{provider.configured ? "Ready" : "Not Set"}</span>
                <span className="badge">{provider.priority}</span>
              </div>
              <h2>{provider.name}</h2>
              <p>{provider.role}</p>
              <ul>
                <li>Model：{provider.model}</li>
                <li>Status：{provider.configured ? "設定済み" : "未設定"}</li>
                <li>Secret：非表示</li>
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">AUTOMATION READINESS</p>
            <h2>自動化準備状況</h2>
          </div>
        </div>

        <div className="mission-list">
          <div>{status.automationReady ? "✅ OpenAI + Gemini が設定済みです。" : "□ OpenAI / Gemini のどちらかが未設定です。"}</div>
          <div>{configured.length > 0 ? `✅ 利用可能AI：${configured.map((item) => item.name).join(" / ")}` : "□ 利用可能AIがありません。"}</div>
          <div>{future.length > 0 ? `将来追加候補：${future.map((item) => item.name).join(" / ")}` : "すべての候補AIが設定済みです。"}</div>
          <div>次の優先：Workflow Automation → Opportunity Engine → Revenue OS</div>
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">GOVERNANCE</p>
            <h2>AI実行ルール</h2>
          </div>
          <span className="badge">Owner Final</span>
        </div>

        <div className="mission-list">
          {status.principles.map((principle) => (
            <div key={principle}>✅ {principle}</div>
          ))}
          <div>✅ 事実・推測・意見・要確認を分ける</div>
          <div>✅ コンプライアンス・ブランド・長期価値を考慮する</div>
        </div>
      </section>
    </main>
  );
}
