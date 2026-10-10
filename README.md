# warden-anchor

Proof-of-enforcement for AI agent runtimes, anchored on Monad.

Built for the Monad Metropolis hackathon, Track 04 (Trust, Identity and AI infra).
Status: work in progress. Sections marked TODO are filled in as the build lands.

## Description and intended user

TODO. For teams running coding agents (Claude Code, MCP clients) who need evidence,
checkable by a third party, that a policy was enforced and the decision log was not
rewritten or truncated afterwards.

## Pre-existing components

This repository does not contain Warden. It consumes it as a dependency.

| Component | Version | License | Source |
| --- | --- | --- | --- |
| `@stlw/warden` | 0.2.8 (pinned) | MIT | https://github.com/isiomaC/warden, https://www.npmjs.com/package/@stlw/warden |

Warden is the policy engine, hook server, MCP gateway and unkeyed hash-chained audit log.
It was published before the hackathon window and is open source under its own repository.

## What is new in this repository

All code in this repository is written during the hackathon window.

- Anchor contract on Monad (TODO)
- Anchoring CLI that commits a Warden decision log's head to the contract (`src/cli.ts anchor`)
- Offline verifier that detects edits, full re-hash rewrites and truncation (`src/verify.ts`, `src/cli.ts verify`)
- Live validation against a real Claude Code session (TODO)

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
a newer anchor. Why Monad: TODO (to be written with the anchoring demo).

Deployment record: [deployments/monadTestnet.json](deployments/monadTestnet.json).

## Architecture

TODO.

## Tech stack

Node.js 22+, TypeScript, Solidity, Monad (testnet), `@stlw/warden`.

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

## AI tooling disclosure

This project is built with AI coding assistance (Claude Code).

## License

MIT. See [LICENSE](LICENSE).
