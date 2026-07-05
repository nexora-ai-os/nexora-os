import TopBar from "./TopBar";

export default function AIAssistant({ programs, approvals, savedAt }) {
  const top = [...programs].sort((a, b) => b.score - a.score)[0];
  const waiting = approvals.filter((a) => a.status === "承認待ち").length;

  return (
    <main className="content">
      <TopBar notifications={waiting} savedAt={savedAt} />

      <div className="panel assistant-panel">
        <h1>AI Assistant</h1>
        <div className="chat-bubble">健さん、本日の最優先案件は「{top.name}」です。Revenue Scoreが{top.score}で最も高いです。</div>
        <div className="chat-bubble">承認待ちは{waiting}件あります。まずApproval Centerで確認しましょう。</div>
        <div className="chat-bubble">次の一手：Affiliate Hub → Content Studio → Approval Center の順に進めると最短です。</div>
      </div>
    </main>
  );
}
