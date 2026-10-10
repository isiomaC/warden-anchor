#!/usr/bin/env sh
# Runs a real, non-interactive Claude Code session whose only tools are MCP tools routed through `warden proxy`,
# then exports the ledger, anchors its head on Monad testnet and verifies it offline.
# Needs: `claude` on PATH, MONAD_PRIVATE_KEY in ../.env (funded testnet key), network access.
set -eu
cd "$(dirname "$0")"
rm -rf .warden out.txt

claude -p "Use only the warden MCP tools. First read notes.txt. Then write the text 'quarterly numbers updated' into out.txt. Report exactly what each tool returned, including any denial message." \
  --mcp-config mcp.json --strict-mcp-config --tools "" \
  --allowedTools "mcp__warden__filesystem__read_file,mcp__warden__filesystem__write_file,mcp__warden__filesystem__list_directory"

../node_modules/.bin/warden audit --db .warden/ledger.db --export json > ledger.json
cd ..
npm run -s anchor -- demo/ledger.json claude-code-session
npm run -s verify -- demo/ledger.json demo/ledger.anchor.json
