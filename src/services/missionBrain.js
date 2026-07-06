import { affiliatePrograms } from "../data/affiliatePrograms";

function priorityScore(priority) {
  if (priority === "high") return 40;
  if (priority === "medium") return 25;
  return 10;
}

function statusScore(status) {
  if (status === "done") return -100;
  if (status === "doing") return 20;
  return 0;
}

function categoryScore(category = "") {
  if (category.includes("収益")) return 25;
  if (category.includes("営業")) return 22;
  if (category.includes("集客")) return 16;
  if (category.includes("運用")) return 12;
  return 8;
}

export function analyzeMission({ tasks = [], approvals = [], analytics = {}, pipelineRuns = [] }) {
  const monthlyGoal = 300000;
  const revenue = analytics.revenue || 0;
  const remaining = Math.max(monthlyGoal - revenue, 0);
  const waitingApprovals = approvals.filter((item) => item.status === "承認待ち").length;
  const activePipeline = pipelineRuns.length;

  const rankedTasks = tasks
    .map((task) => {
      const value = task.value || 0;
      const score =
        priorityScore(task.priority) +
        categoryScore(task.category) +
        statusScore(task.status) +
        Math.min(30, Math.round(value / 500)) +
        (waitingApprovals > 0 && task.category === "運用" ? 12 : 0);

      const expectedImpact = value;
      const estimatedMinutes = task.priority === "high" ? 45 : task.priority === "medium" ? 30 : 15;
      const roiPerHour = Math.round((expectedImpact / estimatedMinutes) * 60);

      return {
        ...task,
        score,
        expectedImpact,
        estimatedMinutes,
        roiPerHour,
        reason: buildTaskReason(task, score, roiPerHour),
      };
    })
    .filter((task) => task.status !== "done")
    .sort((a, b) => b.score - a.score);

  const topTask = rankedTasks[0] || null;
  const confidenceScore = calculateBusinessConfidence({
    revenue,
    monthlyGoal,
    waitingApprovals,
    rankedTasks,
    activePipeline,
  });

  const recommendedPrograms = affiliatePrograms
    .map((program) => ({
      ...program,
      score: scoreAffiliate(program, rankedTasks),
      recommendation: buildAffiliateRecommendation(program),
    }))
    .sort((a, b) => b.score - a.score);

  const risks = buildRisks({ waitingApprovals, rankedTasks, remaining });
  const nextActions = buildNextActions({ topTask, rankedTasks, recommendedPrograms });

  return {
    monthlyGoal,
    revenue,
    remaining,
    waitingApprovals,
    activePipeline,
    rankedTasks,
    topTask,
    confidenceScore,
    recommendedPrograms,
    risks,
    nextActions,
  };
}

function buildTaskReason(task, score, roiPerHour) {
  const parts = [];
  if (task.priority === "high") parts.push("優先度が高い");
  if ((task.value || 0) >= 8000) parts.push("収益インパクトが大きい");
  if (task.category === "収益化") parts.push("収益導線に直結");
  if (task.category === "営業") parts.push("案件獲得に直結");
  parts.push(`ROI目安 ${roiPerHour.toLocaleString()}円/h`);
  return parts.join(" / ");
}

function calculateBusinessConfidence({ revenue, monthlyGoal, waitingApprovals, rankedTasks, activePipeline }) {
  const revenueScore = Math.min(30, Math.round((revenue / monthlyGoal) * 30));
  const taskScore = rankedTasks.length > 0 ? 22 : 8;
  const pipelineScore = Math.min(20, activePipeline * 10);
  const approvalPenalty = Math.min(12, waitingApprovals * 4);
  const executionScore = rankedTasks.some((task) => task.priority === "high") ? 18 : 10;

  return Math.max(0, Math.min(100, revenueScore + taskScore + pipelineScore + executionScore - approvalPenalty + 25));
}

function scoreAffiliate(program, tasks) {
  let score = 40;
  if (program.category.includes("AI")) score += 20;
  if (program.reward >= 7000) score += 15;
  if (tasks.some((task) => task.category === "収益化")) score += 15;
  if (program.name.includes("Panasonic")) score += 8;
  if (program.name.includes("FÜRDI")) score += 10;
  return score;
}

function buildAffiliateRecommendation(program) {
  if (program.id === "furdi") {
    return "AI×健康・仕事効率化の記事やSNS導線に向いています。効果保証ではなく、体験・選択肢として紹介するのが安全です。";
  }
  if (program.id === "panasonic-bistro") {
    return "AI家電・家事効率化・時短記事に向いています。KEVIRIOの『AIが生活と仕事を支える』世界観に接続しやすいです。";
  }
  return "KEVIRIOの収益導線候補です。";
}

function buildRisks({ waitingApprovals, rankedTasks, remaining }) {
  const risks = [];
  if (remaining > 0) risks.push(`月間目標まで${remaining.toLocaleString()}円不足しています。`);
  if (waitingApprovals > 0) risks.push(`承認待ちが${waitingApprovals}件あります。停滞すると売上反映が遅れます。`);
  if (rankedTasks.length === 0) risks.push("未完了タスクがありません。新しい仕事を登録してください。");
  if (!rankedTasks.some((task) => task.category === "営業" || task.category === "収益化")) {
    risks.push("営業・収益化タスクが不足しています。売上に直結する行動を追加してください。");
  }
  return risks;
}

function buildNextActions({ topTask, rankedTasks, recommendedPrograms }) {
  const actions = [];
  if (topTask) actions.push(`最初に「${topTask.title}」を完了してください。`);
  if (recommendedPrograms[0]) actions.push(`${recommendedPrograms[0].name}を使った記事・SNS導線を1本作ってください。`);
  if (rankedTasks.length >= 2) actions.push(`2番目は「${rankedTasks[1].title}」です。`);
  actions.push("最後にAI Companionで応募文・投稿文・営業文のいずれかを生成してください。");
  return actions;
}
