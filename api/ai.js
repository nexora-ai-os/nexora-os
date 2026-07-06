function buildSystemPrompt() {
  return `
あなたは KEVIRIO Core です。
KEVIRIOは、健さんが日常的に仕事を進めて収益化するためのAI Business Operating Systemです。

健さんの前提:
- 個人事業としてKEVIRIOを育てる
- 早く日常的に使って稼ぎたい
- 事実・推測・意見を分けた現実的な助言を好む
- 表面的な同意より、考慮漏れ・弱点・代替案の指摘を求める
- 物流・港湾・貿易実務、AI活用、業務改善、営業支援に関心が高い
- まずは応募文、営業文、SNS投稿、案件整理、収益化で実用化したい

必ず守ること:
- 日本語で返答する
- 事実・推測・意見を明確に分ける
- 不確かな部分は「要確認」と書く
- 仕事が前に進む具体的な次アクションを出す
- 文章作成、営業、応募文、SNS、アフィリエイト、業務改善、タスク整理を実務目線で支援する
- 冷たくならず、でも甘くしすぎない
- KEVIRIOのブランド感: 明るい、自然、上質、少し神秘的、人間中心
- 長すぎる説明より、すぐ使える成果物を優先する
`;
}

function buildUserPrompt(message, context = {}) {
  return `
現在のKEVIRIO状況:
- 月間売上目標: ${context.monthlyGoal ?? 300000}円
- 現在売上: ${context.revenue ?? 0}円
- 承認待ち: ${context.waitingApprovals ?? 0}件
- Pipeline: ${context.pipelineRuns ?? 0}件
- 今日のTodo: ${(context.todos || []).join(" / ")}
- 実行モード: ${context.mode || "general"}
- 希望モデル: ${context.provider || "auto"}

依頼:
${message}
`;
}

async function askOpenAI({ apiKey, message, context, systemPrompt }) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: buildUserPrompt(message, context) },
      ],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "OpenAI API error");
  }

  return (
    data.output_text ||
    data.output?.flatMap((item) => item.content || [])
      ?.map((part) => part.text || "")
      ?.join("\\n")
      ?.trim() ||
    "回答を生成できませんでした。"
  );
}

async function askGemini({ apiKey, message, context, systemPrompt }) {
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${systemPrompt}\\n\\n${buildUserPrompt(message, context)}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1800,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Gemini API error");
  }

  return (
    data?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\\n").trim() ||
    "回答を生成できませんでした。"
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, context = {} } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required." });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const provider = context.provider || "auto";
    const systemPrompt = buildSystemPrompt();

    let selectedProvider = provider;

    if (selectedProvider === "auto") {
      selectedProvider = openaiKey ? "openai" : geminiKey ? "gemini" : "none";
    }

    if (selectedProvider === "openai") {
      if (!openaiKey) throw new Error("OPENAI_API_KEY is not set.");
      const text = await askOpenAI({ apiKey: openaiKey, message, context, systemPrompt });
      return res.status(200).json({ text, provider: "openai" });
    }

    if (selectedProvider === "gemini") {
      if (!geminiKey) throw new Error("GEMINI_API_KEY is not set.");
      const text = await askGemini({ apiKey: geminiKey, message, context, systemPrompt });
      return res.status(200).json({ text, provider: "gemini" });
    }

    return res.status(500).json({
      error: "No AI provider is configured. Set OPENAI_API_KEY or GEMINI_API_KEY.",
    });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Unexpected server error",
    });
  }
}
