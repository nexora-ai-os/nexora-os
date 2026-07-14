import { useMemo, useState } from "react";
import { buildMockRevenueCampaign, getDefaultRevenueCampaignInput } from "../services/revenueCampaignService";
import { generateRevenuePackage } from "../services/revenuePackageService";
import { canExecute, createPhase1Context, EXECUTION_MODES } from "../services/safetyEngine";
import { getEmployeeById } from "../services/aiWorkforceService";

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
