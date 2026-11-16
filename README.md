# blake-compliance-log

Durable **decision → outcome** compliance trail for autonomous agents.

Part of **blake-guard**:

1. **`blake-policy-agent`** — gate intents (allow / deny / require_approval)  
2. **`blake-space-access`** — witness filesystem contact with a personal space  
3. **`blake-compliance-log`** — append-only trail of gate decisions and post-action facts  

Closes the prompt-vs-fact gap: if the gate said deny but the merge/send/spawn still happened, the trail records a **violation**.

**Docs (Blake):** [bl4k3.com/guard](https://bl4k3.com/guard) · **License:** Apache-2.0 · **Node ≥ 20**

## Install

```bash
npm install blake-compliance-log
```

## Quick start

```ts
import {
  createFsComplianceLog,
  recordDecision,
  recordOutcome,
  verifyTrail,
} from "blake-compliance-log";

const log = createFsComplianceLog("/var/spaces/andy");

await recordDecision(log, {
  ownerId: "own_1",
  agentId: "agt_1",
  environment: "personal_private",
  intentType: "git.merge",
  fingerprint: "ifp_…",
  policyHash: "pol_…",
  effect: "deny",
  reasons: ["Auto merge is off"],
  rules: ["git.merge.auto_off"],
});

await recordOutcome(log, {
  ownerId: "own_1",
  agentId: "agt_1",
  environment: "personal_private",
  intentType: "git.merge",
  fingerprint: "ifp_…",
  policyHash: "pol_…",
  expectedEffect: "deny",
  occurred: true, // side-effect happened → violation
});

console.log(await verifyTrail(log));
```

## CLI

```bash
npx blake-compliance-log recent --dir ./data/agents/andy --limit 20
npx blake-compliance-log verify --dir ./data/agents/andy
```

## With blake-policy-agent

After `evaluateIntent` / `evaluatePostAction`, append the same fingerprint and policyHash into this trail. The packages stay independent — no hard dependency.
