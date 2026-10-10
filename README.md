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
- Anchoring script for Warden decision logs (TODO)
- Offline verifier wrapper that detects rewrites and truncation (TODO)
- Live validation against a real Claude Code session (TODO)

## Monad integration

TODO. Contract address, transaction hashes and why Monad.

## Architecture

TODO.

## Tech stack

Node.js 22+, TypeScript, Solidity, Monad (testnet), `@stlw/warden`.

## Setup

TODO. Must be runnable by a third party from a clean machine.

## AI tooling disclosure

This project is built with AI coding assistance (Claude Code).

## License

MIT. See [LICENSE](LICENSE).
