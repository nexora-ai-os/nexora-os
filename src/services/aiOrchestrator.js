
export const aiOrchestratorModes = [
  {
    id: "general",
    name: "General",
    provider: "OpenAI優先",
    role: "通常の判断・文章生成",
  },
  {
    id: "long",
    name: "Long Context",
    provider: "Gemini優先",
    role: "長文・要約・広い文脈",
  },
  {
    id: "revenue",
    name: "Revenue",
    provider: "OpenAI優先",
    role: "収益判断・ROI・優先順位",
  },
  {
    id: "legal",
    name: "Legal",
    provider: "OpenAI優先",
    role: "法務・コンプライアンス確認",
  },
  {
    id: "backup",
    name: "Backup",
    provider: "Gemini優先",
    role: "障害時・無料枠活用",
  },
];

export async function runAIOrchestrator({ message, mode = "general", provider = "auto" }) {
  const response = await fetch("/api/orchestrate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, mode, provider }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "AI Orchestrator request failed");
  }

  return data;
}
