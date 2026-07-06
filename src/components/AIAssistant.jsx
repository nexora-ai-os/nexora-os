import { useEffect, useState } from "react";
import { workTemplates } from "../data/templates";

export default function AIAssistant({
  chatMessages,
  setChatMessages,
  todos = [],
  approvals = [],
  analytics = { revenue: 0 },
  pipelineRuns = [],
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState("auto");
  const [mode, setMode] = useState("general");

  const waitingApprovals = approvals.filter((a) => a.status === "承認待ち").length;

  useEffect(() => {
    const pending = localStorage.getItem("kevirio-pending-ai-message");
    if (pending) {
      localStorage.removeItem("kevirio-pending-ai-message");
      setInput(pending);
    }
  }, []);

  const askAI = async (message, selectedMode = mode) => {
    const cleanMessage = message.trim();
    if (!cleanMessage || loading) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      text: cleanMessage,
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setMode(selectedMode);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: cleanMessage,
          context: {
            provider,
            mode: selectedMode,
            monthlyGoal: 300000,
            revenue: analytics.revenue || 0,
            waitingApprovals,
            pipelineRuns: pipelineRuns.length,
            todos: todos.map((todo) => `${todo.done ? "完了" : "未完了"}:${todo.text}`),
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "AI request failed.");
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: `【${data.provider || provider}】\\n${data.text}`,
        },
      ]);
    } catch (error) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text:
            "接続エラーです。\\n\\n事実: AI APIから正常な返答を取得できませんでした。\\n要確認: VercelのEnvironment VariablesにOPENAI_API_KEYまたはGEMINI_API_KEYが設定されているか確認してください。\\n次の行動: Vercel → Project Settings → Environment Variables を確認して、Redeployしてください。\\n\\n詳細: " +
            error.message,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    askAI(input);
  };

  return (
    <main className="content">
      <section className="hero">
        <p className="eyebrow">KEVIRIO CORE</p>
        <h1>仕事を終わらせるAI。</h1>
        <p className="lead">
          応募文、営業、返信、SNS、提案書、今日の整理まで。KEVIRIO Coreが実務目線で支援します。
        </p>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">MODEL ROUTER</p>
            <h2>AIモデル</h2>
          </div>
          <span className="badge">{loading ? "Thinking..." : "Ready"}</span>
        </div>

        <div className="toolbar">
          <select className="search small" value={provider} onChange={(e) => setProvider(e.target.value)}>
            <option value="auto">Auto</option>
            <option value="openai">OpenAI</option>
            <option value="gemini">Gemini</option>
          </select>
          <select className="search small" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="general">General</option>
            <option value="planning">Planning</option>
            <option value="sales">Sales</option>
            <option value="content">Content</option>
            <option value="communication">Communication</option>
            <option value="proposal">Proposal</option>
          </select>
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">WORK TEMPLATES</p>
            <h2>よく使う仕事</h2>
          </div>
        </div>

        <div className="grid">
          {workTemplates.map((template) => (
            <div className="card" key={template.id}>
              <span className="badge">{template.mode}</span>
              <h2>{template.label}</h2>
              <p>{template.prompt}</p>
              <div className="actions">
                <button onClick={() => askAI(template.prompt, template.mode)} disabled={loading}>
                  実行する
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">AI ROOM</p>
            <h2>KEVIRIO Coreと相談する</h2>
          </div>
        </div>

        <div className="chat-window">
          {chatMessages.map((message) => (
            <div key={message.id} className={`chat-bubble ${message.role}`}>
              {message.text}
            </div>
          ))}
          {loading && <div className="chat-bubble assistant">KEVIRIOが整理しています...</div>}
        </div>

        <form className="chat-input" onSubmit={handleSubmit}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="例：この案件に応募する文章を作って"
          />
          <button type="submit" disabled={loading || !input.trim()}>
            送信
          </button>
        </form>
      </section>
    </main>
  );
}
