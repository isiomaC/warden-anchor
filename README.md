# warden-anchor

Proof-of-enforcement for AI agent runtimes, anchored on Monad.

Built for the Monad Metropolis hackathon, Track 04 (Trust, Identity and AI infra).
Status: working prototype on Monad testnet. Contract, anchoring CLI, offline verifier and a
recorded live run are in this repository.

## Description and intended user

**Problem.** When an AI agent is governed by a policy, the evidence that the policy
held is usually a log kept by the same machine the agent runs on. Anyone with access to
that machine can edit the log, or cut off its tail, and a plain hash chain cannot tell:
an attacker who re-hashes the chain produces one that still verifies.

**Solution.** warden-anchor publishes the head of the decision log (entry count and head
hash) to a small contract on Monad. A third party holding the log and the anchor record
can check, offline, that the log was not edited, rewritten or truncated since it was
anchored.

**Intended user.** A team running coding agents (Claude Code or any MCP client) that must
show an auditor, customer or colleague that the agent was blocked from what policy
forbids, and that the record of it was not changed afterwards.

## Pre-existing components

This repository does not contain Warden. It consumes it as a dependency.

| Component | Version | License | Source |
| --- | --- | --- | --- |
| `@stlw/warden` | 0.2.8 (pinned) | MIT | https://github.com/isiomaC/warden, https://www.npmjs.com/package/@stlw/warden |
| `@stlw/warden-cli` | 0.2.8 (pinned) | MIT | same repository, https://www.npmjs.com/package/@stlw/warden-cli |

Warden is the policy engine, MCP proxy and unkeyed hash-chained ledger. The `warden proxy`
and `warden audit` commands used by the demo come from its CLI. Both packages were
published before the hackathon window and live in their own open source repository.
Everything under `contracts/`, `src/`, `test/`, `scripts/`, `examples/` and `demo/` in this
repository is new work.

## What is new in this repository

All code in this repository is written during the hackathon window.

- `WardenAnchor` contract on Monad testnet (`contracts/`), with tests and a deploy script
- Anchoring CLI that commits a Warden decision log's head to the contract (`src/cli.ts anchor`)
- Offline verifier that detects edits, full re-hash rewrites and truncation (`src/verify.ts`, `src/cli.ts verify`)
- A runnable demo: a real Claude Code session blocked by Warden, its ledger anchored on Monad and verified (`demo/`)

## Monad integration

`WardenAnchor` is deployed on Monad testnet (chain id 10143).

| Item | Value |
| --- | --- |
| Contract | [`0x8494a7486442c17bba53cf6aca4acb12c3057cb0`](https://testnet.monadvision.com/address/0x8494a7486442c17bba53cf6aca4acb12c3057cb0) |
| Deployment tx | [`0xc8dbdb22...c4043d6`](https://testnet.monadvision.com/tx/0xc8dbdb228231de8ce4d621bbfa1affa7278a583022915f5162c4400c4c4043d6) |
| Deploy block | 69798973 |
| Deployer | `0xcefe8d12e6d157905f8cb0e2a8dcf5226f48ae85` |

The contract stores, per publisher and log id, the entry count and head hash of a
Warden decision log. The count can only increase, so a truncated log cannot replace
a newer anchor.

Why Monad: it is bytecode-compatible with Ethereum, so the contract, Hardhat and viem
work unchanged, and its documented 300 ms block time and 600 ms finality mean an anchor
transaction is final within about a second. That makes anchoring at the end of every agent
session practical, which is what keeps the window in which a log could be rewritten
unnoticed short.

Deployment record: [deployments/monadTestnet.json](deployments/monadTestnet.json).

## Architecture

```
Claude Code ──MCP tool call──> warden proxy ──ALLOW──> upstream MCP server
                                   │
                                   └─ every decision ─> hash-chained SQLite ledger
                                                              │
                          npm run anchor: verify chain, send anchor(logId, count, head)
                                                              ▼
                                              WardenAnchor on Monad testnet
                                                              │
                          npm run verify: offline, log + anchor record -> OK / FAIL
```

Warden governs MCP tool calls that pass through its proxy. Claude Code's own native
tools are outside that boundary (Warden's documentation says so); the demo removes them
with `--tools ""` so the MCP path is the only path.

What anchoring adds: the ledger chain alone catches an edited entry, but an attacker who
rewrites and re-hashes the whole chain, or drops the tail, produces a chain that still
verifies. The head published on Monad does not move, so both are caught.

## Tech stack

- Node.js 22.18+, TypeScript (run directly, no build step)
- Solidity 0.8.28, Hardhat 3, `node:test`
- viem for chain access
- Monad testnet (chain id 10143)
- `@stlw/warden` and `@stlw/warden-cli` 0.2.8 for policy enforcement and the ledger

## Setup

Requires Node.js 22.18 or later (runs TypeScript directly).

```sh
npm install
npm test                       # contract and verifier tests, no network needed
npm run sample-log             # writes examples/decisions.json with Warden's AuditChain
npm run verify -- examples/decisions.json examples/decisions.anchor.json
```

`verify` is offline. It checks a log against an anchor record and prints `OK`, or
`FAIL` with `CHAIN_BROKEN`, `REWRITTEN` or `TRUNCATED`.

To anchor a log yourself, put a funded Monad testnet key in `.env` as
`MONAD_PRIVATE_KEY=0x...` and run `npm run anchor -- path/to/log.json`. It verifies the
chain, sends `anchor(...)`, reads the value back from the contract, and writes
`<log>.anchor.json`. `examples/decisions.anchor.json` is a real record from testnet.

Warden stores its ledger in SQLite through `better-sqlite3`, a native module. npm 12
blocks install scripts by default, so a fresh install fails at runtime with "Could not
locate the bindings file". `package.json` already allows it; if you install Warden in
another project run `npm install-scripts approve better-sqlite3 && npm rebuild better-sqlite3`.

## Demo

`demo/run.sh` runs a real non-interactive Claude Code session whose only tools are MCP
tools routed through `warden proxy` (policy in `demo/warden.config.yml`: reads allowed,
writes denied). It then exports the ledger, anchors it on Monad testnet and verifies it
offline. Recorded output of one run is in `demo/`:

- `session-result.md`: what Claude reported (read allowed, write denied by `deny-writes`)
- `ledger.json`: the exported two entry ledger
- `ledger.anchor.json`: the anchor record (contract, tx hash, block)

## Limitations

- Testnet only. The deployed contract has not been audited and holds no funds.
- An anchor proves the log head existed at that block. Entries a compromised host never
  wrote, or events before the first anchor, are not covered.
- The publisher key is trusted for its own logs: anyone can anchor, so a verifier must
  check which publisher address the anchor record names.
- Warden governs MCP tool calls routed through `warden proxy`. Claude Code's native tools
  and HTTP hooks are outside that boundary, as Warden's own documentation states.
- The verifier mirrors the hash layout of Warden 0.2.8's SQLite ledger. Upgrade Warden and
  this check together.

## AI tooling disclosure

This project is built with AI coding assistance (Claude Code).

## License

MIT. See [LICENSE](LICENSE).
