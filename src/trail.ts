import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { ComplianceEvent, ComplianceLog } from "./types.js";

export const COMPLIANCE_DIR_NAME = ".blake-compliance";
export const COMPLIANCE_LOG_NAME = "trail.jsonl";

export function complianceLogPath(root: string): string {
  return path.join(root, COMPLIANCE_DIR_NAME, COMPLIANCE_LOG_NAME);
}

function parseLine(line: string): ComplianceEvent | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  try {
    const row = JSON.parse(trimmed) as ComplianceEvent;
    if (!row?.id || !row.at || !row.phase || !row.fingerprint) return null;
    return row;
  } catch {
    return null;
  }
}

/** Durable JSONL under `{root}/.blake-compliance/trail.jsonl`. */
export function createFsComplianceLog(root: string): ComplianceLog {
  const file = complianceLogPath(root);
  return {
    path: file,
    async append(event) {
      await mkdir(path.dirname(file), { recursive: true });
      await appendFile(file, `${JSON.stringify(event)}\n`, "utf8");
    },
    async recent(limit = 50) {
      const capped = Math.max(1, Math.min(500, limit));
      let raw = "";
      try {
        raw = await readFile(file, "utf8");
      } catch {
        return [];
      }
      const lines = raw.split("\n");
      const out: ComplianceEvent[] = [];
      for (let i = lines.length - 1; i >= 0 && out.length < capped; i -= 1) {
        const row = parseLine(lines[i] ?? "");
        if (row) out.push(row);
      }
      return out;
    },
  };
}

/** In-memory ring — tests and short-lived hosts. */
export function createMemoryComplianceLog(capacity = 500): ComplianceLog {
  const events: ComplianceEvent[] = [];
  return {
    path: ":memory:",
    async append(event) {
      events.push(event);
      if (events.length > capacity) {
        events.splice(0, events.length - capacity);
      }
    },
    async recent(limit = 50) {
      const capped = Math.max(1, Math.min(capacity, limit));
      return events.slice(-capped).reverse();
    },
  };
}
