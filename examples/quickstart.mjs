import {
  createMemoryComplianceLog,
  recordDecision,
  recordOutcome,
  verifyTrail,
} from "../dist/index.js";

const log = createMemoryComplianceLog();

await recordDecision(log, {
  ownerId: "own_demo",
  agentId: "agt_demo",
  environment: "personal_private",
  intentType: "agent.spawn",
  fingerprint: "ifp_demo",
  policyHash: "pol_demo",
  effect: "deny",
  rules: ["agent.spawn.deny"],
});

await recordOutcome(log, {
  ownerId: "own_demo",
  agentId: "agt_demo",
  environment: "personal_private",
  intentType: "agent.spawn",
  fingerprint: "ifp_demo",
  policyHash: "pol_demo",
  expectedEffect: "deny",
  occurred: false,
});

console.log(await verifyTrail(log));
