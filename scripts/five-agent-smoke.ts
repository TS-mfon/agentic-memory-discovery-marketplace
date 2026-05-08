import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { keccak256, toUtf8Bytes } from "ethers";

function loadEnv() {
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
}

function cast(args: string[], privateKey?: string) {
  const finalArgs = [...args, "--rpc-url", process.env.ZERO_G_RPC_URL ?? "https://evmrpc.0g.ai"];
  if (privateKey) finalArgs.push("--private-key", privateKey, "--gas-price", "4000000007", "--priority-gas-price", "2000000000", "--gas-limit", "150000");
  try {
    return execFileSync("cast", finalArgs, { encoding: "utf8" });
  } catch (error: any) {
    const stderr = String(error.stderr ?? error.message ?? "cast failed").replaceAll(privateKey ?? "", "[redacted]");
    throw new Error(stderr);
  }
}

function txHash(receipt: string) {
  return receipt.match(/transactionHash\s+(0x[a-fA-F0-9]{64})/)?.[1] ?? "";
}

loadEnv();
const registry = process.env.CONTRACT_ADDRESS;
const deployerKey = process.env.DEPLOYER_PRIVATE_KEY;
if (!registry || !deployerKey) throw new Error("CONTRACT_ADDRESS and DEPLOYER_PRIVATE_KEY are required.");

const data = JSON.parse(readFileSync(".agents.local.json", "utf8")) as {
  agents: Array<{ id: string; name: string; address: string; privateKey: string }>;
};

const capabilities = [
  ["0G", "Storage", "Lease"],
  ["0G", "Discovery", "Indexing"],
  ["0G", "Memory", "Proofs"],
  ["0G", "Renewal", "Automation"],
  ["0G", "Archive", "Verification"]
];
const report: any = { memoryContract: registry, generatedAt: new Date().toISOString(), actions: [] };

for (const [index, agent] of data.agents.entries()) {
  try {
  if (agent.address.toLowerCase() !== process.env.DEPLOYER_ADDRESS?.toLowerCase()) {
    const balance = BigInt(cast(["balance", agent.address]).trim() || "0");
    if (balance < 650_000_000_000_000n) {
      const deployerBalance = BigInt(cast(["balance", process.env.DEPLOYER_ADDRESS ?? "0x0000000000000000000000000000000000000000"]).trim() || "0");
      if (deployerBalance < 1_300_000_000_000_000n) {
        report.actions.push({ agent: agent.id, address: agent.address, kind: "skipped", reason: "deployer balance too low to fund this agent" });
        continue;
      }
      const fundReceipt = cast(["send", agent.address, "--value", "1200000000000000"], deployerKey);
      report.actions.push({ agent: agent.id, address: agent.address, kind: "funded", txHash: txHash(fundReceipt), explorer: `https://chainscan.0g.ai/tx/${txHash(fundReceipt)}` });
    }
  }

  let registerTx = "";
  const registered = cast(["call", registry, "isRegistered(address)(bool)", agent.address]).trim() === "true";
  if (!registered) {
    const metadata = JSON.stringify({ description: `${agent.name} verifies 0G dapp flows`, agentId: agent.id });
    const receipt = cast([
      "send",
      registry,
      "registerAgent(string,string[],string,uint8)",
      agent.name,
      JSON.stringify(capabilities[index]),
      metadata,
      "0"
    ], agent.privateKey);
    registerTx = txHash(receipt);
  }

  const memory = {
    kind: "verified-agent-memory-state",
    agent: agent.id,
    name: agent.name,
    address: agent.address,
    capabilities: capabilities[index],
    timestamp: new Date().toISOString(),
    checks: ["registry-profile", "capability-discovery", "memory-root-update"],
    contract: registry
  };
  const root = keccak256(toUtf8Bytes(JSON.stringify(memory)));
  const updateReceipt = cast(["send", registry, "updateMemory(bytes32)", root], agent.privateKey);
  const updateTx = txHash(updateReceipt);
  report.actions.push({
    agent: agent.id,
    address: agent.address,
    kind: "memory-tested",
    memory,
    memoryRoot: root,
    registerTx,
    registerExplorer: registerTx ? `https://chainscan.0g.ai/tx/${registerTx}` : "already registered",
    updateTx,
    updateExplorer: `https://chainscan.0g.ai/tx/${updateTx}`
  });
  } catch (error) {
    report.actions.push({ agent: agent.id, address: agent.address, kind: "failed", error: error instanceof Error ? error.message : String(error) });
  }
}

writeFileSync("agent-proof-report.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(`wrote ${report.actions.length} memory proof actions`);
