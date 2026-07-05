import { useMemo, useState } from "react";
import TopBar from "./TopBar";

export default function AffiliateHub({ programs, setPrograms, setDraft, setPage, savedAt }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("score");

  const filtered = useMemo(() => {
    return programs
      .filter((p) => `${p.name} ${p.asp} ${p.category}`.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => sort === "predicted" ? b.predicted - a.predicted : b.score - a.score);
  }, [programs, query, sort]);

  const toggleFavorite = (name) => {
    setPrograms((prev) => prev.map((p) => p.name === name ? { ...p, favorite: !p.favorite } : p));
  };

  const sendToStudio = (item, type) => {
    setDraft({
      title: `${item.name}を使った${type}`,
      channel: "Instagram / Threads / Blog",
      asp: item.name,
      value: Math.round(item.predicted / 3),
      body: `【${type}】
案件：${item.name}
カテゴリ：${item.category}
報酬：${item.reward}
Revenue Score：${item.score}

投稿テーマ案：
1. ${item.category}で作業時間を減らす方法
2. 初心者でも使いやすい${item.name}活用法
3. 副業・仕事効率化に${item.name}が向いている理由

CTA：
詳しくはプロフィールリンクから確認。`
    });
    setPage("content");
  };

  return (
    <main className="content">
      <TopBar savedAt={savedAt} />

      <div className="panel">
        <h1>Affiliate Hub</h1>
        <p className="muted">案件管理・検索・お気に入り・Content Studio連携。</p>
        <div className="toolbar">
          <input className="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="案件名・ASP・カテゴリで検索" />
          <select className="search small" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="score">Score順</option>
            <option value="predicted">予測売上順</option>
          </select>
        </div>
      </div>

      <div className="grid">
        {filtered.map((item) => (
          <div className="card offer-card" key={item.name}>
            <div className="card-header">
              <div>
                <h2>{item.name}</h2>
                <p>{item.category}</p>
              </div>
              <span className="badge">Score {item.score}</span>
            </div>

            <ul>
              <li>ASP：{item.asp}</li>
              <li>報酬：{item.reward}</li>
              <li>予測：{item.predicted.toLocaleString()}円</li>
              <li>お気に入り：{item.favorite ? "YES" : "NO"}</li>
            </ul>

            <div className="actions">
              <button onClick={() => toggleFavorite(item.name)}>{item.favorite ? "★ 解除" : "★ 追加"}</button>
              <button onClick={() => sendToStudio(item, "投稿ネタ")}>📝 投稿ネタ</button>
              <button onClick={() => sendToStudio(item, "記事ネタ")}>📖 記事ネタ</button>
              <button onClick={() => sendToStudio(item, "動画台本")}>🎬 動画台本</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
