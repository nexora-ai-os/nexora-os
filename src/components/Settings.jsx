import TopBar from "./TopBar";

export default function Settings({ resetAll, savedAt, notifications, setNotifications, todos, setTodos }) {
  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const toggleTodo = (id) => setTodos((prev) => prev.map((t) => t.id === id ? { ...t, done: !t.done } : t));

  return (
    <main className="content">
      <TopBar notifications={notifications.filter((n) => !n.read).length} savedAt={savedAt} />
      <div className="panel">
        <h1>Settings / Profile</h1>
        <div className="mission-list">
          <div>Profile｜健 / NEXORA Owner</div>
          <div>Notifications｜承認待ち・投稿予定・売上通知</div>
          <div>User Management｜v1は疑似ログイン</div>
          <div>Security｜Basic認証稼働中</div>
          <div>Storage｜localStorage保存対応</div>
        </div>
        <div className="actions">
          <button onClick={markAllRead}>🔔 通知をすべて既読</button>
          <button onClick={resetAll}>🧹 データ初期化</button>
        </div>
      </div>

      <div className="panel">
        <h2>Today ToDo</h2>
        <div className="mission-list">
          {todos.map((todo) => (
            <button className="wide-btn" key={todo.id} onClick={() => toggleTodo(todo.id)}>
              {todo.done ? "✅" : "□"} {todo.text}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
