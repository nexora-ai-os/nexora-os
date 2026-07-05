export function buildAssistantReply(input, programs, approvals) {
  const text = input.trim();
  const top = [...programs].sort((a, b) => b.score - a.score)[0];
  const waiting = approvals.filter((a) => a.status === "承認待ち").length;

  if (!text) return "指示を入力してください。例：今日やること、PLAUD投稿案、承認待ち確認";

  if (text.includes("今日") || text.includes("やる")) {
    return `今日の優先順位です。\n1. ${top.name}の投稿ネタを作成\n2. Content Studioで本文生成\n3. Approval Centerで承認\n4. Analyticsで売上反映を確認\n\n現在の承認待ちは${waiting}件です。`;
  }

  if (text.toLowerCase().includes("plaud") || text.includes("投稿")) {
    return `PLAUD投稿案です。\n\nタイトル：AIボイスレコーダーで議事録作成を時短する方法\n媒体：Instagram / Threads / Blog\n構成：\n1. 会議後の議事録が面倒という悩み\n2. PLAUDで録音・文字起こし・要約\n3. 副業・営業・打合せに使える\n4. 保存CTA：あとで見返すために保存\n5. プロフィールリンクへ誘導`;
  }

  if (text.includes("承認")) {
    return `承認待ちは${waiting}件です。収益化を早めるなら、まず承認待ちを処理してください。承認済みにするとAnalyticsへクリック・CV・売上が反映されます。`;
  }

  return `了解です。現時点では「${top.name}」を軸に動くのが最も現実的です。理由はRevenue Score ${top.score}、予測売上 ${top.predicted.toLocaleString()}円で、他案件より優先度が高いためです。`;
}

export function buildDraftFromAssistant(programs) {
  const top = [...programs].sort((a, b) => b.score - a.score)[0];

  return {
    title: `${top.name}を使ったAI時短投稿`,
    channel: "Instagram / Threads / Blog",
    asp: top.name,
    value: Math.round(top.predicted / 3),
    body: `テーマ：${top.name}を使ったAI時短投稿

Instagram構成：
1枚目：まだ手作業で議事録を作っていますか？
2枚目：会議後のまとめ作業は時間を奪います
3枚目：${top.name}なら録音・文字起こし・要約を効率化
4枚目：営業、面談、副業、打合せで活用可能
5枚目：AIツールを使う人と使わない人で差が出る
6枚目：詳しくはプロフィールリンクから確認

Threads投稿：
会議後の議事録作成に時間を取られているなら、AIボイスレコーダーの導入はかなり現実的です。${top.name}は録音から要約までの流れを短縮できます。

ブログ見出し：
H2：${top.name}とは
H2：どんな人に向いているか
H2：副業・営業での活用例
H2：注意点
H2：まとめ`,
  };
}
