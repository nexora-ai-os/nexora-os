import { ARTIFACT_TYPES } from "../data/aiWorkforceRegistry";
import {
  getArtifactAssignmentTemplate,
  getMvpWorkforce,
  validateEmployeeAction,
  validateWorkforceRegistry,
} from "../services/aiWorkforceService";

const statusLabels = {
  MOCK_READY: "Mock準備済み",
  STANDBY: "待機中",
  PENDING: "未構成",
};

export default function AIWorkforceRegistry() {
  const employees = getMvpWorkforce();
  const validation = validateWorkforceRegistry();
  const aegis = employees.find((employee) => employee.employeeId === "F01");
  const sampleAction = validateEmployeeAction("F01", "owner.briefing.prepare");

  return (
    <section className="panel governance-panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">PHASE1-B P0-002</p>
          <h2>AI Workforce MVP15 Registry</h2>
          <p className="lead">Mock Onlyの社員定義です。外部実行、Production、Owner承認代行、実売上記録はできません。</p>
        </div>
        <span className="badge">{validation.employeeCount}名 / {statusLabels.MOCK_READY}</span>
      </div>

      <div className="stats">
        <div className="stat-card"><span>MVP15</span><strong>{employees.length}</strong><p>定義のみ。実行状態ではありません。</p></div>
        <div className="stat-card"><span>Artifacts</span><strong>{validation.artifactCount}</strong><p>16成果物の担当テンプレート。</p></div>
        <div className="stat-card"><span>External</span><strong>不可</strong><p>API / 投稿 / 送信なし。</p></div>
        <div className="stat-card"><span>Validation</span><strong>{validation.valid ? "OK" : "NG"}</strong><p>{validation.errors.length} errors / {validation.summary.cycles} cycles</p></div>
      </div>

      <div className="mission-list">
        <div>Aegis: {aegis?.displayName} / {aegis?.roleTitle} / Ownerの代わりに承認しない</div>
        <div>Action audit sample: F01 + owner.briefing.prepare = {sampleAction.allowed ? "allowed mock action" : "blocked"}</div>
        <div>Source of Truth: AI_WORKFORCE_50_DOC / valueType: MOCK / schemaVersion: 1.0.0</div>
      </div>

      <div className="grid">
        {employees.map((employee) => (
          <div className="card agent-card" key={employee.employeeId}>
            <span className="badge">{employee.employeeId} / {statusLabels[employee.runtimeStatus] || employee.runtimeStatus}</span>
            <h2>{employee.displayName}</h2>
            <p>{employee.departmentName} / {employee.roleTitle}</p>
            <ul>
              <li>Reports to: {employee.reportsTo.type} / {employee.reportsTo.employeeId || employee.reportsTo.role}</li>
              <li>Capabilities: {employee.capabilityTags.slice(0, 4).join(", ")}</li>
              <li>Artifacts: {employee.supportedArtifactTypes.slice(0, 3).join(", ")}</li>
              <li>External execution: {employee.externalExecutionAllowed ? "allowed" : "不可"}</li>
              <li>Production: {employee.productionExecutionAllowed ? "allowed" : "無効"}</li>
            </ul>
            <small>{employee.requiredApprovals[0]}</small>
          </div>
        ))}
      </div>

      <section className="panel">
        <div className="section-head compact">
          <div>
            <p className="eyebrow">ARTIFACT ASSIGNMENT</p>
            <h2>16成果物の担当テンプレート</h2>
          </div>
          <span className="badge">定義のみ</span>
        </div>
        <div className="mission-list">
          {ARTIFACT_TYPES.map((artifactType) => {
            const template = getArtifactAssignmentTemplate(artifactType);
            return (
              <div key={artifactType}>
                {artifactType}: owner {template?.primaryOwnerEmployeeId} / reviewer {template?.reviewerEmployeeId} / backup {template?.backupEmployeeId} / approval {template?.requiredApprovalType}
              </div>
            );
          })}
        </div>
      </section>

      {!validation.valid && (
        <section className="panel danger-panel">
          <p className="eyebrow">VALIDATION</p>
          <h2>Registry validation errors</h2>
          <div className="mission-list">
            {validation.errors.map((error) => <div key={`${error.code}-${error.employeeId || error.artifactType || error.field || error.message}`}>{error.message}</div>)}
          </div>
        </section>
      )}
    </section>
  );
}
