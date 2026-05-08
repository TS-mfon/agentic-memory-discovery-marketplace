"use client";

import { useEffect, useMemo, useState } from "react";
import { Contract, ethers } from "ethers";
import { agentRegistryAbi } from "@shared/index";
import { clientConfig } from "@/lib/config";

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

function policyName(policy: number) {
  return ["Public", "Private", "Permissioned"][policy] ?? "Unknown";
}

function agentDescription(metadata: string) {
  try {
    const parsed = JSON.parse(metadata) as { description?: unknown };
    if (typeof parsed.description === "string" && parsed.description.trim()) {
      return parsed.description.trim();
    }
  } catch {
    return metadata;
  }
  return metadata;
}

function plainTags(value: unknown): string[] {
  return Array.from((value ?? []) as Iterable<unknown>).map(String);
}

function plainProfile(profile: any, address: string): LiveAgent {
  return {
    address: ethers.getAddress(String(address)),
    name: String(profile.name ?? profile[0]),
    tags: plainTags(profile.capabilityTags ?? profile[1]),
    metadata: String(profile.capabilityMetadata ?? profile[2]),
    memoryRootHash: String(profile.memoryRootHash ?? profile[3]),
    owner: String(profile.owner ?? profile[4]),
    registeredAt: (profile.registeredAt ?? profile[5]).toString(),
    lastMemoryUpdate: (profile.lastMemoryUpdate ?? profile[6]).toString(),
    totalMemoryUpdates: (profile.totalMemoryUpdates ?? profile[7]).toString(),
    accessPolicy: Number(profile.accessPolicy ?? profile[8])
  };
}

async function readAgents(): Promise<LiveAgent[]> {
  if (!clientConfig.contractAddress) return [];
  const provider = new ethers.JsonRpcProvider(clientConfig.rpcUrl, clientConfig.chainId);
  const contract = new Contract(clientConfig.contractAddress, agentRegistryAbi, provider);
  const addresses = Array.from(await contract.getAllAgents(), (address) => ethers.getAddress(String(address)));
  const recentAddresses = [...addresses].slice(-96).reverse();
  const profiles = await Promise.allSettled(
    recentAddresses.map(async (address) => {
      const profile = await contract.getAgentProfile(address);
      return plainProfile(profile, address);
    })
  );
  return profiles.flatMap((profile) => profile.status === "fulfilled" ? [profile.value] : []);
}

function useLiveAgents() {
  const [agents, setAgents] = useState<LiveAgent[]>([]);
  const [status, setStatus] = useState("Loading live agents...");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const nextAgents = await readAgents();
        if (!cancelled) {
          setAgents(nextAgents);
          setStatus(`Live ${new Date().toLocaleTimeString()}`);
        }
      } catch (error) {
        if (!cancelled) setStatus(error instanceof Error ? error.message : "Could not load agents");
      }
    }
    load();
    const interval = window.setInterval(load, 8000);
    window.addEventListener("focus", load);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", load);
    };
  }, []);

  return { agents, status };
}

export function MemoryMetricGrid({ fallbackAgents = 0, mode = "hero" }: { fallbackAgents?: number; mode?: "hero" | "dashboard" }) {
  const { agents, status } = useLiveAgents();
  const shownAgents = agents.length || fallbackAgents;
  const capabilityCount = useMemo(() => new Set(agents.flatMap((agent) => agent.tags)).size, [agents]);
  const publicAgents = agents.filter((agent) => agent.accessPolicy === 0).length;
  const updates = agents.reduce((total, agent) => total + Number(agent.totalMemoryUpdates || 0), 0);

  if (mode === "dashboard") {
    return (
      <section className="stats flush">
        <div className="stat"><div className="label">Agents</div><div className="metric">{shownAgents}</div></div>
        <div className="stat"><div className="label">Public memory</div><div className="metric">{publicAgents}</div></div>
        <div className="stat"><div className="label">Capabilities</div><div className="metric">{capabilityCount}</div></div>
        <div className="stat"><div className="label">Updates</div><div className="metric">{updates}</div></div>
        <p className="microcopy live-note"><span />{status}</p>
      </section>
    );
  }

  return (
    <>
      <div className="visual-grid">
        <div className="visual-card hot"><span>Agents</span><strong>{shownAgents}</strong></div>
        <div className="visual-card"><span>Capabilities</span><strong>{capabilityCount}</strong></div>
        <div className="visual-card"><span>Public memory</span><strong>{publicAgents}</strong></div>
        <div className="visual-card"><span>Updates</span><strong>{updates}</strong></div>
      </div>
      <p className="microcopy live-note"><span />{status}</p>
    </>
  );
}

export function AgentExplorerClient({ initialAgents = [] }: { initialAgents?: LiveAgent[] }) {
  const { agents, status } = useLiveAgents();
  const shownAgents = agents.length ? agents : initialAgents;

  return (
    <>
      <p className="microcopy live-note"><span />{status}</p>
      <section className="cards xl">
        {shownAgents.length === 0 ? <div className="empty">No agents found yet. Registered agents appear here after the next 0G mainnet read.</div> : null}
        {shownAgents.map((agent) => (
          <article className="tier-card" key={agent.address}>
            <div className="label">{policyName(agent.accessPolicy)} memory</div>
            <h2>{agent.name}</h2>
            {agent.metadata ? <p className="helper-text">{agentDescription(agent.metadata)}</p> : null}
            <div className="tags">{agent.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
            <p>{agent.totalMemoryUpdates} verified updates</p>
            <div className="save-card compact">
              <span>Save agent address</span>
              <strong>{agent.address}</strong>
            </div>
            <div className="save-card compact">
              <span>Save memory root</span>
              <strong>{agent.memoryRootHash}</strong>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
