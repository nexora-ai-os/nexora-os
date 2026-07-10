import { useEffect, useState } from "react";
import { workTemplates } from "../data/templates";
import { canExecute, createPhase1Context, EXECUTION_MODES } from "../services/safetyEngine";

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
    const cleanMessage = String(message || "").trim();
    if (!cleanMessage || loading) return;

    setChatMessages((prev) => [...prev, { id: Date.now(), role: "user", text: cleanMessage }]);
    setInput("");
    setLoading(true);
    setMode(selectedMode);

    try {
      const guard = canExecute(createPhase1Context({
        executionMode: EXECUTION_MODES.DEVELOPMENT,
        actionType: "ai-chat",
        isExternalRequest: false,
        ownerApproved: false,
        approvalValid: false,
        provider: { id: provider === "auto" ? "local-mock" : provider, status: "mock-only" },
        estimatedTaskCost: 0,
        estimatedWorkflowCost: 0,
        mockOnly: true,
      }));

      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: guard.allowed
            ? [
                "Phase1-A Mock Only.",
                "/api/ai is not called in Development Mode.",
                "No external request was sent.",
                `Guard: ${guard.reasonCode}`,
                `Mode: ${selectedMode}`,
                `Revenue snapshot: ${Number(analytics?.revenue || 0).toLocaleString()} JPY`,
                `Waiting approvals: ${waitingApprovals}`,
                `Pipeline runs: ${pipelineRuns.length}`,
                `Todos: ${todos.length}`,
              ].join("\n")
            : [
                "Safety Guard blocked this request.",
                "No external request was sent.",
                `Reason: ${guard.reasonCode}`,
              ].join("\n"),
        },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: "Safety Guard failed closed. No external request was sent.",
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
        <h1>AI相談はPhase1-A Mockで封鎖中</h1>
        <p className="lead">
          Development Modeでは外部AI APIへ送信しません。入力内容は画面上のMock応答にだけ使われます。
        </p>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">MODEL ROUTER</p>
            <h2>AIモデル</h2>
          </div>
          <span className="badge">{loading ? "Checking..." : "Mock Only"}</span>
        </div>

        <div className="toolbar">
          <select className="search small" value={provider} onChange={(e) => setProvider(e.target.value)}>
            <option value="auto">Auto Mock</option>
            <option value="openai">OpenAI Mock</option>
            <option value="gemini">Gemini Mock</option>
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
                  Mock実行
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
          {loading && <div className="chat-bubble assistant">Safety Guard checking...</div>}
        </div>

        <form className="chat-input" onSubmit={handleSubmit}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Phase1-Aでは外部送信せずMock応答します"
          />
          <button type="submit" disabled={loading || !input.trim()}>
            送信
          </button>
        </form>
      </section>
    </main>
  );
}
