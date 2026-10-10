import { defineConfig } from "hardhat/config";
import hardhatToolboxViem from "@nomicfoundation/hardhat-toolbox-viem";

const key = process.env.MONAD_PRIVATE_KEY;

export default defineConfig({
  plugins: [hardhatToolboxViem],
  solidity: { version: "0.8.28", settings: { evmVersion: "prague" } },
  networks: {
    monadTestnet: {
      type: "http",
      chainType: "l1",
      url: process.env.MONAD_RPC_URL ?? "https://testnet-rpc.monad.xyz",
      chainId: 10143,
      accounts: key ? [key] : [],
    },
  },
});
