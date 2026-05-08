import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { ContractFactory, ethers } from "ethers";

for (const file of [".envvv", ".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    const privateKeyIndex = trimmed.toLowerCase().indexOf("private key:");
    if (index === -1 && privateKeyIndex === -1) continue;
    const key = privateKeyIndex === 0 ? "PRIVATE_KEY" : trimmed.slice(0, index).trim();
    const value = privateKeyIndex === 0
      ? trimmed.slice("private key:".length).trim().replace(/^['"]|['"]$/g, "")
      : trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    process.env[key] ??= value;
  }
}

const rpcUrl = process.env.ZERO_G_RPC_URL ?? process.env.NEXT_PUBLIC_0G_RPC_URL ?? "https://evmrpc.0g.ai";
const privateKey = process.env.DEPLOYER_PRIVATE_KEY ?? process.env.PRIVATE_KEY;

if (!privateKey) throw new Error("DEPLOYER_PRIVATE_KEY or PRIVATE_KEY must be set locally.");

const provider = new ethers.JsonRpcProvider(rpcUrl, 16661);
const wallet = new ethers.Wallet(privateKey, provider);

function artifact(name: string) {
  return JSON.parse(readFileSync(resolve(`contracts/out/${name}.sol/${name}.json`), "utf8"));
}

async function deploy(name: string) {
  const compiled = artifact(name);
  const factory = new ContractFactory(compiled.abi, compiled.bytecode.object, wallet);
  const contract = await factory.deploy();
  const receipt = await contract.deploymentTransaction()?.wait();
  if (!receipt) throw new Error(`${name} deployment receipt not found.`);
  return { address: await contract.getAddress(), blockNumber: receipt.blockNumber, txHash: receipt.hash };
}

async function main() {
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== 16661) throw new Error(`Expected 0G Mainnet 16661, got ${network.chainId}.`);
  const balance = await provider.getBalance(wallet.address);
  if (balance === 0n) throw new Error(`Deployer ${wallet.address} has no 0G balance.`);

  const guardian = await deploy("GuardianRegistry");
  const receipts = await deploy("ProtectionReceipt");
  const env = [
    `NEXT_PUBLIC_GUARDIAN_REGISTRY_ADDRESS=${guardian.address}`,
    `NEXT_PUBLIC_PROTECTION_RECEIPT_ADDRESS=${receipts.address}`,
    `NEXT_PUBLIC_0G_CHAIN_ID=16661`,
    `NEXT_PUBLIC_0G_CHAIN_ID_HEX=0x4115`,
    `NEXT_PUBLIC_0G_RPC_URL=${rpcUrl}`,
    "NEXT_PUBLIC_0G_EXPLORER=https://chainscan.0g.ai",
    "NEXT_PUBLIC_0G_STORAGE_INDEXER=https://indexer-storage-turbo.0g.ai",
    "NEXT_PUBLIC_0G_STORAGE_SCAN=https://storagescan.0g.ai",
    `GUARDIAN_REGISTRY_DEPLOY_TX=${guardian.txHash}`,
    `PROTECTION_RECEIPT_DEPLOY_TX=${receipts.txHash}`,
    `DEPLOYMENT_BLOCK=${Math.min(guardian.blockNumber, receipts.blockNumber)}`
  ].join("\n");
  writeFileSync("deployment.env", `${env}\n`);
  console.log(env);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
