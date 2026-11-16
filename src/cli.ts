#!/usr/bin/env node
import { createFsComplianceLog } from "./trail.js";
import { recordDecision, recordOutcome } from "./record.js";
import { formatTrailLine, verifyTrail } from "./verify.js";

function usage(): never {
  console.error(`blake-trail — durable decision→outcome trail

Usage:
  blake-trail recent --dir <root> [--limit N]
  blake-trail verify --dir <root> [--limit N] [--require-outcomes]
  blake-trail decision --dir <root> --owner <id> --agent <id> --env <env> \\
      --intent <type> --fp <fingerprint> --policy <hash> --effect <allow|deny|require_approval>
  blake-trail outcome --dir <root> --owner <id> --agent <id> --env <env> \\
      --intent <type> --fp <fingerprint> --policy <hash> --expected <effect> --occurred <0|1>
`);
  process.exit(1);
}

function arg(flag: string, argv: string[]): string | undefined {
  const i = argv.indexOf(flag);
  if (i < 0) return undefined;
  return argv[i + 1];
}

function need(flag: string, argv: string[]): string {
  const v = arg(flag, argv);
  if (!v) {
    console.error(`Missing ${flag}`);
    usage();
  }
  return v;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  if (!cmd || cmd === "-h" || cmd === "--help") usage();

  const dir = need("--dir", argv);
  const log = createFsComplianceLog(dir);

  if (cmd === "recent") {
    const limit = Number(arg("--limit", argv) ?? 20);
    for (const row of await log.recent(limit)) {
      console.log(formatTrailLine(row));
    }
    return;
  }

  if (cmd === "verify") {
    const result = await verifyTrail(log, {
      limit: Number(arg("--limit", argv) ?? 200),
      requireOutcomes: argv.includes("--require-outcomes"),
    });
    console.log(result.summary);
    process.exit(result.ok ? 0 : 2);
  }

  if (cmd === "decision") {
    const event = await recordDecision(log, {
      ownerId: need("--owner", argv),
      agentId: need("--agent", argv),
      environment: need("--env", argv),
      intentType: need("--intent", argv),
      fingerprint: need("--fp", argv),
      policyHash: need("--policy", argv),
      effect: need("--effect", argv) as "allow" | "deny" | "require_approval",
    });
    console.log(event.id, event.phase, event.effect);
    return;
  }

  if (cmd === "outcome") {
    const occurred = need("--occurred", argv);
    const event = await recordOutcome(log, {
      ownerId: need("--owner", argv),
      agentId: need("--agent", argv),
      environment: need("--env", argv),
      intentType: need("--intent", argv),
      fingerprint: need("--fp", argv),
      policyHash: need("--policy", argv),
      expectedEffect: need("--expected", argv) as
        | "allow"
        | "deny"
        | "require_approval",
      occurred: occurred === "1" || occurred === "true",
    });
    console.log(event.id, event.phase, event.ok ? "ok" : "fail");
    process.exit(event.ok ? 0 : 2);
  }

  usage();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
