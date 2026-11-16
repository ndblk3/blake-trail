# Integrating blake-compliance-log

## Host loop

```ts
import { evaluateIntent, evaluatePostAction } from "blake-policy-agent";
import {
  createFsComplianceLog,
  recordDecision,
  recordOutcome,
} from "blake-compliance-log";

const trail = createFsComplianceLog(spaceRoot);
const decision = evaluateIntent(intent, policy, ctx);

await recordDecision(trail, {
  ownerId: policy.ownerId,
  agentId: policy.agentId,
  environment: policy.environment,
  intentType: intent.type,
  fingerprint: decision.fingerprint,
  policyHash: decision.policyHash ?? policy.policyHash ?? "",
  effect: decision.effect,
  reasons: decision.reasons,
  rules: decision.rules,
  target: intent.target,
  allowTokenRef: decision.allowToken?.fingerprint,
});

// … run tool only if allow …

const post = evaluatePostAction({
  policy,
  prior: decision,
  evidence: { intentType: intent.type, occurred: true },
});

await recordOutcome(trail, {
  ownerId: policy.ownerId,
  agentId: policy.agentId,
  environment: policy.environment,
  intentType: intent.type,
  fingerprint: decision.fingerprint,
  policyHash: decision.policyHash ?? policy.policyHash ?? "",
  expectedEffect: decision.effect,
  occurred: true,
  rules: post.violation?.rules,
  summary: post.violation?.summary,
});
```

## Storage

Default path: `{root}/.blake-compliance/trail.jsonl` (newest via `recent()`).
