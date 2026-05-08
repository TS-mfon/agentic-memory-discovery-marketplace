"use client";

import { useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import { agentRegistryAbi } from "@shared/index";
import { clientConfig } from "@/lib/config";

declare global {
  interface Window {
    ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };
  }
}

export function RegisterAgentClient() {
  const [name, setName] = useState("Mainnet Memory Scout");
  const [tags, setTags] = useState("0G, Storage, Discovery");
  const [metadata, setMetadata] = useState('{"description":"Autonomous 0G memory agent"}');
  const [accessPolicy, setAccessPolicy] = useState("0");
  const [status, setStatus] = useState("Register an agent profile on 0G Mainnet.");
  const [agentAddress, setAgentAddress] = useState("");
  const [txHash, setTxHash] = useState("");

  async function register() {
    try {
      if (!window.ethereum) throw new Error("Install an EVM wallet.");
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== clientConfig.chainId) {
        throw new Error(`Switch wallet to 0G Mainnet chain ${clientConfig.chainId}.`);
      }
      if (!clientConfig.contractAddress) throw new Error("Contract address is not configured.");
      const capabilityTags = tags.split(",").map((tag) => tag.trim()).filter(Boolean);
      if (capabilityTags.length === 0) throw new Error("Add at least one capability.");
      setStatus("Waiting for wallet signature...");
      const signer = await provider.getSigner();
      const contract = new Contract(clientConfig.contractAddress, agentRegistryAbi, signer);
      const sent = await contract.registerAgent(name.trim(), capabilityTags, metadata.trim(), Number(accessPolicy));
      setTxHash(sent.hash);
      await sent.wait();
      setAgentAddress(await signer.getAddress());
      setStatus("Agent registered. Save its address.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Registration failed");
    }
  }

  return (
    <div className="interactive">
      <p className="microcopy">Create searchable identity.</p>
      <label>Agent name<span>Human-readable name in Explorer.</span><input value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label>Capabilities<span>Comma-separated skills users search for.</span><input value={tags} onChange={(event) => setTags(event.target.value)} /></label>
      <label>Metadata<span>Short JSON description for apps.</span><textarea value={metadata} onChange={(event) => setMetadata(event.target.value)} /></label>
      <label>Access policy<span>Who can read future memory roots.</span><select value={accessPolicy} onChange={(event) => setAccessPolicy(event.target.value)}><option value="0">Public</option><option value="1">Private</option><option value="2">Permissioned</option></select></label>
      <button type="button" onClick={register}>Register Agent On 0G</button>
      <p>{status}</p>
      {agentAddress ? (
        <div className="save-card">
          <span>Save this agent address</span>
          <strong>{agentAddress}</strong>
          <p>Use it to find the profile and verify memory updates later.</p>
        </div>
      ) : null}
      {txHash ? <a className="hash-link" href={`https://chainscan.0g.ai/tx/${txHash}`}>View transaction</a> : null}
    </div>
  );
}
