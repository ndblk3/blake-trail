import type { ComplianceEvent, ComplianceLog } from "./types.js";

export type TrailVerifyResult = {
  ok: boolean;
  decisions: number;
  outcomes: number;
  violations: number;
  orphans: string[];
  unmatchedDecisions: string[];
  summary: string;
};

/**
 * Check that violation/pass rows have a prior decision for the same fingerprint,
 * and flag open decisions with no later outcome (optional soft warn).
 */
export async function verifyTrail(
  log: ComplianceLog,
  opts?: { limit?: number; requireOutcomes?: boolean },
): Promise<TrailVerifyResult> {
  const rows = await log.recent(opts?.limit ?? 200);
  // recent is newest-first; reverse for chronological scan
  const chrono = [...rows].reverse();
  const decisions = new Map<string, ComplianceEvent>();
  const orphans: string[] = [];
  let decisionCount = 0;
  let outcomeCount = 0;
  let violationCount = 0;
  const seenOutcome = new Set<string>();

  for (const row of chrono) {
    if (row.phase === "decision") {
      decisionCount += 1;
      decisions.set(row.fingerprint, row);
      continue;
    }
    if (
      row.phase === "outcome" ||
      row.phase === "pass" ||
      row.phase === "violation"
    ) {
      outcomeCount += 1;
      if (row.phase === "violation" || row.ok === false) violationCount += 1;
      seenOutcome.add(row.fingerprint);
      if (!decisions.has(row.fingerprint)) {
        orphans.push(row.id);
      }
    }
  }

  const unmatchedDecisions: string[] = [];
  if (opts?.requireOutcomes) {
    for (const [fp, dec] of decisions) {
      if (!seenOutcome.has(fp)) unmatchedDecisions.push(dec.id);
    }
  }

  const ok = orphans.length === 0 && violationCount === 0;
  const summary = ok
    ? `Trail clean: ${decisionCount} decisions, ${outcomeCount} outcomes, 0 violations.`
    : `Trail issues: ${violationCount} violation(s), ${orphans.length} orphan outcome(s)` +
      (unmatchedDecisions.length
        ? `, ${unmatchedDecisions.length} decision(s) without outcome`
        : "") +
      ".";

  return {
    ok,
    decisions: decisionCount,
    outcomes: outcomeCount,
    violations: violationCount,
    orphans,
    unmatchedDecisions,
    summary,
  };
}

export function formatTrailLine(row: ComplianceEvent): string {
  const bits = [
    row.at,
    row.phase,
    row.intentType,
    row.effect ?? row.expectedEffect ?? "-",
    row.fingerprint.slice(0, 12),
  ];
  if (row.summary) bits.push(row.summary);
  return bits.join(" · ");
}
