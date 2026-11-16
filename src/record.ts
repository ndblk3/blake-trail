import type {
  ComplianceEvent,
  ComplianceLog,
  DecisionInput,
  OutcomeInput,
} from "./types.js";

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Append a pre-action gate decision to the trail. */
export async function recordDecision(
  log: ComplianceLog,
  input: DecisionInput,
): Promise<ComplianceEvent> {
  const event: ComplianceEvent = {
    id: newId("dec"),
    at: input.at ?? new Date().toISOString(),
    phase: "decision",
    ownerId: input.ownerId,
    agentId: input.agentId,
    environment: input.environment,
    intentType: input.intentType,
    fingerprint: input.fingerprint,
    policyHash: input.policyHash,
    effect: input.effect,
    reasons: input.reasons ? [...input.reasons] : undefined,
    rules: input.rules ? [...input.rules] : undefined,
    target: input.target,
    allowTokenRef: input.allowTokenRef,
  };
  await log.append(event);
  return event;
}

/**
 * Append post-action evidence.
 * If the side-effect occurred while the gate was deny / require_approval → violation.
 * If allow and occurred (or did not occur) → pass.
 */
export async function recordOutcome(
  log: ComplianceLog,
  input: OutcomeInput,
): Promise<ComplianceEvent> {
  const occurred = input.occurred === true;
  const expected = input.expectedEffect;
  let phase: ComplianceEvent["phase"] = "outcome";
  let ok = true;
  let summary = input.summary;

  if (occurred && expected !== "allow") {
    phase = "violation";
    ok = false;
    summary =
      summary ??
      (expected === "require_approval"
        ? `Action occurred while gate required approval (${input.intentType}).`
        : `Action occurred while gate denied (${input.intentType}).`);
  } else if (!occurred) {
    phase = "pass";
    ok = true;
    summary = summary ?? "No side-effect recorded.";
  } else {
    phase = "pass";
    ok = true;
    summary = summary ?? `Action occurred under allow (${input.intentType}).`;
  }

  const event: ComplianceEvent = {
    id: newId(phase === "violation" ? "vio" : "out"),
    at: input.at ?? new Date().toISOString(),
    phase,
    ownerId: input.ownerId,
    agentId: input.agentId,
    environment: input.environment,
    intentType: input.intentType,
    fingerprint: input.fingerprint,
    policyHash: input.policyHash,
    expectedEffect: expected,
    occurred,
    ok,
    summary,
    target: input.target,
    rules: input.rules
      ? ["compliance.outcome", ...input.rules]
      : ["compliance.outcome"],
  };
  await log.append(event);
  return event;
}
