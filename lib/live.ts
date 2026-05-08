import { ethers } from "ethers";
import { agentRegistryAbi } from "@shared/index";
import { provider, registry } from "./chain";
import { config } from "./config";
import { listEvents, listUploads } from "./db";

export type LiveAgent = {
  address: string;
  name: string;
  tags: string[];
  metadata: string;
  memoryRootHash: string;
  owner: string;
  registeredAt: string;
  lastMemoryUpdate: string;
  totalMemoryUpdates: string;
  accessPolicy: number;
};

export function policyName(policy: number) {
  return ["Public", "Private", "Permissioned"][policy] ?? "Unknown";
}

function normalizeAddress(value: string) {
  try {
    return ethers.getAddress(value);
  } catch {
    return "";
  }
}

async function getRegisteredAddressesFromEvents() {
  const events = await getContractEvents();
  const addresses = events
    .filter((event) => event.eventName === "AgentRegistered")
    .map((event) => normalizeAddress(String(event.args.agentAddress ?? "")))
    .filter(Boolean);
  return Array.from(new Set(addresses));
}

async function getAgentProfile(contract: ethers.Contract, address: string): Promise<LiveAgent> {
  const profile = await contract.getAgentProfile(address);
  return {
    address: ethers.getAddress(String(address)),
    name: String(profile.name ?? profile[0]),
    tags: Array.from((profile.capabilityTags ?? profile[1] ?? []) as Iterable<unknown>).map(String),
    metadata: String(profile.capabilityMetadata ?? profile[2]),
    memoryRootHash: String(profile.memoryRootHash ?? profile[3]),
    owner: String(profile.owner ?? profile[4]),
    registeredAt: (profile.registeredAt ?? profile[5]).toString(),
    lastMemoryUpdate: (profile.lastMemoryUpdate ?? profile[6]).toString(),
    totalMemoryUpdates: (profile.totalMemoryUpdates ?? profile[7]).toString(),
    accessPolicy: Number(profile.accessPolicy ?? profile[8])
  };
}

export async function getAgents(): Promise<LiveAgent[]> {
  if (!config.contractAddress) return [];
  const contract = registry();
  let addresses: string[] = [];
  try {
    addresses = Array.from(await contract.getAllAgents(), (address) => normalizeAddress(String(address))).filter(Boolean);
  } catch {
    addresses = await getRegisteredAddressesFromEvents();
  }
  if (addresses.length === 0) addresses = await getRegisteredAddressesFromEvents();

  const uniqueAddresses = [...Array.from(new Set(addresses))].slice(-96).reverse();
  const profiles = await Promise.allSettled(uniqueAddresses.map((address) => getAgentProfile(contract, address)));
  return profiles.flatMap((profile) => profile.status === "fulfilled" ? [profile.value] : []);
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
  const fromBlock = config.deploymentBlock > 0 ? config.deploymentBlock : Math.max(0, latest - 500_000);
  const iface = new ethers.Interface(agentRegistryAbi);
  const logs: ethers.Log[] = [];
  const chunkSize = 75_000;
  for (let start = fromBlock; start <= latest; start += chunkSize + 1) {
    const end = Math.min(latest, start + chunkSize);
    logs.push(...await rpc.getLogs({ address: config.contractAddress, fromBlock: start, toBlock: end }));
  }
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
