import { ZERO_G_MAINNET } from "@shared/index";

export const config = {
  chainId: Number(process.env.ZERO_G_CHAIN_ID ?? ZERO_G_MAINNET.chainId),
  rpcUrl: process.env.ZERO_G_RPC_URL ?? ZERO_G_MAINNET.rpcUrl,
  storageIndexer: process.env.ZERO_G_STORAGE_INDEXER ?? ZERO_G_MAINNET.storageIndexer,
  explorerUrl: process.env.ZERO_G_EXPLORER ?? ZERO_G_MAINNET.explorerUrl,
  contractAddress: process.env.CONTRACT_ADDRESS ?? process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "",
  deploymentBlock: Number(process.env.DEPLOYMENT_BLOCK ?? "0"),
  serverPrivateKey: process.env.SERVER_WALLET_PRIVATE_KEY ?? "",
  adminSecret: process.env.ADMIN_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  memoryEncryptionKey: process.env.MEMORY_ENCRYPTION_KEY ?? ""
};

export function requireContractAddress() {
  if (!config.contractAddress || !/^0x[a-fA-F0-9]{40}$/.test(config.contractAddress)) {
    throw new Error("CONTRACT_ADDRESS or NEXT_PUBLIC_CONTRACT_ADDRESS is not configured.");
  }
  return config.contractAddress;
}
