// Writes examples/decisions.json: a small hash-chained decision log built with Warden's AuditChain.
import { writeFileSync } from "node:fs";
import { AuditChain } from "@stlw/warden";

const events: [string, string, Record<string, unknown>][] = [
  ["tool.allowed", "claude-code", { tool: "Read", path: "README.md" }],
  ["tool.allowed", "claude-code", { tool: "Bash", command: "npm test" }],
  ["tool.denied", "claude-code", { tool: "Bash", command: "rm -rf /", rule: "deny-destructive-shell" }],
  ["tool.denied", "claude-code", { tool: "Write", path: ".env", rule: "deny-secret-files" }],
  ["tool.allowed", "claude-code", { tool: "Edit", path: "src/index.ts" }],
];

const chain = new AuditChain();
events.forEach(([eventType, actor, payload], i) =>
  chain.append({
    eventId: `sample-${i}`,
    eventType,
    occurredAt: new Date(Date.UTC(2026, 9, 10, 12, 0, i)).toISOString(),
    actor,
    payload,
  }),
);
writeFileSync(new URL("./decisions.json", import.meta.url), JSON.stringify(chain.entries, null, 2) + "\n");
console.log(`wrote ${chain.entries.length} entries`);
