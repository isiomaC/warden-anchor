import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AuditChain, type AuditEntry } from "@stlw/warden";
import { commit, verifyAgainstAnchor } from "../src/verify.ts";

function build(n: number, tweak?: (i: number) => string): AuditEntry[] {
  const chain = new AuditChain();
  for (let i = 0; i < n; i++) {
    chain.append({
      eventId: `e${i}`,
      eventType: i % 2 ? "tool.denied" : "tool.allowed",
      occurredAt: new Date(Date.UTC(2026, 9, 10, 12, 0, i)).toISOString(),
      actor: "claude-code",
      payload: { tool: tweak ? tweak(i) : `tool-${i}` },
    });
  }
  return [...chain.entries];
}

describe("verifyAgainstAnchor", () => {
  const log = build(5);
  const anchor = commit(log);

  it("accepts the untouched log", () => {
    assert.deepEqual(verifyAgainstAnchor(log, anchor), { ok: true, entries: 5, anchoredCount: 5 });
  });

  it("accepts entries appended after the anchor", () => {
    const longer = build(8);
    assert.equal(verifyAgainstAnchor(longer, anchor).ok, true);
  });

  it("detects an edited entry as CHAIN_BROKEN", () => {
    const edited = structuredClone(log);
    (edited[2]!.event.payload as { tool: string }).tool = "something-harmless";
    const v = verifyAgainstAnchor(edited, anchor);
    assert.equal(v.ok, false);
    assert.equal(!v.ok && v.reason, "CHAIN_BROKEN");
  });

  it("detects a fully re-hashed rewrite as REWRITTEN", () => {
    const rewritten = build(5, (i) => (i === 2 ? "something-harmless" : `tool-${i}`));
    assert.equal(verifyAgainstAnchor(rewritten, commit(rewritten)).ok, true, "rewrite is internally valid");
    const v = verifyAgainstAnchor(rewritten, anchor);
    assert.equal(!v.ok && v.reason, "REWRITTEN");
  });

  it("detects dropped trailing entries as TRUNCATED", () => {
    const v = verifyAgainstAnchor(log.slice(0, 3), anchor);
    assert.equal(!v.ok && v.reason, "TRUNCATED");
  });

  it("refuses to commit to a broken or empty log", () => {
    assert.throws(() => commit([]));
    const broken = structuredClone(log);
    broken[1]!.hash = "00".repeat(32);
    assert.throws(() => commit(broken));
  });
});
