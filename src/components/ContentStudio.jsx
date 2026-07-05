import { useEffect, useState } from "react";
import TopBar from "./TopBar";

export default function ContentStudio({ draft, setDraft, setApprovals, setPage, savedAt }) {
  const [title, setTitle] = useState(draft.title);
  const [channel, setChannel] = useState(draft.channel);
  const [body, setBody] = useState(draft.body);
  const [copyLabel, setCopyLabel] = useState("📋 コピー");

  useEffect(() => {
    setTitle(draft.title);
    setChannel(draft.channel);
    setBody(draft.body);
  }, [draft]);

  const regenerate = () => {
    const nextBody = `テーマ：${title}
媒体：${channel}

Instagram構成：
1枚目：結論
2枚目：悩み
3枚目：解決策
4枚目：使い方
5枚目：案件導線
6枚目：保存CTA

Threads投稿：
${title}は、作業効率化・副業導線・AI活用と相性が高いテーマです。

ブログ構成：
H2：なぜ今このテーマが重要か
H2：初心者向けの使い方
H2：おすすめ案件
H2：注意点
H2：まとめ`;

    setBody(nextBody);
    setDraft((prev) => ({ ...prev, title, channel, body: nextBody }));
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(body);
      setCopyLabel("✅ コピー済み");
      setTimeout(() => setCopyLabel("📋 コピー"), 1200);
    } catch {
      setCopyLabel("コピー失敗");
    }
  };

  const addToApproval = () => {
    setDraft((prev) => ({ ...prev, title, channel, body }));

    setApprovals((prev) => [
      { id: Date.now(), title, channel, asp: draft.asp || "未設定", time: "今日 20:00", status: "承認待ち", value: draft.value || 1000, counted: false },
      ...prev,
    ]);

    setPage("approval");
  };

  return (
    <main className="content">
      <TopBar savedAt={savedAt} />

      <div className="panel">
        <h1>Content Studio</h1>
        <p className="muted">Affiliate Hubから受け取った案件情報をもとに投稿を作成。</p>

        <input className="search" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="投稿タイトル" />
        <input className="search" value={channel} onChange={(e) => setChannel(e.target.value)} placeholder="媒体" />

        <div className="actions">
          <button onClick={regenerate}>✨ 生成する</button>
          <button onClick={copy}>{copyLabel}</button>
          <button onClick={addToApproval}>✅ 承認待ちへ追加</button>
        </div>

        <textarea className="prompt-box textarea" value={body} onChange={(e) => setBody(e.target.value)} />
      </div>
    </main>
  );
}
