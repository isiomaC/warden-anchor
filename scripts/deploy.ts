import { mkdirSync, writeFileSync } from "node:fs";
import { network } from "hardhat";

const { viem, networkName } = await network.create();
const publicClient = await viem.getPublicClient();
const [deployer] = await viem.getWalletClients();
if (!deployer) throw new Error("No deployer account. Set MONAD_PRIVATE_KEY.");

const contract = await viem.deployContract("WardenAnchor");

const out = {
  network: networkName,
  chainId: await publicClient.getChainId(),
  contract: "WardenAnchor",
  address: contract.address,
  deployer: deployer.account.address,
  // ponytail: viem's deployContract result exposes no tx hash here; add deployTxHash and blockNumber by hand from the explorer.
};
mkdirSync("deployments", { recursive: true });
writeFileSync(`deployments/${networkName}.json`, JSON.stringify(out, null, 2) + "\n");
console.log(out);
