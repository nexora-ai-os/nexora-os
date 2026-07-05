import TopBar from "./TopBar";

export default function Dashboard({ approvals, programs, analytics, todos, setTodos, notifications, opportunities, savedAt, setPage }) {
  const waiting = approvals.filter((a) => a.status === "承認待ち").length;
  const approved = approvals.filter((a) => a.status === "承認済み").length;
  const predicted = programs.filter((p) => p.favorite).reduce((sum, p) => sum + p.predicted, 0);
  const done = todos.filter((t) => t.done).length;
  const unread = notifications.filter((n) => !n.read).length;

  const toggleTodo = (id) => {
    setTodos((prev) => prev.map((todo) => todo.id === id ? { ...todo, done: !todo.done } : todo));
  };

  return (
    <main className="content">
      <TopBar notifications={unread + waiting} savedAt={savedAt} />

      <div className="hero">
        <p className="eyebrow">AI BUSINESS OPERATING SYSTEM</p>
        <h1>今日やる仕事は、NEXORAが整理します。</h1>
        <p className="lead">案件入力 → AI分析 → 投稿生成 → 承認 → 分析まで、1つの流れで進めます。</p>
        <div className="actions">
          <button onClick={() => setPage("work")}>AIに仕事を渡す</button>
          <button onClick={() => setPage("affiliate")}>案件を選ぶ</button>
          <button onClick={() => setPage("approval")}>承認する</button>
        </div>
      </div>

      <div className="stats">
        <div className="stat-card"><span>予測売上</span><strong>{predicted.toLocaleString()}円</strong><p>お気に入り案件ベース</p></div>
        <div className="stat-card"><span>承認待ち</span><strong>{waiting}件</strong><p>投稿候補</p></div>
        <div className="stat-card"><span>Work Queue</span><strong>{opportunities.length}件</strong><p>AI分析候補</p></div>
        <div className="stat-card"><span>ToDo進捗</span><strong>{done}/{todos.length}</strong><p>今日の作業</p></div>
      </div>

      <section className="panel">
        <h2>今日のRevenue Mission</h2>
        <div className="mission-list">
          {todos.map((todo) => (
            <button className="wide-btn" key={todo.id} onClick={() => toggleTodo(todo.id)}>
              {todo.done ? "✅" : "□"} {todo.text}
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Notification Center</h2>
        <div className="mission-list">
          {notifications.map((n) => (
            <div key={n.id}>{n.read ? "既読" : "未読"}｜{n.title}</div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Analytics Summary</h2>
        <div className="mission-list">
          <div>承認済み：{approved}</div>
          <div>クリック：{analytics.clicks}</div>
          <div>CV：{analytics.cv}</div>
          <div>AI経由売上：{analytics.revenue.toLocaleString()}円</div>
        </div>
      </section>
    </main>
  );
}
