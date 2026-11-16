import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import {
  createFsComplianceLog,
  createMemoryComplianceLog,
  recordDecision,
  recordOutcome,
  verifyTrail,
} from "../dist/index.js";

describe("blake-trail", () => {
  it("memory trail keeps newest first", async () => {
    const log = createMemoryComplianceLog();
    await recordDecision(log, {
      ownerId: "o",
      agentId: "a",
      environment: "personal_private",
      intentType: "git.merge",
      fingerprint: "ifp_a",
      policyHash: "pol_a",
      effect: "deny",
    });
    await recordOutcome(log, {
      ownerId: "o",
      agentId: "a",
      environment: "personal_private",
      intentType: "git.merge",
      fingerprint: "ifp_a",
      policyHash: "pol_a",
      expectedEffect: "deny",
      occurred: false,
    });
    const rows = await log.recent(10);
    assert.equal(rows[0]?.phase, "pass");
    assert.equal(rows[1]?.phase, "decision");
  });

  it("flags violation when deny action still occurred", async () => {
    const log = createMemoryComplianceLog();
    await recordDecision(log, {
      ownerId: "o",
      agentId: "a",
      environment: "personal_private",
      intentType: "agent.replicate",
      fingerprint: "ifp_r",
      policyHash: "pol_r",
      effect: "deny",
    });
    const outcome = await recordOutcome(log, {
      ownerId: "o",
      agentId: "a",
      environment: "personal_private",
      intentType: "agent.replicate",
      fingerprint: "ifp_r",
      policyHash: "pol_r",
      expectedEffect: "deny",
      occurred: true,
    });
    assert.equal(outcome.phase, "violation");
    assert.equal(outcome.ok, false);
    const check = await verifyTrail(log);
    assert.equal(check.violations, 1);
    assert.equal(check.ok, false);
  });

  it("persists under .blake-compliance", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "blake-comp-"));
    try {
      const log = createFsComplianceLog(dir);
      await recordDecision(log, {
        ownerId: "o",
        agentId: "a",
        environment: "personal_private",
        intentType: "run.start",
        fingerprint: "ifp_s",
        policyHash: "pol_s",
        effect: "allow",
      });
      assert.match(log.path, /\.blake-compliance[/\\]trail\.jsonl$/);
      const again = createFsComplianceLog(dir);
      const rows = await again.recent(5);
      assert.equal(rows.length, 1);
      assert.equal(rows[0]?.intentType, "run.start");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
