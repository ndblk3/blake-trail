# blake-trail

Durable **decision → outcome** compliance trail for autonomous agents.

Part of **blake-guard**:

1. **`blake-gate`** — gate intents (allow / deny / require_approval)  
2. **`blake-witness`** — witness filesystem contact with a personal space  
3. **`blake-trail`** — append-only trail of gate decisions and post-action facts  

Closes the prompt-vs-fact gap: if the gate said deny but the merge/send/spawn still happened, the trail records a **violation**.

**Docs (Blake):** [bl4k3.com/trail](https://bl4k3.com/trail) · **Suite:** [blake-guard](https://bl4k3.com/guard) · **License:** Apache-2.0 · **Node ≥ 20**

## Install

```bash
npm install blake-trail
```

## Quick start

```ts
import {
  createFsComplianceLog,
  recordDecision,
  recordOutcome,
  verifyTrail,
} from "blake-trail";

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
npx blake-trail recent --dir ./data/agents/andy --limit 20
npx blake-trail verify --dir ./data/agents/andy
```

## With blake-gate

After `evaluateIntent` / `evaluatePostAction`, append the same fingerprint and policyHash into this trail. The packages stay independent — no hard dependency.
