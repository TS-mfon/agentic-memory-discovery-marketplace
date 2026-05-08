import { ethers } from "ethers";
import { agentRegistryAbi } from "@shared/index";
import { provider, registry } from "./chain";
import { config } from "./config";
import { listEvents, listUploads } from "./db";

export function policyName(policy: number) {
  return ["Public", "Private", "Permissioned"][policy] ?? "Unknown";
}

export async function getAgents() {
  if (!config.contractAddress) return [];
  const contract = registry();
  const addresses: string[] = await contract.getAllAgents();
  return Promise.all(
    addresses.slice(0, 48).map(async (address) => {
      const profile = await contract.getAgentProfile(address);
      return {
        address,
        name: profile.name,
        tags: profile.capabilityTags as string[],
        metadata: profile.capabilityMetadata,
        memoryRootHash: profile.memoryRootHash,
        owner: profile.owner,
        registeredAt: profile.registeredAt.toString(),
        lastMemoryUpdate: profile.lastMemoryUpdate.toString(),
        totalMemoryUpdates: profile.totalMemoryUpdates.toString(),
        accessPolicy: Number(profile.accessPolicy)
      };
    })
  );
}

export async function getMemoryOverview() {
  const [agents, events, uploads] = await Promise.all([
    getAgents().catch(() => []),
    getContractEvents().catch(() => listEvents().catch(() => [])),
    listUploads().catch(() => [])
  ]);
  const publicAgents = agents.filter((agent) => agent.accessPolicy === 0).length;
  const capabilityCount = new Set(agents.flatMap((agent) => agent.tags)).size;
  return { agents, events, uploads, publicAgents, capabilityCount };
}

export async function getContractEvents() {
  if (!config.contractAddress) return [];
  const rpc = provider();
  const latest = await rpc.getBlockNumber();
  const fromBlock = Math.max(config.deploymentBlock || 0, latest - 250_000);
  const iface = new ethers.Interface(agentRegistryAbi);
  const logs = await rpc.getLogs({ address: config.contractAddress, fromBlock, toBlock: latest });
  return logs.flatMap((log) => {
    try {
      const parsed = iface.parseLog(log);
      if (!parsed) return [];
      return [{
        eventName: parsed.name,
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
        logIndex: log.index,
        explorer: `${config.explorerUrl}/tx/${log.transactionHash}`,
        args: Object.fromEntries(
          parsed.fragment.inputs.map((input, index) => [input.name, parsed.args[index]?.toString?.() ?? parsed.args[index]])
        )
      }];
    } catch {
      return [];
    }
  }).reverse();
}
