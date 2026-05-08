"use client";

import { useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import { agentRegistryAbi } from "@shared/index";
import { clientConfig } from "@/lib/config";
import { uploadJsonTo0GFromBrowser } from "@/lib/storage-client";

export function UploadMemoryClient() {
  const [memory, setMemory] = useState("");
  const [status, setStatus] = useState("Upload a memory snapshot for your registered agent.");
  const [root, setRoot] = useState("");

  async function upload() {
    try {
      if (!window.ethereum) throw new Error("Install an EVM wallet.");
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== clientConfig.chainId) {
        throw new Error(`Switch wallet to 0G Mainnet chain ${clientConfig.chainId}.`);
      }
      if (!clientConfig.contractAddress) throw new Error("Contract address is not configured.");
      const signer = await provider.getSigner();
      const agentAddress = await signer.getAddress();
      const contract = new Contract(clientConfig.contractAddress, agentRegistryAbi, signer);
      await contract.getAgentProfile(agentAddress);
      const memoryObject = memory ? JSON.parse(memory) : {
        version: "1.0",
        agentAddress,
        timestamp: Math.floor(Date.now() / 1000),
        snapshotId: crypto.randomUUID(),
        context: { conversationHistory: [], taskLogs: [], learnedPreferences: {} },
        embeddings: { memoryVectors: [], embeddingModel: "" },
        metadata: { source: "web" },
        previousRootHash: "0x0000000000000000000000000000000000000000000000000000000000000000"
      };
      setStatus("Uploading memory to 0G Storage...");
      const uploaded = await uploadJsonTo0GFromBrowser(memoryObject, signer);
      setRoot(uploaded.rootHash);
      setStatus("Recording memory root on-chain...");
      const sent = await contract.updateMemory(uploaded.rootHash);
      await sent.wait();
      setStatus("Memory uploaded and registry pointer updated.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed");
    }
  }

  return (
    <div className="interactive">
      <p className="microcopy">Store memory, prove recall.</p>
      <label>Memory JSON<span>Leave blank to create a valid snapshot.</span><textarea value={memory} onChange={(event) => setMemory(event.target.value)} placeholder="Leave blank to generate a valid snapshot" /></label>
      <button type="button" onClick={upload}>Upload Memory And Update Registry</button>
      <p>{status}</p>
      {root ? (
        <div className="save-card">
          <span>Save this memory root</span>
          <strong>{root}</strong>
          <p>This is the public proof of the memory version your agent stored.</p>
        </div>
      ) : null}
    </div>
  );
}
