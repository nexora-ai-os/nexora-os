import {
  ARTIFACT_TYPES,
  REQUIRED_APPROVAL_TYPES,
  REQUIRED_ARTIFACT_TYPES,
  REPORTS_TO_TYPES,
  WORKFORCE_ACTIONS,
  PROHIBITED_WORKFORCE_ACTIONS,
  artifactAssignmentTemplates,
  mvp15WorkforceRegistry,
} from "../data/aiWorkforceRegistry.js";

const allowedActionIds = new Set(Object.values(WORKFORCE_ACTIONS));
const prohibitedActionIds = new Set(Object.values(PROHIBITED_WORKFORCE_ACTIONS));
const registeredActionIds = new Set([...allowedActionIds, ...prohibitedActionIds]);
const requiredApprovalTypes = new Set(REQUIRED_APPROVAL_TYPES);
const employeesById = new Map(mvp15WorkforceRegistry.map((employee) => [employee.employeeId, employee]));

function blocked(reason, extra = {}) {
  return { ok: false, allowed: false, reason, ...extra };
}

function allowed(extra = {}) {
  return { ok: true, allowed: true, reason: "MVP15 mock registry validation passed.", ...extra };
}

function createSummary(employeeCount = 0) {
  return {
    employeeCount,
    duplicateEmployeeIds: 0,
    duplicateDisplayNames: 0,
    brokenReportReferences: 0,
    selfReferences: 0,
    cycles: 0,
    unknownArtifacts: 0,
    missingArtifacts: 0,
    invalidActions: 0,
  };
}

function createValidationError(code, message, extra = {}) {
  return { code, message, ...extra };
}

function hasDuplicateValues(values) {
  return new Set(values).size !== values.length;
}

export function getMvpWorkforce() {
  return mvp15WorkforceRegistry;
}

export function getEmployeeById(employeeId) {
  if (typeof employeeId !== "string" || !employeeId.trim()) return null;
  return employeesById.get(employeeId.trim()) || null;
}

export function getEmployeesByDepartment(departmentId) {
  if (typeof departmentId !== "string" || !departmentId.trim()) return [];
  return mvp15WorkforceRegistry.filter((employee) => employee.departmentId === departmentId.trim());
}

export function getEmployeesByCapability(capabilityTag) {
  if (typeof capabilityTag !== "string" || !capabilityTag.trim()) return [];
  return mvp15WorkforceRegistry.filter((employee) => employee.capabilityTags.includes(capabilityTag.trim()));
}

export function getEligibleEmployeesForArtifact(artifactType) {
  if (!ARTIFACT_TYPES.includes(artifactType)) return [];
  return mvp15WorkforceRegistry.filter((employee) => employee.supportedArtifactTypes.includes(artifactType));
}

export function getArtifactAssignmentTemplate(artifactType) {
  if (!ARTIFACT_TYPES.includes(artifactType)) return null;
  return artifactAssignmentTemplates[artifactType] || null;
}

export function validateEmployeeAction(employeeId, actionId) {
  const employee = getEmployeeById(employeeId);
  if (!employee) return blocked("Unknown employeeId is rejected fail-closed.", { reasonCode: "unknown_employee" });
  if (typeof actionId !== "string" || !actionId.trim()) return blocked("Unknown actionId is rejected fail-closed.", { reasonCode: "unknown_action" });
  const normalizedAction = actionId.trim();
  if (!allowedActionIds.has(normalizedAction)) return blocked("Action is not part of the MVP15 allowed action registry.", { reasonCode: "action_not_registered" });
  if (!employee.allowedActions.includes(normalizedAction)) return blocked("Employee is not allowed to perform this mock action.", { reasonCode: "employee_action_not_allowed" });
  if (employee.prohibitedActions.includes(normalizedAction)) return blocked("Action is explicitly prohibited for this employee.", { reasonCode: "employee_action_prohibited" });
  return allowed({ employeeId: employee.employeeId, actionId: normalizedAction });
}

export function validateWorkforceRegistry(registry = mvp15WorkforceRegistry, templates = artifactAssignmentTemplates) {
  const errors = [];
  const summary = createSummary(Array.isArray(registry) ? registry.length : 0);

  const addError = (code, message, extra = {}, summaryKey = null) => {
    errors.push(createValidationError(code, message, extra));
    if (summaryKey) summary[summaryKey] += 1;
  };

  try {
    if (!Array.isArray(registry)) {
      addError("REGISTRY_NOT_ARRAY", "MVP15 registry must be an array.");
      return { valid: false, errors, summary };
    }

    if (!templates || typeof templates !== "object" || Array.isArray(templates)) {
      addError("ARTIFACT_TEMPLATES_INVALID", "artifactAssignmentTemplates must be an object.");
      summary.missingArtifacts = REQUIRED_ARTIFACT_TYPES.length;
      return { valid: false, errors, summary };
    }

    const ids = new Set();
    const duplicateIds = new Set();
    const names = new Set();
    const duplicateNames = new Set();
    const localEmployeesById = new Map();
    const artifactTypes = new Set(REQUIRED_ARTIFACT_TYPES);

    if (registry.length !== 15) {
      addError("INVALID_EMPLOYEE_COUNT", "MVP15 registry must contain exactly 15 employees.", { field: "mvp15WorkforceRegistry" });
    }

    for (const employee of registry) {
      if (employee && typeof employee.employeeId === "string" && !localEmployeesById.has(employee.employeeId)) {
        localEmployeesById.set(employee.employeeId, employee);
      }
    }

    for (const employee of registry) {
      const employeeId = employee?.employeeId;
      const displayName = employee?.displayName;

      if (!employee || typeof employee !== "object") {
        addError("EMPLOYEE_INVALID", "Employee definition must be an object.");
        continue;
      }

      if (ids.has(employeeId)) {
        duplicateIds.add(employeeId);
        addError("DUPLICATE_EMPLOYEE_ID", `Duplicate employeeId: ${employeeId}`, { employeeId, field: "employeeId" });
      }
      ids.add(employeeId);

      if (names.has(displayName)) {
        duplicateNames.add(displayName);
        addError("DUPLICATE_DISPLAY_NAME", `Duplicate displayName: ${displayName}`, { employeeId, field: "displayName" });
      }
      names.add(displayName);

      if (employee.workforcePhase !== "MVP15") addError("INVALID_WORKFORCE_PHASE", `${employeeId} has invalid workforcePhase.`, { employeeId, field: "workforcePhase" });
      if (employee.employmentStatus !== "ACTIVE_DEFINITION") addError("INVALID_EMPLOYMENT_STATUS", `${employeeId} has invalid employmentStatus.`, { employeeId, field: "employmentStatus" });
      if (!["MOCK_READY", "STANDBY", "PENDING"].includes(employee.runtimeStatus)) addError("INVALID_RUNTIME_STATUS", `${employeeId} has invalid runtimeStatus.`, { employeeId, field: "runtimeStatus" });
      if (employee.valueType !== "MOCK") addError("INVALID_VALUE_TYPE", `${employeeId} must use MOCK valueType.`, { employeeId, field: "valueType" });
      if (employee.mockOnly !== true) addError("INVALID_MOCK_ONLY", `${employeeId} must be mockOnly.`, { employeeId, field: "mockOnly" });
      if (employee.externalExecutionAllowed !== false) addError("EXTERNAL_EXECUTION_ENABLED", `${employeeId} must not allow external execution.`, { employeeId, field: "externalExecutionAllowed" });
      if (employee.productionExecutionAllowed !== false) addError("PRODUCTION_EXECUTION_ENABLED", `${employeeId} must not allow production execution.`, { employeeId, field: "productionExecutionAllowed" });
      if (employee.sourceOfTruth !== "AI_WORKFORCE_50_DOC") addError("INVALID_SOURCE_OF_TRUTH", `${employeeId} has invalid sourceOfTruth.`, { employeeId, field: "sourceOfTruth" });

      const reportsTo = employee.reportsTo;
      if (!reportsTo || typeof reportsTo !== "object") {
        addError("REPORTS_TO_INVALID", `${employeeId} must define reportsTo.`, { employeeId, field: "reportsTo" }, "brokenReportReferences");
      } else if (reportsTo.type === REPORTS_TO_TYPES.HUMAN_OWNER) {
        if (reportsTo.employeeId !== null) {
          addError("HUMAN_OWNER_REPORT_HAS_EMPLOYEE_ID", `${employeeId} HUMAN_OWNER report must use employeeId null.`, { employeeId, field: "reportsTo.employeeId" }, "brokenReportReferences");
        }
        if (reportsTo.role !== "OWNER") {
          addError("HUMAN_OWNER_REPORT_ROLE_INVALID", `${employeeId} HUMAN_OWNER report must use role OWNER.`, { employeeId, field: "reportsTo.role" }, "brokenReportReferences");
        }
      } else if (reportsTo.type === REPORTS_TO_TYPES.AI_EMPLOYEE) {
        if (typeof reportsTo.employeeId !== "string" || !reportsTo.employeeId.trim()) {
          addError("AI_REPORT_MISSING_EMPLOYEE_ID", `${employeeId} AI_EMPLOYEE report must include employeeId.`, { employeeId, field: "reportsTo.employeeId" }, "brokenReportReferences");
        } else if (reportsTo.employeeId === employeeId) {
          addError("REPORTS_TO_SELF", `${employeeId} reportsTo cannot reference itself.`, { employeeId, field: "reportsTo.employeeId" }, "selfReferences");
        } else if (!localEmployeesById.has(reportsTo.employeeId)) {
          addError("BROKEN_REPORT_REFERENCE", `${employeeId} has broken reportsTo employeeId: ${reportsTo.employeeId}`, { employeeId, field: "reportsTo.employeeId" }, "brokenReportReferences");
        }
      } else {
        addError("REPORTS_TO_TYPE_UNKNOWN", `${employeeId} has unknown reportsTo.type.`, { employeeId, field: "reportsTo.type" }, "brokenReportReferences");
      }

      for (const field of ["allowedActions", "prohibitedActions"]) {
        const actions = employee[field];
        if (!Array.isArray(actions)) {
          addError("ACTION_FIELD_NOT_ARRAY", `${employeeId} ${field} must be an array.`, { employeeId, field }, "invalidActions");
          continue;
        }
        if (actions.length === 0) {
          addError("ACTION_FIELD_EMPTY", `${employeeId} ${field} must not be empty.`, { employeeId, field }, "invalidActions");
        }
        const seenActions = new Set();
        for (const action of actions) {
          if (typeof action !== "string" || !action.trim()) {
            addError("ACTION_EMPTY", `${employeeId} ${field} contains an empty action.`, { employeeId, field }, "invalidActions");
            continue;
          }
          if (seenActions.has(action)) {
            addError("ACTION_DUPLICATE", `${employeeId} ${field} contains duplicate action: ${action}`, { employeeId, field }, "invalidActions");
          }
          seenActions.add(action);
          const registryForField = field === "allowedActions" ? allowedActionIds : prohibitedActionIds;
          if (!registryForField.has(action) || !registeredActionIds.has(action)) {
            addError("ACTION_UNKNOWN", `${employeeId} ${field} has unknown action: ${action}`, { employeeId, field }, "invalidActions");
          }
        }
      }

      if (Array.isArray(employee.allowedActions) && Array.isArray(employee.prohibitedActions)) {
        for (const action of employee.allowedActions) {
          if (employee.prohibitedActions.includes(action)) {
            addError("ACTION_ALLOWED_PROHIBITED_OVERLAP", `${employeeId} action cannot be both allowed and prohibited: ${action}`, { employeeId, field: "allowedActions" }, "invalidActions");
          }
        }
      }

      if (!Array.isArray(employee.supportedArtifactTypes)) {
        addError("SUPPORTED_ARTIFACTS_NOT_ARRAY", `${employeeId} supportedArtifactTypes must be an array.`, { employeeId, field: "supportedArtifactTypes" }, "unknownArtifacts");
      } else {
        for (const artifactType of employee.supportedArtifactTypes) {
          if (!artifactTypes.has(artifactType)) {
            addError("EMPLOYEE_ARTIFACT_UNKNOWN", `${employeeId} has unknown artifactType: ${artifactType}`, { employeeId, artifactType, field: "supportedArtifactTypes" }, "unknownArtifacts");
          }
        }
      }
    }

    summary.duplicateEmployeeIds = duplicateIds.size;
    summary.duplicateDisplayNames = duplicateNames.size;

    if (localEmployeesById.get("F01")?.gender !== "Female") {
      addError("AEGIS_GENDER_INVALID", "Aegis must be defined as Female.", { employeeId: "F01", field: "gender" });
    }

    const visitState = new Map();
    const detectCycle = (employeeId, path = []) => {
      const state = visitState.get(employeeId);
      if (state === "visiting") {
        addError("REPORTS_TO_CYCLE", `reportsTo chain contains a cycle at ${employeeId}.`, { employeeId, field: "reportsTo.employeeId" }, "cycles");
        return;
      }
      if (state === "visited") return;

      const employee = localEmployeesById.get(employeeId);
      if (!employee) return;
      visitState.set(employeeId, "visiting");

      const reportsTo = employee.reportsTo;
      if (reportsTo?.type === REPORTS_TO_TYPES.AI_EMPLOYEE && typeof reportsTo.employeeId === "string") {
        if (path.includes(reportsTo.employeeId)) {
          addError("REPORTS_TO_CYCLE", `reportsTo chain revisits ${reportsTo.employeeId}.`, { employeeId, field: "reportsTo.employeeId" }, "cycles");
        } else {
          detectCycle(reportsTo.employeeId, [...path, employeeId]);
        }
      }

      visitState.set(employeeId, "visited");
    };

    for (const employee of registry) {
      if (typeof employee?.employeeId === "string") detectCycle(employee.employeeId);
    }

    for (const artifactType of Object.keys(templates)) {
      if (!artifactTypes.has(artifactType)) {
        addError("ARTIFACT_TEMPLATE_UNKNOWN", `Unknown artifact assignment template: ${artifactType}`, { artifactType }, "unknownArtifacts");
      }
    }

    for (const artifactType of REQUIRED_ARTIFACT_TYPES) {
      const template = templates[artifactType];
      if (!template || typeof template !== "object" || Array.isArray(template)) {
        addError("ARTIFACT_TEMPLATE_MISSING", `Missing artifact assignment template: ${artifactType}`, { artifactType }, "missingArtifacts");
        continue;
      }

      const assignmentFields = ["primaryOwnerEmployeeId", "reviewerEmployeeId", "backupEmployeeId"];
      const assignmentIds = assignmentFields.map((field) => template[field]);
      for (const field of assignmentFields) {
        if (!localEmployeesById.has(template[field])) {
          addError("ARTIFACT_ASSIGNMENT_REFERENCE_BROKEN", `${artifactType} has invalid ${field}: ${template[field]}`, { artifactType, field });
        }
      }
      if (hasDuplicateValues(assignmentIds)) {
        addError("ARTIFACT_ASSIGNMENT_DUPLICATE_PERSON", `${artifactType} primaryOwner/reviewer/backup must be distinct.`, { artifactType, field: "assignment" });
      }
      if (!requiredApprovalTypes.has(template.requiredApprovalType)) {
        addError("ARTIFACT_APPROVAL_TYPE_UNKNOWN", `${artifactType} has unknown requiredApprovalType: ${template.requiredApprovalType}`, { artifactType, field: "requiredApprovalType" }, "unknownArtifacts");
      }
      for (const field of ["requiredLegalReview", "requiredBrandReview"]) {
        if (typeof template[field] !== "boolean") {
          addError("ARTIFACT_REVIEW_FLAG_INVALID", `${artifactType} ${field} must be boolean.`, { artifactType, field });
        }
      }
    }
  } catch (error) {
    addError("VALIDATION_EXCEPTION", `validateWorkforceRegistry failed closed: ${error instanceof Error ? error.message : "unknown error"}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    summary,
  };
}
