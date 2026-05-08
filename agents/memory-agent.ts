import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { ethers, Interface } from "ethers";
import { agentRegistryAbi, MemoryAccess, MemoryObject } from "../packages/shared/src";

for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    process.env[trimmed.slice(0, index).trim()] ??= trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
  }
}

const rpcUrl = process.env.ZERO_G_RPC_URL ?? "https://evmrpc.0g.ai";
const contractAddress = process.env.CONTRACT_ADDRESS ?? process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const privateKey = process.env.AGENT_PRIVATE_KEY ?? process.env.DEPLOYER_PRIVATE_KEY;
const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

if (!contractAddress) throw new Error("CONTRACT_ADDRESS is required.");
if (!privateKey) throw new Error("AGENT_PRIVATE_KEY is required.");

const provider = new ethers.JsonRpcProvider(rpcUrl, 16661);
const wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddress, agentRegistryAbi, wallet);
const iface = new Interface(agentRegistryAbi);

async function sendPrepared(transaction: { to: string; value: string; data: string }) {
  const sent = await wallet.sendTransaction({
    to: transaction.to,
    value: BigInt(transaction.value),
    data: transaction.data
  });
  return sent.wait();
}

async function ensureRegistered() {
  try {
    await contract.getAgentProfile(wallet.address);
    return;
  } catch {}
  const prepared = await fetch(`${apiBase}/api/agents/prepare-register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Mainnet Memory Scout",
      capabilityTags: ["0G", "Storage", "Discovery"],
      capabilityMetadata: JSON.stringify({ description: "Autonomous 0G memory registry demo agent" }),
      accessPolicy: MemoryAccess.PUBLIC
    })
  }).then((res) => res.json());
  if (prepared.error) throw new Error(prepared.error);
  const receipt = await sendPrepared(prepared.transaction);
  console.log(`Registered agent in ${receipt?.hash}`);
}

async function main() {
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== 16661) throw new Error(`Expected 0G Mainnet 16661, got ${network.chainId}.`);
  await ensureRegistered();

  const profile = await contract.getAgentProfile(wallet.address);
  const memory: MemoryObject = {
    version: "1.0",
    agentAddress: wallet.address,
    timestamp: Math.floor(Date.now() / 1000),
    snapshotId: randomUUID(),
    context: {
      conversationHistory: [{ role: "agent", content: "Persisting a mainnet 0G memory snapshot." }],
      taskLogs: [{ taskId: randomUUID(), description: "mainnet memory upload", result: "pending", timestamp: Date.now() }],
      learnedPreferences: { preferredNetwork: "0G Mainnet" }
    },
    embeddings: { memoryVectors: [], embeddingModel: "" },
    metadata: { sessionCount: 1, totalTokensProcessed: 0 },
    previousRootHash: profile.memoryRootHash
  };

  const message = `0G memory upload authorization agent:${wallet.address.toLowerCase()} ts:${Date.now()}`;
  const signature = await wallet.signMessage(message);
  const upload = await fetch(`${apiBase}/api/memory/upload`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ agentAddress: wallet.address, message, signature, memory })
  }).then((res) => res.json());
  if (upload.error) throw new Error(upload.error);

  const receipt = await sendPrepared(upload.transaction);
  const parsed = receipt?.logs
    .map((log: any) => {
      try {
        return iface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((log: any) => log?.name === "MemoryUpdated");
  console.log(`Uploaded memory root ${upload.upload.rootHash}`);
  console.log(`Updated registry in ${receipt?.hash}`);
  console.log(parsed?.args?.newHash?.toString?.() ?? "");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
