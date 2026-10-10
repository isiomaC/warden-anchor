// Replays the tamper cases against the recorded live run. No network, no key, no Claude needed.
import { readFileSync } from "node:fs";
import { verifyAgainstAnchor, type LogEntry } from "./verify.ts";

const read = (p: string) => JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
const anchor = read("../demo/ledger.anchor.json");
const entries: LogEntry[] = read("../demo/ledger.json").entries;

const flipped = structuredClone(entries) as any[];
flipped.find((e) => e.decision === "DENY").decision = "ALLOW";

const cases: [string, LogEntry[]][] = [
  ["untouched ledger", entries],
  ["DENY changed to ALLOW", flipped],
  ["denial entry removed", entries.slice(0, entries.findIndex((e: any) => e.decision === "DENY"))],
];

console.log(`anchor: ${anchor.entryCount} entries, head ${anchor.headHash.slice(0, 18)}..., tx ${anchor.txHash.slice(0, 18)}...`);
for (const [label, log] of cases) {
  const v = verifyAgainstAnchor(log, anchor);
  console.log(`${v.ok ? "OK  " : "FAIL"} ${label.padEnd(24)} ${v.ok ? "" : `${v.reason}: ${v.detail}`}`);
}
