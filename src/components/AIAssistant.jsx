import { useState } from "react";

const quickPrompts = [
  "今日やるべきことを優先順位つきで整理して",
  "クラウドワークス案件に応募する文章を作って",
  "SNS投稿案を5つ作って",
  "営業メールを丁寧だけど強めに作って",
  "今の収益化の弱点を指摘して改善案を出して",
];

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
  const waitingApprovals = approvals.filter((a) => a.status === "承認待ち").length;

  const askAI = async (message) => {
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

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: cleanMessage,
          context: {
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
          text: data.text,
        },
      ]);
    } catch (error) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text:
            "接続エラーです。\n\n事実: AI APIから正常な返答を取得できませんでした。\n要確認: VercelのEnvironment VariablesにOPENAI_API_KEYが設定されているか確認してください。\n次の行動: Vercel → Project Settings → Environment Variables → OPENAI_API_KEY を追加して、Redeployしてください。\n\n詳細: " +
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
        <p className="eyebrow">KEVIRIO AI COMPANION</p>
        <h1>AIに仕事を渡す。</h1>
        <p className="lead">
          応募文、営業文、SNS投稿、タスク整理、収益改善まで、KEVIRIOが実務目線で支援します。
        </p>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">QUICK COMMAND</p>
            <h2>すぐ使える指示</h2>
          </div>
        </div>
        <div className="actions">
          {quickPrompts.map((prompt) => (
            <button key={prompt} onClick={() => askAI(prompt)} disabled={loading}>
              {prompt}
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">AI ROOM</p>
            <h2>KEVIRIOと相談する</h2>
          </div>
          <span className="badge">{loading ? "Thinking..." : "Ready"}</span>
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
