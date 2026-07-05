import { analyzeOpportunity, buildContentFromAnalysis } from "./workflowEngine";

export function runOneClickPipeline(input) {
  const analysis = analyzeOpportunity(input);
  const draft = buildContentFromAnalysis(analysis);

  const approval = {
    id: Date.now(),
    title: draft.title,
    channel: draft.channel,
    asp: draft.asp,
    time: "今日 20:00",
    status: "承認待ち",
    value: draft.value,
    counted: false,
  };

  const pipelineRun = {
    id: Date.now() + 1,
    title: analysis.title,
    status: "承認待ち追加済み",
    steps: ["分析", "投稿生成", "承認待ち追加"],
    score: analysis.score,
    estimate: analysis.estimate,
    createdAt: new Date().toLocaleString("ja-JP"),
  };

  return { analysis, draft, approval, pipelineRun };
}
