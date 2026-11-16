export type {
  ComplianceEvent,
  ComplianceLog,
  CompliancePhase,
  DecisionEffect,
  DecisionInput,
  OutcomeInput,
} from "./types.js";

export {
  COMPLIANCE_DIR_NAME,
  COMPLIANCE_LOG_NAME,
  complianceLogPath,
  createFsComplianceLog,
  createMemoryComplianceLog,
} from "./trail.js";

export { recordDecision, recordOutcome } from "./record.js";

export {
  formatTrailLine,
  verifyTrail,
  type TrailVerifyResult,
} from "./verify.js";
