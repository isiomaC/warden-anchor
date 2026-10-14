// Generated from demo/ledger.json and demo/ledger.anchor.json (the recorded live run).
window.WARDEN_ANCHOR_DATA = {
 "entries": [
  {
   "id": "gw_01M4RRPNE5HNKZP3YK52GRBBDY",
   "previousHash": "0000000000000000000000000000000000000000000000000000000000000000",
   "timestamp": "2026-10-12T19:16:17.478Z",
   "sessionId": "proxy-session",
   "taskId": "proxy-task",
   "tool": "mcp.filesystem.read_file",
   "toolInput": {
    "path": "/Users/chuck/video/warden-anchor-v3/work/warden-anchor/demo/notes.txt"
   },
   "trustLevel": 1,
   "trustSource": "mcp__filesystem__read_file",
   "policyRulesMatched": [],
   "decision": "ALLOW",
   "decisionReason": "Policy: allow-reads — Reading files is allowed",
   "hash": "44739cb78d906df5f242662a4031ed6cb9619e7ac1179948dc8594e0943bcc5c",
   "previousEntryHash": "0000000000000000000000000000000000000000000000000000000000000000"
  },
  {
   "id": "gw_01M4RRPQS1BGT8MR1X515YZ176",
   "previousHash": "44739cb78d906df5f242662a4031ed6cb9619e7ac1179948dc8594e0943bcc5c",
   "timestamp": "2026-10-12T19:16:19.873Z",
   "sessionId": "proxy-session",
   "taskId": "proxy-task",
   "tool": "mcp.filesystem.write_file",
   "toolInput": {
    "path": "/Users/chuck/video/warden-anchor-v3/work/warden-anchor/demo/out.txt",
    "content": "quarterly numbers updated"
   },
   "trustLevel": 1,
   "trustSource": "mcp__filesystem__write_file",
   "policyRulesMatched": [],
   "decision": "DENY",
   "decisionReason": "Policy: deny-writes — The agent may not modify files",
   "hash": "22ae7117bc1fb2291edacfba83697be15c7119bb375d06fe6ce969ede84ee80d",
   "previousEntryHash": "44739cb78d906df5f242662a4031ed6cb9619e7ac1179948dc8594e0943bcc5c"
  }
 ],
 "anchor": {
  "chainId": 10143,
  "contract": "0x8494a7486442c17bba53cf6aca4acb12c3057cb0",
  "publisher": "0xCefe8D12e6d157905f8cb0e2A8DCf5226f48AE85",
  "logName": "claude-code-session-20261012T191623Z",
  "logId": "0x513469ed1530ef214549551235fa212cbf619327e51bcea00a46a986242291a2",
  "entryCount": 2,
  "headHash": "0x22ae7117bc1fb2291edacfba83697be15c7119bb375d06fe6ce969ede84ee80d",
  "txHash": "0xa572063908ecfa135a651a9b1abca61d97238ee4e380985d0b84281d4ec52708",
  "blockNumber": 70478583
 }
};
