import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { ContractFactory, ethers } from "ethers";

for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    process.env[key] ??= value;
  }
}

const rpcUrl = process.env.ZERO_G_RPC_URL ?? "https://evmrpc.0g.ai";
const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
const ownerAddress = process.env.DEPLOYER_ADDRESS;

if (!privateKey) throw new Error("DEPLOYER_PRIVATE_KEY must be set in your local environment.");
if (!ownerAddress) throw new Error("DEPLOYER_ADDRESS must be set in your local environment.");

const provider = new ethers.JsonRpcProvider(rpcUrl, 16661);
const wallet = new ethers.Wallet(privateKey, provider);
const artifact = JSON.parse(readFileSync(resolve("contracts/out/AgentRegistry.sol/AgentRegistry.json"), "utf8"));

async function main() {
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== 16661) throw new Error(`Expected 0G Mainnet 16661, got ${network.chainId}.`);
  const balance = await provider.getBalance(wallet.address);
  if (balance === 0n) throw new Error(`Deployer ${wallet.address} has no 0G balance.`);

  const factory = new ContractFactory(artifact.abi, artifact.bytecode.object, wallet);
  const contract = await factory.deploy(ownerAddress);
  const receipt = await contract.deploymentTransaction()?.wait();
  if (!receipt) throw new Error("Deployment receipt not found.");
  const address = await contract.getAddress();
  const env = [
    `CONTRACT_ADDRESS=${address}`,
    `NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`,
    `DEPLOYMENT_BLOCK=${receipt.blockNumber}`
  ].join("\n");
  writeFileSync("deployment.env", `${env}\n`);
  console.log(env);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
