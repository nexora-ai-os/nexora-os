const priorityLabels = ["P1", "P2", "P3", "P4", "P5"];

export default function OwnerActionQueue({ actions = [], setPage }) {
  return (
    <section className="panel owner-queue-panel">
      <div className="section-head compact">
        <div>
          <p className="eyebrow">Owner Action Queue</p>
          <h2>今日やること</h2>
        </div>
        <span className="badge">内部画面へ移動のみ</span>
      </div>

      <div className="owner-action-list">
        {actions.slice(0, 5).map((action, index) => (
          <button
            className="owner-action-item"
            key={action.title}
            onClick={() => setPage(action.page)}
            type="button"
          >
            <span className="owner-action-priority">{priorityLabels[index]}</span>
            <span>
              <strong>{action.title}</strong>
              <small>理由: {action.reason}</small>
              <em>担当AI: {action.aiOwner}</em>
            </span>
            <span className="owner-action-page">確認先: {action.nextScreen}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
