import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import { createPublicClient, createWalletClient, defineChain, http, keccak256, parseAbi, toHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { commit, verifyAgainstAnchor, type Anchor, type LogEntry } from "./verify.ts";

const abi = parseAbi([
  "function anchor(bytes32 logId, uint64 entryCount, bytes32 headHash)",
  "function latest(address publisher, bytes32 logId) view returns ((uint64 entryCount, bytes32 headHash, uint64 blockNumber, uint64 timestamp))",
]);

const deployment = JSON.parse(readFileSync(new URL("../deployments/monadTestnet.json", import.meta.url), "utf8"));
const rpc = process.env.MONAD_RPC_URL ?? "https://testnet-rpc.monad.xyz";
const chain = defineChain({
  id: deployment.chainId,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: [rpc] } },
});

/** Accepts a bare entry array or the `{ entries }` object that `warden audit --export json` prints. */
const readLog = (path: string): LogEntry[] => {
  const raw = JSON.parse(readFileSync(path, "utf8"));
  return Array.isArray(raw) ? raw : raw.entries;
};

async function anchor(logPath: string, name = basename(logPath).replace(/\.json$/, "")) {
  const key = process.env.MONAD_PRIVATE_KEY as `0x${string}` | undefined;
  if (!key) throw new Error("Set MONAD_PRIVATE_KEY (see .env).");

  const entries = readLog(logPath);
  const { entryCount, headHash } = commit(entries); // throws on a broken or empty log
  const logId = keccak256(toHex(name));
  const account = privateKeyToAccount(key);
  const pub = createPublicClient({ chain, transport: http() });
  const wallet = createWalletClient({ account, chain, transport: http() });

  const txHash = await wallet.writeContract({
    address: deployment.address,
    abi,
    functionName: "anchor",
    args: [logId, BigInt(entryCount), headHash as `0x${string}`],
  });
  const receipt = await pub.waitForTransactionReceipt({ hash: txHash });
  if (receipt.status !== "success") throw new Error(`anchor tx reverted: ${txHash}`);

  const onChain = await pub.readContract({
    address: deployment.address,
    abi,
    functionName: "latest",
    args: [account.address, logId],
  });
  if (Number(onChain.entryCount) !== entryCount || onChain.headHash !== headHash) {
    throw new Error(`on-chain anchor does not match local commitment: ${JSON.stringify(onChain, (_, v) => (typeof v === "bigint" ? v.toString() : v))}`);
  }

  const record = {
    chainId: deployment.chainId,
    contract: deployment.address,
    publisher: account.address,
    logName: name,
    logId,
    entryCount,
    headHash,
    txHash,
    blockNumber: Number(receipt.blockNumber),
  };
  const out = logPath.replace(/\.json$/, "") + ".anchor.json";
  writeFileSync(out, JSON.stringify(record, null, 2) + "\n");
  console.log(record, `\nwrote ${out}`);
}

function verify(logPath: string, anchorPath: string) {
  const a = JSON.parse(readFileSync(anchorPath, "utf8")) as Anchor;
  const v = verifyAgainstAnchor(readLog(logPath), a);
  console.log(v.ok ? `OK: ${v.entries} entries, anchored head at ${v.anchoredCount} matches` : `FAIL ${v.reason}: ${v.detail}`);
  process.exitCode = v.ok ? 0 : 1;
}

const [cmd, a, b] = process.argv.slice(2);
if (cmd === "anchor" && a) await anchor(a, b);
else if (cmd === "verify" && a && b) verify(a, b);
else {
  console.error("usage:\n  anchor <log.json> [log-name]   anchor a log's head on Monad testnet\n  verify <log.json> <anchor.json>   check a log offline against an anchor record");
  process.exitCode = 2;
}
