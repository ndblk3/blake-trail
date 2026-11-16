/** Phase of the compliance trail — gate before, fact after. */
export type CompliancePhase =
  | "decision"
  | "outcome"
  | "pass"
  | "violation";

export type DecisionEffect = "allow" | "deny" | "require_approval";

/** One durable row: intent → decision → outcome (or violation). */
export type ComplianceEvent = {
  id: string;
  at: string;
  phase: CompliancePhase;
  ownerId: string;
  agentId: string;
  environment: string;
  intentType: string;
  fingerprint: string;
  policyHash: string;
  effect?: DecisionEffect;
  reasons?: string[];
  rules?: string[];
  target?: string;
  /** Side-effect actually happened (merge, send, spawn, …). */
  occurred?: boolean;
  /** Outcome matched the prior gate decision. */
  ok?: boolean;
  summary?: string;
  /** Prior decision effect when recording outcome / violation. */
  expectedEffect?: DecisionEffect;
  /** Optional allow-token fingerprint / id for proof-carrying allow. */
  allowTokenRef?: string;
};

export type ComplianceLog = {
  /** Absolute path or `:memory:`. */
  path: string;
  append(event: ComplianceEvent): Promise<void>;
  recent(limit?: number): Promise<ComplianceEvent[]>;
};

export type DecisionInput = {
  ownerId: string;
  agentId: string;
  environment: string;
  intentType: string;
  fingerprint: string;
  policyHash: string;
  effect: DecisionEffect;
  reasons?: string[];
  rules?: string[];
  target?: string;
  allowTokenRef?: string;
  at?: string;
};

export type OutcomeInput = {
  ownerId: string;
  agentId: string;
  environment: string;
  intentType: string;
  fingerprint: string;
  policyHash: string;
  expectedEffect: DecisionEffect;
  occurred: boolean;
  summary?: string;
  target?: string;
  rules?: string[];
  at?: string;
};
