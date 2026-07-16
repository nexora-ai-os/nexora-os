import { useMemo, useState } from "react";
import { buildReleaseReadinessAudit, summarizeAudit } from "../services/releaseReadinessAudit";
import "./ProductionReadiness.css";

const EVALUATION_TIME = "2026-07-16T00:00:00.000Z";

function statusLabel(status) {
  if (status === "pass") return "確認済み";
  if (status === "blocked") return "ブロック中";
  if (status === "notVerified") return "未確認";
  if (status === "locked") return "ロック中";
  return "未確認";
}

function riskLabel(riskLevel) {
  if (riskLevel === "critical") return "Critical";
  if (riskLevel === "high") return "High";
  if (riskLevel === "medium") return "Medium";
  return "Low";
}

function integrationStatusLabel(status) {
  const labels = {
    planned: "準備前",
    adapterMissing: "Adapter未実装",
    credentialRequired: "Credential境界待ち",
    ownerActionRequired: "Owner確認待ち",
    securityReviewRequired: "Security Review待ち",
    notVerified: "未検証",
  };
  return labels[status] || "未検証";
}

function capabilityLabel(capability) {
  const labels = {
    ai: "AI",
    analytics: "分析",
    publishing: "公開系（未接続）",
    design: "Design",
    affiliate: "Affiliate",
    development: "Development",
  };
  return labels[capability] || "要確認";
}

export default function ProductionReadiness({ budget }) {
  const [openDetails, setOpenDetails] = useState(false);
  const [openIntegrations, setOpenIntegrations] = useState(false);
  const audit = useMemo(() => buildReleaseReadinessAudit({
    evaluationTime: EVALUATION_TIME,
    budget: {
      mockLimit: budget?.monthlyBudgetLimit || 5,
      mockUsed: budget?.monthlyUsed || 0,
    },
  }), [budget]);
  const summary = summarizeAudit(audit);
  const readiness = audit.readiness || {};
  const registry = readiness.registry || { integrations: [], categories: [], statusCounts: {} };
  const gateway = readiness.gateway || {};
  const mockBudget = readiness.mockBudget || {};

  return (
    <section className="panel production-readiness-panel" aria-live="polite">
      <div className="section-head">
        <div>
          <p className="eyebrow">Production Readiness</p>
          <h2>本番接続前の安全境界</h2>
        </div>
        <span className="badge">Production Gateway: {statusLabel(gateway.status)}</span>
      </div>

      <div className="production-readiness-grid">
        <div>
          <span>現在</span>
          <strong>Mock運用</strong>
          <p>外部通信・実売上・Ledger appendには接続していません。</p>
        </div>
        <div>
          <span>Mock事業ループ</span>
          <strong>準備済み</strong>
          <p>市場発見から改善提案までMockで一周できます。</p>
        </div>
        <div>
          <span>Production Gateway</span>
          <strong>ロック中</strong>
          <p>解除処理・本番実行APIはありません。</p>
        </div>
        <div>
          <span>Emergency / Budget</span>
          <strong>利用可能</strong>
          <p>Mock Budget Guard: {statusLabel(mockBudget.status)}</p>
        </div>
        <div>
          <span>次の行動</span>
          <strong>{audit.ownerNextAction}</strong>
          <p>Ownerは最初の接続対象を1つだけ選びます。</p>
        </div>
      </div>

      <div className="production-readiness-actions">
        <button
          type="button"
          aria-expanded={openDetails}
          aria-controls="production-readiness-details"
          onClick={() => setOpenDetails((current) => !current)}
        >
          監査結果を見る
        </button>
        <button
          type="button"
          aria-expanded={openIntegrations}
          aria-controls="production-readiness-integrations"
          onClick={() => setOpenIntegrations((current) => !current)}
        >
          接続準備を確認
        </button>
      </div>

      {openDetails && (
        <div className="production-readiness-details" id="production-readiness-details">
          <div className="production-readiness-summary">
            <div><span>確認済み</span><strong>{summary.pass}</strong></div>
            <div><span>ブロック中</span><strong>{summary.blocked}</strong></div>
            <div><span>未確認</span><strong>{summary.notVerified}</strong></div>
          </div>
          <div className="production-audit-list">
            {audit.checks.map((item) => (
              <div className={`production-audit-item ${item.status}`} key={item.checkId}>
                <span>{item.category}</span>
                <strong>{item.label}</strong>
                <p>{statusLabel(item.status)} / {item.evidence}</p>
                {item.ownerActionRequired && <small>{item.ownerActionRequired}</small>}
              </div>
            ))}
          </div>
          <div className="production-boundary-note">
            <strong>Security Boundary</strong>
            <p>Credentialはserver-only前提です。Client、Storage、Error、ResponseへCredential値を渡しません。</p>
          </div>
        </div>
      )}

      {openIntegrations && (
        <div className="production-readiness-details" id="production-readiness-integrations">
          <div className="production-readiness-summary">
            <div><span>Provider</span><strong>{registry.totalProviders}</strong></div>
            <div><span>Category</span><strong>{registry.categories?.length || 0}</strong></div>
            <div><span>Credential</span><strong>非表示</strong></div>
          </div>
          <div className="production-integration-list">
            {registry.integrations.map((item) => (
              <div className="production-integration-item" key={item.integrationId}>
                <div>
                  <span>{item.category} / {capabilityLabel(item.capability)}</span>
                  <strong>{item.displayName}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>{integrationStatusLabel(item.implementationStatus)}</strong>
                </div>
                <div>
                  <span>Risk</span>
                  <strong>{riskLabel(item.riskLevel)}</strong>
                </div>
                <p>{item.ownerNextAction}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
