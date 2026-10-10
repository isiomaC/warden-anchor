// Replays the tamper cases against the recorded live run. No network, no key, no Claude needed.
import { readFileSync } from "node:fs";
import { sha256 } from "@stlw/warden";
import { verifyAgainstAnchor, type LogEntry } from "./verify.ts";

const read = (p: string) => JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
const anchor = read("../demo/ledger.anchor.json");
const entries: LogEntry[] = read("../demo/ledger.json").entries;

const flipped = structuredClone(entries) as any[];
flipped.find((e) => e.decision === "DENY").decision = "ALLOW";

// An attacker who also recomputes every hash after the edit: the chain is internally valid again.
function rehash(log: any[]): any[] {
  let prev = "0".repeat(64);
  return log.map((e) => {
    const x = { ...e, previousHash: prev, previousEntryHash: prev };
    x.hash = sha256(
      JSON.stringify({
        id: x.id, timestamp: x.timestamp, sessionId: x.sessionId, taskId: x.taskId, tool: x.tool,
        toolInput: JSON.stringify(x.toolInput), trustLevel: x.trustLevel, trustSource: x.trustSource,
        policyRulesMatched: x.policyRulesMatched, decision: x.decision, decisionReason: x.decisionReason,
        previousHash: x.previousHash,
      }),
    );
    prev = x.hash;
    return x;
  });
}

const cases: [string, LogEntry[]][] = [
  ["untouched ledger", entries],
  ["DENY changed to ALLOW", flipped],
  ["flipped and fully re-hashed", rehash(flipped)],
  ["denial entry removed", entries.slice(0, entries.findIndex((e: any) => e.decision === "DENY"))],
];

console.log(`anchor: ${anchor.entryCount} entries, head ${anchor.headHash.slice(0, 18)}..., tx ${anchor.txHash.slice(0, 18)}...`);
for (const [label, log] of cases) {
  const v = verifyAgainstAnchor(log, anchor);
  console.log(`${v.ok ? "OK  " : "FAIL"} ${label.padEnd(24)} ${v.ok ? "" : `${v.reason}: ${v.detail}`}`);
}
