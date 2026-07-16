import { useMemo, useState } from "react";
import { aiOrchestratorModes, runAIOrchestrator } from "../services/aiOrchestrator";
import { apiGroups, apiMilestones, buildClientApiReadiness } from "../services/apiRegistry";
import { aiDepartments, buildAgentActionMap, buildAgentCompanySummary } from "../services/agentCompany";
import { buildCostEstimate, canExecute, createPhase1Context, EXECUTION_MODES, getRouterRecommendation } from "../services/safetyEngine";

const defaultStatus = {
  ok: true,
  mock: true,
  automationReady: false,
  readyCount: 0,
  totalProviders: 0,
  providers: [],
  groups: [],
  principles: ["Phase1-A: Mock only", "No external request was sent."],
  nextBestAction: "Phase1-AではAPI実通信を行わず、Mock状態だけを表示します。",
};

function normalizeProvider(provider = {}, fallback = {}) {
  return {
    ...fallback,
    ...provider,
    id: provider.id || fallback.id || "provider",
    name: provider.name || fallback.name || "Provider",
    role: provider.role || fallback.role || "準備中",
    credentialPolicy: provider.credentialPolicy || fallback.credentialPolicy || "server-only",
    model: provider.model || provider.status || fallback.model || "planned",
    secretVisible: false,
  };
}

function displayStatus(status) {
  const labels = {
    "mock-only": "Mock専用",
    "configured-unverified": "未検証",
    planned: "予定",
    disabled: "無効",
    mock: "Mock",
  };
  return labels[status] || "未検証";
}

function normalizeStatus(rawStatus = {}) {
  const status = rawStatus && typeof rawStatus === "object" ? rawStatus : {};
  const fallbackGroups = apiGroups.map((group) => ({
    ...group,
    providers: group.providers.map((provider) => normalizeProvider({ ...provider, model: provider.status, secretVisible: false }, provider)),
  }));

  const groups = Array.isArray(status.groups) && status.groups.length
    ? status.groups.map((group) => ({
        ...group,
        providers: Array.isArray(group.providers)
          ? group.providers.map((provider) => normalizeProvider(provider, provider))
          : [],
      }))
    : fallbackGroups;

  const providers = Array.isArray(status.providers) && status.providers.length
    ? status.providers.map((provider) => normalizeProvider(provider, provider))
    : groups.flatMap((group) => group.providers.map((provider) => normalizeProvider(provider, provider)));

  const totalProviders = typeof status.totalProviders === "number" ? status.totalProviders : providers.length;
  const automationReady = false;

  return {
    ...defaultStatus,
    ...status,
    automationReady,
    readyCount: 0,
    totalProviders,
    providers,
    groups,
    principles: Array.isArray(status.principles) && status.principles.length ? status.principles : defaultStatus.principles,
    nextBestAction: status.nextBestAction || defaultStatus.nextBestAction,
  };
}

export default function APIControlCenter({ setPage, budget = {} }) {
  const [status, setStatus] = useState(defaultStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orchestratorResult, setOrchestratorResult] = useState(null);
  const [orchestratorLoading, setOrchestratorLoading] = useState(false);
  const agentSummary = buildAgentCompanySummary();
  const actionMap = buildAgentActionMap();
  const normalizedStatus = useMemo(() => normalizeStatus(status), [status]);
  const readiness = useMemo(() => buildClientApiReadiness(normalizedStatus.providers || []), [normalizedStatus.providers]);
  const costEstimate = useMemo(() => buildCostEstimate({ workflow: "api-test", provider: "mock", amount: 1 }), []);
  const routerRecommendation = useMemo(() => getRouterRecommendation("general", EXECUTION_MODES.DEVELOPMENT), []);

  const loadStatus = () => {
    setLoading(true); setError("");
    const guard = canExecute(createPhase1Context({
      actionType: "api-status",
      isExternalRequest: false,
      ownerApproved: false,
      approvalValid: false,
      mockOnly: true,
    }));
    setStatus(normalizeStatus({
      ...defaultStatus,
      ok: guard.allowed,
      mock: true,
      nextBestAction: "Mock status only. No external request was sent.",
    }));
    setLoading(false);
  };

  const testOrchestrator = async (mode = "general") => {
    setOrchestratorLoading(true); setOrchestratorResult(null);
    try {
      const result = await runAIOrchestrator({
        mode,
        provider: "auto",
        message: "Phase1-A safety check only.",
        ownerApproved: false,
        executionMode: EXECUTION_MODES.DEVELOPMENT,
      });
      setOrchestratorResult(result);
    }
    catch (err) { setOrchestratorResult({ ok: false, error: err.message }); }
    finally { setOrchestratorLoading(false); }
  };

  const groups = normalizedStatus.groups?.length
    ? normalizedStatus.groups.map((group) => ({
        ...group,
        providers: Array.isArray(group.providers) ? group.providers.map((provider) => normalizeProvider(provider, provider)) : [],
      }))
    : apiGroups.map((group) => ({
        ...group,
        providers: group.providers.map((provider) => normalizeProvider({ ...provider, model: provider.status, secretVisible: false }, provider)),
      }));

  return (
    <main className="content">
      <section className="hero">
        <p className="eyebrow">API / AI CONTROL CENTER v5.1</p>
        <h1>APIは増やす。操作は増やさない。</h1>
        <p className="lead">Claude、Perplexity、Google、Canva、SNS、ASPまで見据えた接続基盤です。APIキーの値は表示しません。</p>
        <div className="actions"><button onClick={loadStatus}>{loading ? "確認中..." : "再確認"}</button><button onClick={() => setPage("home")}>Homeへ</button><button onClick={() => setPage("campaign")}>Campaignへ</button></div>
      </section>
      <div className="stats">
        <div className="stat-card"><span>API接続準備</span><strong>{normalizedStatus.totalProviders}件</strong><p>Credential値・名前は非表示</p></div>
        <div className="stat-card"><span>接続準備率</span><strong>{readiness.score}%</strong><p>Mock表示 / 外部通信なし</p></div>
        <div className="stat-card"><span>AI社員</span><strong>{agentSummary.uniqueAgents}人</strong><p>{agentSummary.departments}部門 / Mock設計</p></div>
        <div className="stat-card"><span>Automation状態</span><strong>{normalizedStatus.automationReady ? "Mock専用" : "未検証"}</strong><p>Owner Final</p></div>
      </div>
      <section className="panel">
        <div className="section-head"><div><p className="eyebrow">API COST MANAGER</p><h2>費用・予算・モード管理</h2></div><span className="badge">Mock Safe</span></div>
        <div className="mission-list">
          <div>開発モード: Mock Only / 外部通信なし</div>
          <div>月額予算残: {Number(budget.monthlyRemaining || 0).toFixed(2)} USD / {Number(budget.monthlyBudgetLimit || 0).toFixed(2)} USD</div>
          <div>推定テストコスト: {costEstimate.estimatedCost} USD / {costEstimate.safeToRun ? "安全" : "承認必要"}</div>
          <div>AI Router: {routerRecommendation.provider} / {routerRecommendation.model}</div>
          <div>Production Mode: Phase1-Aでは無効 / 有効化不可</div>
        </div>
      </section>
      {error && <section className="panel danger-panel"><p className="eyebrow">ERROR</p><h2>API状態を取得できませんでした</h2><p>{error}</p></section>}
      <section className="panel"><div className="section-head"><div><p className="eyebrow">NEXT BEST ACTION</p><h2>次に接続すべきAPI</h2></div><span className="badge">Phase Based</span></div><div className="mission-list"><div>{normalizedStatus.nextBestAction || readiness.nextBestAction}</div><div>原則：APIは増やすが、ユーザーの操作は増やさない。</div><div>最優先：Claude / Perplexity / Google OAuth / Canva / SNS API準備。</div></div></section>
      <section className="panel"><div className="section-head"><div><p className="eyebrow">PROVIDER GROUPS</p><h2>API接続マップ</h2></div><span className="badge">Secrets Hidden / Mock Only</span></div>{groups.map((group) => <div className="api-group" key={group.id}><div className="section-head compact"><div><p className="eyebrow">{group.id}</p><h2>{group.name}</h2></div></div><div className="grid">{group.providers.map((provider) => <div className="card" key={provider.id}><div className="card-header"><span className="badge">実接続未検証</span><span className="badge">{displayStatus(provider.model || provider.status)}</span></div><h2>{provider.name}</h2><p>{provider.role}</p><ul><li>Status：{displayStatus(provider.status || provider.model)}</li><li>Credential：server-only / 値と名前は非表示</li><li>Production Gateway：Locked</li></ul></div>)}</div></div>)}</section>
      <section className="panel"><div className="section-head"><div><p className="eyebrow">AI ORCHESTRATOR</p><h2>用途別AIルーティング</h2></div><span className="badge">{orchestratorLoading ? "確認中" : "Mock Only"}</span></div><div className="grid">{aiOrchestratorModes.map((mode) => <div className="card" key={mode.id}><span className="badge">{mode.provider}</span><h2>{mode.name}</h2><p>{mode.role}</p><div className="actions"><button onClick={() => testOrchestrator(mode.id)} disabled={orchestratorLoading}>{orchestratorLoading ? "確認中..." : "Mock状態を確認"}</button></div></div>)}</div>{orchestratorResult && <div className="ai-report orchestrator-result"><strong>Orchestrator Result：{orchestratorResult.ok ? `${orchestratorResult.provider} / ${orchestratorResult.model}` : "Blocked"}</strong><p>{orchestratorResult.ok ? orchestratorResult.text : orchestratorResult.reason || orchestratorResult.error || "No external request was sent"}</p>{orchestratorResult.fallbackUsed && <small>Fallback used: yes</small>}</div>}</section>
      <section className="panel"><div className="section-head"><div><p className="eyebrow">AI COMPANY</p><h2>AI社員・部署構成</h2></div><span className="badge">{agentSummary.uniqueAgents} Agents</span></div><div className="grid">{aiDepartments.map((department) => <div className="card" key={department.id}><span className="badge">{department.name}</span><h2>{department.mission}</h2><p>{department.agents.join(" / ")}</p></div>)}</div></section>
      <section className="panel"><div className="section-head"><div><p className="eyebrow">ACTION MAP</p><h2>見える画面は少なく、裏側は強く</h2></div></div><div className="mission-list">{actionMap.map((item) => <div key={item.action}>{item.action}｜{item.visiblePage}｜{item.agents.join(" / ")}</div>)}</div></section>
      <section className="panel"><div className="section-head"><div><p className="eyebrow">ROADMAP</p><h2>API拡張フェーズ</h2></div></div><div className="mission-list">{apiMilestones.map((item) => <div key={item.phase}>{item.phase}｜{item.title}｜{item.goal}</div>)}</div></section>
      <section className="panel"><div className="section-head"><div><p className="eyebrow">GOVERNANCE</p><h2>AI実行ルール</h2></div><span className="badge">Owner Final</span></div><div className="mission-list">{(normalizedStatus.principles || []).map((principle) => <div key={principle}>✅ {principle}</div>)}<div>✅ SNS投稿・DM・コメント返信・広告出稿は承認後のみ。</div><div>✅ APIは接続しても、危険な外部実行は自動化しない。</div></div></section>
    </main>
  );
}
