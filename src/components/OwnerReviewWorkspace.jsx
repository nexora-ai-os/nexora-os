import { useEffect, useMemo, useState } from "react";
import { buildMockRevenueCampaign, getDefaultRevenueCampaignInput } from "../services/revenueCampaignService";
import { generateRevenuePackage } from "../services/revenuePackageService";
import { canExecute, createPhase1Context, EXECUTION_MODES } from "../services/safetyEngine";
import { getEmployeeById } from "../services/aiWorkforceService";
import {
  buildOwnerReviewQueueViewModel,
  loadOwnerReviewCandidates,
} from "../services/ownerReviewCandidateAdapter";
import {
  REVIEW_REASON_OPTIONS,
} from "../services/ownerReviewDecisionService";
import {
  loadPublishImprovementState,
  runOwnerReviewWorkflow,
} from "../services/publishImprovementOrchestrator";
import { loadCrossLaneRevenue, orchestrateThreeRevenueLanes } from "../services/crossLaneRevenueOrchestrator";
import { buildOpenAISandboxGatewayRequest, executeOpenAISandboxGateway } from "../services/openAISandboxGateway";

const REVIEW_TYPES = ["SEO_TITLE", "JP_SNS_POST", "BLOG_ARTICLE", "CANVA_INSTRUCTION"];

const ARTIFACT_LABELS = {
  SEO_TITLE: "SEO",
  JP_SNS_POST: "Instagram",
  BLOG_ARTICLE: "Blog",
  CANVA_INSTRUCTION: "Canva",
};

const CHANNEL_BY_TYPE = {
  SEO_TITLE: "検索流入",
  JP_SNS_POST: "Instagram",
  BLOG_ARTICLE: "Blog",
  CANVA_INSTRUCTION: "Canva",
};

const PIPELINE_LABELS = {
  Draft: "Draft",
  Review: "Review",
  Revision: "Revision",
  Ready: "Ready",
};

function getBrowserStorage() {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function loadMarketReviewData() {
  const storage = getBrowserStorage();
  const loadResult = loadOwnerReviewCandidates(storage);
  const queue = buildOwnerReviewQueueViewModel(loadResult);
  const item = queue.items[0] || null;
  const candidate = item && loadResult.ok
    ? loadResult.workspace.reviewCandidatesById[item.reviewCandidateId] || null
    : null;
  const workflow = candidate ? loadPublishImprovementState(storage, candidate) : { ok: true, payload: {} };
  return {
    queue,
    item,
    candidate,
    workflow: workflow.ok ? workflow.payload : {},
    error: workflow.ok ? "" : "保存済みWorkspaceを安全に確認できません。Mock処理を停止しています。",
  };
}

function getDecisionLabel(decision) {
  if (decision === "approvedForMockWorkflow") return "Mock公開準備へ承認済み";
  if (decision === "revisionRequested") return "修正依頼済み";
  if (decision === "rejected") return "却下済み";
  return "レビュー待ち";
}

function getReviewStatusLabel(status) {
  if (status === "reviewPending") return "レビュー待ち";
  if (status === "superseded") return "差し替え済み";
  return "Mock状態";
}

function formatYen(value) {
  return `${Number(value || 0).toLocaleString("ja-JP")}円`;
}

function getArtifactText(artifact) {
  const draft = artifact?.draft || {};
  const firstPost = draft.posts?.[0];
  const sections = draft.bodySections?.map((section) => `${section.heading}: ${section.body}`).join("\n");
  return {
    title: draft.primaryTitle || draft.title || draft.canvasType || artifact?.title || "成果物",
    body: firstPost?.body || draft.introduction || sections || draft.copy || draft.layout || draft.primaryCTA || "AI社員が作成したMock成果物です。",
    point: draft.primaryKeyword || draft.searchIntent || draft.format || draft.CTA || "公開前確認",
  };
}

function createEventCandidate(artifact, action) {
  return {
    eventName: action === "PublishQueue" ? "publish.prepared" : action === "Ready" ? "quality.reviewed" : action === "Revision" ? "content.generated" : "owner.rejected",
    candidateStatus: "PLANNED",
    notOccurred: true,
    appendable: false,
    mockOnly: true,
    note: "Event Candidateのみ。Ledger appendは行いません。",
    target: artifact?.artifactType,
  };
}

function buildRevisionDraft(artifact, instruction) {
  const current = getArtifactText(artifact);
  const scope = ARTIFACT_LABELS[artifact.artifactType] || artifact.artifactType;
  return {
    title: `${current.title} / 修正版`,
    body: `${scope}だけをMock再生成しました。修正指示: ${instruction || "表現を短くし、Owner判断しやすくする"}。外部送信、公開、承認確定は行っていません。`,
    point: "対象成果物のみ再提出",
  };
}

function buildPublishBundle({ artifact, draft }) {
  const channel = CHANNEL_BY_TYPE[artifact.artifactType] || "Sandbox";
  return {
    queueStatus: "Publish Queue",
    sandboxStatus: "Sandbox確認待ち",
    analyticsStatus: "Mock Analytics生成済み",
    channel,
    scheduledWindow: "明日 10:00 / Sandbox予定",
    ownerNextAction: "Sandbox確認",
    publishMode: "SANDBOX_ONLY",
    externalExecution: false,
    productionExecution: false,
    approvalConfirmed: false,
    actualRevenue: false,
    title: draft.title,
    analytics: {
      forecastReach: artifact.artifactType === "BLOG_ARTICLE" ? 320 : 180,
      mockClicks: artifact.artifactType === "SEO_TITLE" ? 24 : 16,
      mockLeads: artifact.artifactType === "CANVA_INSTRUCTION" ? 2 : 1,
      revenueSignal: "初売上導線の検証材料",
    },
    eventCandidate: createEventCandidate(artifact, "PublishQueue"),
  };
}

export default function OwnerReviewWorkspace({ revenueCampaigns = [], budget }) {
  const [selectedType, setSelectedType] = useState("SEO_TITLE");
  const [pipeline, setPipeline] = useState({});
  const [revisionNotes, setRevisionNotes] = useState({});
  const [revisedDrafts, setRevisedDrafts] = useState({});
  const [publishQueue, setPublishQueue] = useState({});
  const [sandboxChecks, setSandboxChecks] = useState({});
  const [openDetails, setOpenDetails] = useState(false);
  const [openPublishDetails, setOpenPublishDetails] = useState(false);
  const [openMarketReviewDetails, setOpenMarketReviewDetails] = useState(false);
  const [marketReviewData, setMarketReviewData] = useState(() => loadMarketReviewData());
  const [marketDecisionReason, setMarketDecisionReason] = useState("CLARIFY_OFFER");
  const [marketRejectReason, setMarketRejectReason] = useState("NOT_ALIGNED");
  const [marketWorkflowError, setMarketWorkflowError] = useState("");
  const [threeLaneResult, setThreeLaneResult] = useState(() => ({ orchestration: null }));
  const [openAISandboxArmed, setOpenAISandboxArmed] = useState(false);
  const [openAISandboxRunning, setOpenAISandboxRunning] = useState(false);
  const [openAISandboxResult, setOpenAISandboxResult] = useState(null);
  const [openAISandboxDecision, setOpenAISandboxDecision] = useState("pending");
  const marketReviewQueue = marketReviewData.queue;
  const marketReviewItem = marketReviewData.item;
  const marketReviewCandidate = marketReviewData.candidate;
  const marketWorkflow = marketReviewData.workflow || {};
  const latestRevision = marketWorkflow.latestRevision;
  const exportEntity = marketWorkflow.exportEntity;
  const sandboxPerformance = marketWorkflow.sandboxPerformance;
  const improvementRecommendations = marketWorkflow.improvementRecommendations || [];
  const topImprovement = improvementRecommendations[0];
  const marketDecision = marketWorkflow.decision;

  const packageDraft = useMemo(() => {
    const campaign = revenueCampaigns[0] || buildMockRevenueCampaign(getDefaultRevenueCampaignInput(), budget).campaign;
    const result = campaign ? generateRevenuePackage(campaign, { budget }) : null;
    return result?.ok ? result.packageDraft : null;
  }, [budget, revenueCampaigns]);

  const reviewItems = useMemo(() => {
    const artifacts = Array.isArray(packageDraft?.artifacts) ? packageDraft.artifacts : [];
    return REVIEW_TYPES.map((artifactType, index) => {
      const artifact = artifacts.find((item) => item.artifactType === artifactType);
      const status = pipeline[artifactType]?.status || (index === 0 ? "Review" : "Draft");
      return { artifact, artifactType, priority: index + 1, status };
    }).filter((item) => item.artifact);
  }, [packageDraft, pipeline]);

  const selected = reviewItems.find((item) => item.artifactType === selectedType) || reviewItems[0];
  const selectedArtifact = selected?.artifact;
  const selectedEmployee = getEmployeeById(selectedArtifact?.primaryOwnerEmployeeId);
  const currentDraft = revisedDrafts[selected?.artifactType] || getArtifactText(selectedArtifact);
  const pendingCount = reviewItems.filter((item) => item.status !== "Ready").length;
  const readyItems = reviewItems.filter((item) => item.status === "Ready");
  const selectedPublish = selected ? publishQueue[selected.artifactType] : null;
  const currentEvent = selectedPublish?.eventCandidate || (selected ? pipeline[selected.artifactType]?.eventCandidate : null);

  const revisionGuard = useMemo(() => canExecute(createPhase1Context({
    executionMode: EXECUTION_MODES.DEVELOPMENT,
    actionType: "content.revision.mock.generate",
    workflowType: "internal-mock",
    isExternalRequest: false,
    ownerApproved: false,
    approvalValid: false,
    emergencyStop: { active: Boolean(budget?.emergencyStop) },
    estimatedTaskCost: 0,
    estimatedWorkflowCost: 0,
    dailyUsage: Number(budget?.dailyUsed || 0),
    monthlyUsage: Number(budget?.monthlyUsed || 0),
    budgetLimits: budget || undefined,
    provider: { id: "local-mock", status: "mock-only" },
    mockOnly: true,
  })), [budget]);

  const publishGuard = useMemo(() => canExecute(createPhase1Context({
    executionMode: EXECUTION_MODES.DEVELOPMENT,
    actionType: "publish.sandbox.mock.prepare",
    workflowType: "internal-mock",
    isExternalRequest: false,
    ownerApproved: false,
    approvalValid: false,
    emergencyStop: { active: Boolean(budget?.emergencyStop) },
    estimatedTaskCost: 0,
    estimatedWorkflowCost: 0,
    dailyUsage: Number(budget?.dailyUsed || 0),
    monthlyUsage: Number(budget?.monthlyUsed || 0),
    budgetLimits: budget || undefined,
    provider: { id: "local-mock", status: "mock-only" },
    mockOnly: true,
  })), [budget]);

  const movePipeline = (status, note = "") => {
    if (!selectedArtifact) return;
    setPipeline((current) => ({
      ...current,
      [selected.artifactType]: {
        status,
        note,
        eventCandidate: createEventCandidate(selectedArtifact, status),
      },
    }));
  };

  const moveReadyToPublishQueue = (artifact, draft) => {
    if (!artifact || !publishGuard.allowed) return;
    setPublishQueue((current) => ({
      ...current,
      [artifact.artifactType]: buildPublishBundle({ artifact, draft }),
    }));
  };

  const handleOk = () => {
    movePipeline("Ready");
    moveReadyToPublishQueue(selectedArtifact, currentDraft);
  };

  const handleLater = () => movePipeline("Review", "あとで確認");

  const handleRevision = () => {
    if (!selectedArtifact) return;
    const note = revisionNotes[selected.artifactType] || "";
    if (!revisionGuard.allowed) {
      movePipeline("Revision", `Safety Engine blocked: ${revisionGuard.reasonCode}`);
      return;
    }
    const nextDraft = buildRevisionDraft(selectedArtifact, note);
    setRevisedDrafts((current) => ({
      ...current,
      [selected.artifactType]: nextDraft,
    }));
    movePipeline("Revision", note || "短く、判断しやすく修正");
  };

  const handleSandboxCheck = () => {
    if (!selectedPublish) return;
    setSandboxChecks((current) => ({
      ...current,
      [selected.artifactType]: {
        checked: true,
        checkedAtLabel: "Owner確認済み / Mock",
        decision: "Sandbox確認のみ。公開承認ではありません。",
      },
    }));
  };

  const refreshMarketWorkflow = () => setMarketReviewData(loadMarketReviewData());

  const handleMarketDecision = (decision) => {
    if (!marketReviewCandidate) return;
    const reasonCode = decision === "revisionRequested"
      ? marketDecisionReason
      : decision === "rejected"
        ? marketRejectReason
        : "MOCK_WORKFLOW_READY";
    const reason = (REVIEW_REASON_OPTIONS[decision] || []).find((option) => option.code === reasonCode);
    const result = runOwnerReviewWorkflow(getBrowserStorage(), marketReviewCandidate, {
      decision,
      reasonCode,
      reasonText: reason?.label,
      decidedAt: "2026-07-16T00:00:00.000Z",
    });
    if (!result.ok) {
      setMarketWorkflowError("安全境界により処理を停止しました。Mock Workspaceは変更していません。");
      return;
    }
    setMarketWorkflowError("");
    refreshMarketWorkflow();
  };

  const handleExportMarkdown = () => {
    if (!exportEntity?.markdown || typeof window === "undefined") return;
    const blob = new Blob([exportEntity.markdown], { type: "text/markdown;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${exportEntity.exportId.replaceAll(":", "-")}.md`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };
  const handleThreeLaneDeploy = () => {
    const result = orchestrateThreeRevenueLanes(getBrowserStorage(), exportEntity, { reviewDecision: marketDecision, latestRevision });
    setThreeLaneResult(result.ok ? result : { ...result, orchestration: null });
  };
  const handleOpenAISandbox = async () => {
    if (!openAISandboxArmed) {
      setOpenAISandboxArmed(true);
      return;
    }
    const directService = threeLaneResult.orchestration?.lanes?.directService;
    if (!exportEntity || !directService || openAISandboxRunning) return;
    setOpenAISandboxRunning(true);
    setOpenAISandboxDecision("pending");
    const request = buildOpenAISandboxGatewayRequest({ sourceExport: exportEntity, directService, emergencyStopActive: Boolean(budget?.emergencyStop) });
    const result = await executeOpenAISandboxGateway(request);
    setOpenAISandboxResult(result);
    setOpenAISandboxRunning(false);
    setOpenAISandboxArmed(false);
  };
  useEffect(() => {
    if (!exportEntity) {
      setThreeLaneResult({ orchestration: null });
      return;
    }
    const loaded = loadCrossLaneRevenue(getBrowserStorage(), exportEntity.exportId);
    setThreeLaneResult(loaded.ok ? loaded : { ...loaded, orchestration: null });
  }, [exportEntity?.exportId]);

  if (!selected) {
    return (
      <main className="content">
        <section className="panel sprint-review">
          <p className="eyebrow">Sprint1 / Sprint2</p>
          <h1>レビュー対象がありません</h1>
          <p>Mock成果物の生成がSafety Engineで停止しています。</p>
        </section>
      </main>
    );
  }

  return (
    <main className="content">
      <section className="sprint-review">
        <section className="panel market-review-candidate-panel" aria-live="polite">
          <div className="section-head">
            <div>
              <p className="eyebrow">Market Intelligence</p>
              <h2>Mock成果物レビュー待ち</h2>
            </div>
            <span className="badge">{marketReviewQueue.items.length}件</span>
          </div>

          {!marketReviewQueue.ok && (
            <p className="market-review-safe-message">{marketReviewQueue.message}</p>
          )}

          {marketReviewQueue.ok && !marketReviewItem && (
            <p className="market-review-safe-message">Market由来のレビュー待ちはありません。</p>
          )}

          {marketReviewQueue.ok && marketReviewItem && (
            <div className="market-review-candidate">
              <div className="market-review-summary">
                <div>
                  <span>Campaign</span>
                  <strong>{marketReviewItem.campaignTitle}</strong>
                </div>
                <div>
                  <span>対象者</span>
                  <strong>{marketReviewItem.targetAudience}</strong>
                </div>
                <div>
                  <span>Channel</span>
                  <strong>{marketReviewItem.channel}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>{getDecisionLabel(marketDecision?.decision) || getReviewStatusLabel(marketReviewItem.status)}</strong>
                </div>
                <div>
                  <span>Revision</span>
                  <strong>{latestRevision ? `${latestRevision.revisionNumber}回目` : "未修正"}</strong>
                </div>
              </div>

              <p className="market-review-safe-message">
                {marketReviewItem.mockLabel}。{marketReviewItem.safetyLabel}
              </p>

              {(marketWorkflowError || marketReviewData.error) && (
                <p className="market-review-alert" role="alert">
                  {marketWorkflowError || marketReviewData.error}
                </p>
              )}

              <div className="market-review-decision-box" aria-label="Owner Review Decision">
                <div>
                  <p className="eyebrow">One Next Action</p>
                  <h3>{marketDecision?.decision === "approvedForMockWorkflow" ? "Mock公開準備が完了しました" : "Owner判断を選んでください"}</h3>
                  <p>この承認はMock成果物を公開準備へ進めるだけです。Production公開、外部送信、実売上確定は行いません。</p>
                </div>
                <div className="market-review-decision-actions">
                  <button
                    type="button"
                    aria-pressed={marketDecision?.decision === "approvedForMockWorkflow"}
                    onClick={() => handleMarketDecision("approvedForMockWorkflow")}
                  >
                    承認
                  </button>
                  <button
                    type="button"
                    aria-pressed={marketDecision?.decision === "revisionRequested"}
                    onClick={() => handleMarketDecision("revisionRequested")}
                  >
                    修正依頼
                  </button>
                  <button
                    type="button"
                    aria-pressed={marketDecision?.decision === "rejected"}
                    onClick={() => handleMarketDecision("rejected")}
                  >
                    却下
                  </button>
                </div>
                <div className="market-review-reasons">
                  <label>
                    <span>修正理由</span>
                    <select value={marketDecisionReason} onChange={(event) => setMarketDecisionReason(event.target.value)}>
                      {REVIEW_REASON_OPTIONS.revisionRequested.map((option) => (
                        <option key={option.code} value={option.code}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>却下理由</span>
                    <select value={marketRejectReason} onChange={(event) => setMarketRejectReason(event.target.value)}>
                      {REVIEW_REASON_OPTIONS.rejected.map((option) => (
                        <option key={option.code} value={option.code}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              {latestRevision && (
                <div className="market-workflow-card" aria-live="polite">
                  <p className="eyebrow">AI Revision Candidate</p>
                  <h3>AI社員が修正案を生成しました</h3>
                  <p>再レビューが必要です。Score、Ranking、Forecastは再計算していません。</p>
                  <ul>
                    {latestRevision.changesSummary.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                  <div className="market-workflow-preview">{latestRevision.revisedDraftPreview}</div>
                </div>
              )}

              {exportEntity && sandboxPerformance && topImprovement && (
                <div className="market-workflow-output" aria-live="polite">
                  <div className="market-workflow-card">
                    <p className="eyebrow">Publish-ready Export</p>
                    <h3>{exportEntity.title}</h3>
                    <p>{exportEntity.campaignSummary}</p>
                    <button type="button" onClick={handleExportMarkdown}>Markdownをローカル保存</button>
                  </div>
                  <div className="market-workflow-card">
                    <p className="eyebrow">Sandbox模擬結果</p>
                    <h3>実績ではありません</h3>
                    <div className="market-performance-grid">
                      <div><span>表示</span><strong>{sandboxPerformance.mockImpressions.toLocaleString("ja-JP")}</strong></div>
                      <div><span>クリック</span><strong>{sandboxPerformance.mockClicks.toLocaleString("ja-JP")}</strong></div>
                      <div><span>Lead</span><strong>{sandboxPerformance.mockLeads.toLocaleString("ja-JP")}</strong></div>
                      <div><span>Sandbox模擬売上</span><strong>{formatYen(sandboxPerformance.mockRevenueEstimate.base)}</strong></div>
                    </div>
                    <p>外部Analytics未接続。Actual Revenueは未接続です。</p>
                  </div>
                  <div className="market-workflow-card">
                    <p className="eyebrow">最優先改善案</p>
                    <h3>{topImprovement.finding}</h3>
                    <p>{topImprovement.recommendedChange}</p>
                    <strong>{topImprovement.nextAction}</strong>
                  </div>
                </div>
              )}
              {exportEntity && (
                <section className="three-lane-panel" aria-live="polite">
                  <div><p className="eyebrow">3つの収益レーン</p><h3>この成果物を3つの収益レーンへ展開できます</h3><p>現在はMock候補の作成のみです。外部への送信や公開は行いません。</p></div>
                  <button type="button" onClick={handleThreeLaneDeploy}>3レーンへ展開</button>
                  {threeLaneResult.message && <p className="market-review-alert" role="alert">{threeLaneResult.message}</p>}
                  {threeLaneResult.orchestration && (() => { const o=threeLaneResult.orchestration; const p=o.lanes.directService.packageOptions[0]; return <div className="three-lane-summary">
                    <div><span>最優先の収益レーン</span><strong>制作サービス</strong><small>{p.name} / 提案価格 {formatYen(p.forecastPriceJpy)}（予測）/ 納期 {p.deliveryDays}日</small></div>
                    <div><span>SNS候補</span><strong>{o.lanes.snsMedia.posts.length}件</strong><small>投稿機能は未接続</small></div>
                    <div><span>Affiliate候補</span><strong>{o.lanes.affiliate.linkCandidates.length}件</strong><small>リンク未接続・プログラム確認が必要</small></div>
                    <div><span>OpenAI</span><strong>実接続はロック中</strong><small>現在はMock生成のみ</small></div>
                    <div><span>次の判断</span><strong>制作サービスの提案内容を確認する</strong></div>
                    <details><summary>3つの収益レーンの詳細</summary><h4>制作サービス 3プラン</h4><ul>{o.lanes.directService.packageOptions.map(x=><li key={x.packageId}>{x.name}：提案価格 {formatYen(x.forecastPriceJpy)}（予測）/ 修正{x.revisionLimit}回</li>)}</ul><h4>Affiliate候補</h4><p>{o.lanes.affiliate.articleTitle} / 広告・Affiliate開示文あり / リンク未接続 / ASP・プログラム確認が必要</p><h4>SNS候補</h4><p>短文投稿 3件・カルーセル構成 1件・スレッド構成 1件 / 投稿機能は未接続</p><h4>安全状態</h4><p>Mock運用 / 外部通信なし / Production実行なし / 実売上未接続 / Ledger記録なし</p></details>
                    <section className="openai-sandbox-card">
                      <div><span>OpenAI実接続</span><strong>{openAISandboxResult?.ok ? "Sandbox生成完了" : openAISandboxRunning ? "生成中" : openAISandboxArmed ? "最終確認待ち" : "準備確認中"}</strong><small>少額API利用の可能性があります。Production公開、SNS投稿、Affiliateリンク発行、実売上接続は行いません。</small></div>
                      <button type="button" onClick={handleOpenAISandbox} disabled={openAISandboxRunning}>{openAISandboxRunning ? "実行中" : openAISandboxArmed ? "確認して1回実行" : "OpenAI Sandbox生成を1回実行"}</button>
                      {openAISandboxArmed && <p className="market-review-safe-message">Direct Service Draftだけを1回生成します。再読込や画面表示では実行されません。</p>}
                      {openAISandboxResult && !openAISandboxResult.ok && <p className="market-review-alert" role="alert">{openAISandboxResult.message}（{openAISandboxResult.reasonCode || "条件未確認"}）</p>}
                      {openAISandboxResult?.ok && <div className="openai-sandbox-preview"><h4>OpenAI Sandbox 制作サービス案</h4><strong>{openAISandboxResult.validatedOutput.serviceName}</strong><p>{openAISandboxResult.validatedOutput.proposalSummary}</p><small>使用量 {openAISandboxResult.usage.totalTokens.toLocaleString("ja-JP")} tokens / 推定費用 ${Number(openAISandboxResult.cost.estimatedUsd).toFixed(4)}</small><div className="market-review-decision-actions"><button type="button" onClick={() => setOpenAISandboxDecision("adopted")}>採用</button><button type="button" onClick={() => setOpenAISandboxDecision("held")}>保留</button><button type="button" onClick={() => setOpenAISandboxDecision("rejected")}>却下</button></div><p>Owner判断: {openAISandboxDecision === "adopted" ? "採用候補" : openAISandboxDecision === "held" ? "保留" : openAISandboxDecision === "rejected" ? "却下" : "未選択"}。既存Mockは自動上書きしません。</p></div>}
                    </section>
                  </div>; })()}
                </section>
              )}

              <button
                type="button"
                className="mi-detail-toggle"
                aria-controls="market-review-details"
                aria-expanded={openMarketReviewDetails}
                onClick={() => setOpenMarketReviewDetails((current) => !current)}
              >
                {openMarketReviewDetails ? "詳細を閉じる" : "詳細を見る"}
              </button>

              {openMarketReviewDetails && (
                <div className="market-review-details" id="market-review-details">
                  <div>
                    <span>Offer / Value Proposition</span>
                    <strong>{marketReviewItem.offerConcept}</strong>
                  </div>
                  <div>
                    <span>Content Brief</span>
                    <strong>{marketReviewItem.contentBrief}</strong>
                  </div>
                  <div>
                    <span>Draft Preview</span>
                    <p>{marketReviewItem.draftPreview}</p>
                  </div>
                  <div>
                    <span>Risk Notes</span>
                    <ul>
                      {marketReviewItem.riskNotes.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                  <div>
                    <span>禁止表現</span>
                    <ul>
                      {marketReviewItem.prohibitedClaims.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="panel sprint-decision-panel">
          <div className="sprint-focus">
            <p className="eyebrow">Owner Decision Center</p>
            <h1>今日レビューする成果物</h1>
            <strong>{ARTIFACT_LABELS[selected.artifactType]}</strong>
          </div>
          <div className="sprint-facts">
            <div><span>残件数</span><strong>{pendingCount}件</strong></div>
            <div><span>優先順位</span><strong>{selected.priority}</strong></div>
            <div><span>担当AI</span><strong>{selectedEmployee?.displayName || selectedArtifact.primaryOwnerEmployeeId}</strong></div>
            <div><span>状態</span><strong>{PIPELINE_LABELS[selected.status]}</strong></div>
          </div>
        </section>

        <section className="panel sprint-artifact-panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">成果物</p>
              <h2>{currentDraft.title}</h2>
            </div>
            <span className="badge">Mock Only / 公開待ちまで</span>
          </div>
          <p className="sprint-artifact-body">{currentDraft.body}</p>
          <p className="sprint-artifact-point">{currentDraft.point}</p>

          <div className="sprint-actions">
            <button type="button" onClick={handleOk}>OK</button>
            <button type="button" onClick={handleRevision}>修正する</button>
            <button type="button" onClick={handleLater}>あとで</button>
          </div>

          <label className="review-note sprint-note">
            <span>修正内容</span>
            <textarea
              className="prompt-box textarea compact"
              value={revisionNotes[selected.artifactType] || ""}
              onChange={(event) => setRevisionNotes((current) => ({ ...current, [selected.artifactType]: event.target.value }))}
              placeholder="例: 見出しを短くする。CTAを自然にする。Canvaだけ差し戻す。"
            />
          </label>
        </section>

        <section className="panel sprint-pipeline-panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Content Pipeline</p>
              <h2>Draft / Review / Revision / Ready</h2>
            </div>
            <button type="button" onClick={() => setOpenDetails((current) => !current)}>
              {openDetails ? "詳細を閉じる" : "詳細を見る"}
            </button>
          </div>
          <div className="sprint-pipeline">
            {reviewItems.map((item) => (
              <button
                type="button"
                className={item.artifactType === selected.artifactType ? "active" : ""}
                key={item.artifactType}
                onClick={() => setSelectedType(item.artifactType)}
              >
                <strong>{ARTIFACT_LABELS[item.artifactType]}</strong>
                <span>{PIPELINE_LABELS[item.status]}</span>
              </button>
            ))}
          </div>

          {openDetails && (
            <div className="sprint-details">
              <div>Safety: {revisionGuard.allowed ? "Mock修正のみ許可" : `停止中 (${revisionGuard.reasonCode})`}</div>
              <div>Budget: 追加費用0 / Emergency Stop必須</div>
              <div>Approval: 確定なし / Owner判断UIのみ</div>
              <div>公開: 禁止 / Readyは公開待ちのみ</div>
              <div>Event: {currentEvent ? `${currentEvent.eventName} candidate` : "未作成"}</div>
            </div>
          )}
        </section>

        <section className="panel sprint-publish-panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Sprint2 Publish Queue</p>
              <h2>公開待ち一覧</h2>
            </div>
            <button type="button" onClick={() => setOpenPublishDetails((current) => !current)}>
              {openPublishDetails ? "詳細を閉じる" : "詳細を見る"}
            </button>
          </div>

          <div className="sprint-publish-summary">
            <div><span>公開待ち</span><strong>{readyItems.length}件</strong></div>
            <div><span>公開予定</span><strong>{selectedPublish?.scheduledWindow || "Ready待ち"}</strong></div>
            <div><span>Sandbox</span><strong>{sandboxChecks[selected.artifactType]?.checked ? "確認済み" : selectedPublish?.sandboxStatus || "未作成"}</strong></div>
            <div><span>Analytics</span><strong>{selectedPublish?.analyticsStatus || "Ready後生成"}</strong></div>
          </div>

          <div className="sprint-sandbox-card">
            <div>
              <p className="eyebrow">One Next Action</p>
              <h3>{selectedPublish ? "Sandbox確認" : "まずOKでReadyへ"}</h3>
              <p>{selectedPublish ? `${selectedPublish.channel}のSandbox予定だけ確認します。Production公開は行いません。` : "ReadyになるとAI社員がPublish QueueとSandbox PublisherをMock生成します。"}</p>
            </div>
            <button type="button" onClick={handleSandboxCheck} disabled={!selectedPublish}>
              Sandbox確認
            </button>
          </div>

          {openPublishDetails && (
            <div className="sprint-details sprint-publish-details">
              <div>P0-010: ReadyをPublish Queueへ自動投入</div>
              <div>P0-011: Sandbox Publisherのみ。外部投稿なし</div>
              <div>P0-012: Mock Analytics生成。Actual Revenueなし</div>
              <div>収益インパクト: ★★★★☆ / 初売上導線を公開準備まで前進</div>
              <div>Owner操作削減: 3クリック減 / AI委譲率80%</div>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
