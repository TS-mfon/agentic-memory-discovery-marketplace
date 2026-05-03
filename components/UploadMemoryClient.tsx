"use client";

import { useState } from "react";
import { BrowserProvider } from "ethers";

export function UploadMemoryClient() {
  const [memory, setMemory] = useState("");
  const [status, setStatus] = useState("Upload a memory snapshot for your registered agent.");
  const [root, setRoot] = useState("");

  async function upload() {
    try {
      if (!window.ethereum) throw new Error("Install an EVM wallet.");
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== 16661) throw new Error("Switch wallet to 0G Mainnet chain 16661.");
      const signer = await provider.getSigner();
      const agentAddress = await signer.getAddress();
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
      const message = `0G memory upload authorization agent:${agentAddress.toLowerCase()} ts:${Date.now()}`;
      setStatus("Sign upload authorization...");
      const signature = await signer.signMessage(message);
      const prepared = await fetch("/api/memory/upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agentAddress, message, signature, memory: memoryObject })
      }).then((res) => res.json());
      if (prepared.error) throw new Error(prepared.error);
      setRoot(prepared.upload.rootHash);
      setStatus("Recording memory root on-chain...");
      const sent = await signer.sendTransaction({
        to: prepared.transaction.to,
        value: BigInt(prepared.transaction.value),
        data: prepared.transaction.data
      });
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
