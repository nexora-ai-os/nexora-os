export default function FloatingAssistant({ approvals }) {
  const waiting = approvals.filter((a) => a.status === "承認待ち").length;

  return (
    <div className="floating-ai">
      <strong>🤖 NEXORA AI</strong>
      <p>承認待ち {waiting}件。次はApproval Centerへ。</p>
    </div>
  );
}
