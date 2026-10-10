import { sha256, verifyAuditChain, type AuditEntry, type LedgerEntry } from "@stlw/warden";

/** Either a Warden AuditChain entry or a ledger entry as exported by `warden audit --export json`. */
export type LogEntry = AuditEntry | LedgerEntry;

type ChainStatus = { valid: true } | { valid: false; brokenAt: number; reason: string };

const isLedger = (e: LogEntry): e is LedgerEntry => "tool" in e && "decision" in e;

/**
 * Re-checks the SQLite ledger's hash chain. Mirrors SqliteLedgerStore.verifyChain in @stlw/warden 0.2.8:
 * each hash is sha256 over the entry fields with toolInput re-stringified and previousHash included.
 * ponytail: tied to the 0.2.8 hash layout; if Warden changes it, bump the pin and this function together.
 */
function verifyLedgerChain(entries: readonly LedgerEntry[]): ChainStatus {
  let prev = "0".repeat(64);
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]!;
    if (e.previousHash !== prev) return { valid: false, brokenAt: i, reason: "BROKEN_LINK" };
    const expected = sha256(
      JSON.stringify({
        id: e.id,
        timestamp: e.timestamp,
        sessionId: e.sessionId,
        taskId: e.taskId,
        tool: e.tool,
        toolInput: JSON.stringify(e.toolInput),
        trustLevel: e.trustLevel,
        trustSource: e.trustSource,
        policyRulesMatched: e.policyRulesMatched,
        decision: e.decision,
        decisionReason: e.decisionReason,
        previousHash: e.previousHash,
      }),
    );
    if (e.hash !== expected) return { valid: false, brokenAt: i, reason: "HASH_MISMATCH" };
    prev = e.hash;
  }
  return { valid: true };
}

function chainStatus(entries: readonly LogEntry[]): ChainStatus {
  if (entries.length > 0 && isLedger(entries[0]!)) return verifyLedgerChain(entries as readonly LedgerEntry[]);
  return verifyAuditChain(entries as readonly AuditEntry[]);
}

export type Anchor = { entryCount: number; headHash: string };

export type Verdict =
  | { ok: true; entries: number; anchoredCount: number }
  | { ok: false; reason: "CHAIN_BROKEN" | "TRUNCATED" | "REWRITTEN" | "EMPTY"; detail: string };

const bare = (h: string) => h.replace(/^0x/, "").toLowerCase();

/** The commitment published on chain for a log. Throws if the log is not a valid chain. */
export function commit(entries: readonly LogEntry[]): Anchor {
  const v = chainStatus(entries);
  if (!v.valid) throw new Error(`log is not a valid chain: ${v.reason} at entry ${v.brokenAt}`);
  if (entries.length === 0) throw new Error("log is empty");
  return { entryCount: entries.length, headHash: `0x${bare(entries[entries.length - 1]!.hash)}` };
}

/**
 * Check a log against an anchored commitment. Needs no network: the anchor is data.
 * - edit inside the chain          -> CHAIN_BROKEN (hash links fail)
 * - rewrite and re-hash the chain  -> REWRITTEN (entry at the anchored count no longer has the anchored head)
 * - drop trailing entries          -> TRUNCATED (fewer entries than were anchored)
 * Entries appended after the anchor are allowed.
 */
export function verifyAgainstAnchor(entries: readonly LogEntry[], anchor: Anchor): Verdict {
  if (entries.length === 0) return { ok: false, reason: "EMPTY", detail: "log has no entries" };
  const chain = chainStatus(entries);
  if (!chain.valid) {
    return { ok: false, reason: "CHAIN_BROKEN", detail: `${chain.reason} at entry ${chain.brokenAt}` };
  }
  if (entries.length < anchor.entryCount) {
    return {
      ok: false,
      reason: "TRUNCATED",
      detail: `log has ${entries.length} entries, ${anchor.entryCount} were anchored`,
    };
  }
  const atAnchor = entries[anchor.entryCount - 1]!;
  if (bare(atAnchor.hash) !== bare(anchor.headHash)) {
    return {
      ok: false,
      reason: "REWRITTEN",
      detail: `entry ${anchor.entryCount} hash ${atAnchor.hash} does not match anchored head ${bare(anchor.headHash)}`,
    };
  }
  return { ok: true, entries: entries.length, anchoredCount: anchor.entryCount };
}
