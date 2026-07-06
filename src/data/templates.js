export const workTemplates = [
  {
    id: "daily",
    label: "今日の仕事整理",
    mode: "planning",
    prompt: "今日やるべきことを、売上に近い順に優先順位をつけて整理して。最後に今すぐやる1つを決めて。",
  },
  {
    id: "apply",
    label: "応募文作成",
    mode: "sales",
    prompt: "クラウドワークスやランサーズ向けの応募文を作って。KEVIRIOの健として自然に名乗る文章にして。実績が薄くても信頼される構成にして。",
  },
  {
    id: "reply",
    label: "メール返信",
    mode: "communication",
    prompt: "相手に失礼なく、でもこちらの条件や確認事項が伝わる返信文を作って。必要なら報酬・納期・作業範囲も確認して。",
  },
  {
    id: "sales",
    label: "営業文作成",
    mode: "sales",
    prompt: "AI業務支援・SNS運用・記事作成・バックオフィス支援を提案する営業文を作って。押し売り感はなく、相手の課題解決に寄せて。",
  },
  {
    id: "sns",
    label: "SNS投稿",
    mode: "content",
    prompt: "Instagram / Threads / Xで使える投稿案を5つ作って。フック、本文、CTAまでセットで。",
  },
  {
    id: "proposal",
    label: "提案書たたき台",
    mode: "proposal",
    prompt: "クライアント向けの提案書の構成を作って。課題、提案内容、進め方、納品物、費用感、次のアクションを含めて。",
  },
];
