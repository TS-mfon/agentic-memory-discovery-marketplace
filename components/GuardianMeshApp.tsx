"use client";

import { FormEvent, useMemo, useState } from "react";
import { ContractTransactionResponse, ethers } from "ethers";
import {
  ComputeReview,
  GuardianProfile,
  TxIntent,
  Verdict,
  computeReviewSchema,
  guardianProfileSchema,
  txIntentSchema
} from "@shared/index";
import { clientConfig, isAddressConfigured } from "@/lib/config";
import { submitReviewBlobToDA } from "@/lib/da-client";
import { reviewTransactionWith0GCompute } from "@/lib/compute-client";
import { canonicalJson, hashJson, shortHash } from "@/lib/hash";
import { addressLink, storageLink, txLink } from "@/lib/links";
import { connectWallet, guardianRegistryContract, protectionReceiptContract } from "@/lib/wallet";
import { uploadJsonTo0GFromBrowser } from "@/lib/storage-client";

type StepStatus = "idle" | "running" | "done" | "error";

interface Step {
  label: string;
  status: StepStatus;
  detail: string;
}

interface ProofState {
  agentRoot?: string;
  reportRoot?: string;
  storageTx?: string;
  daCommitment?: string;
  daNote?: string;
  txIntentHash?: string;
  computeHash?: string;
  receiptTx?: string;
  reviewId?: string;
}

const defaultTags = ["defi-risk-review", "wallet-approval-firewall", "agent-memory"];

const exampleCalldata =
  "0x095ea7b30000000000000000000000001234567890123456789012345678901234567890ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

export function GuardianMeshApp() {
  const [wallet, setWallet] = useState("");
  const [agentName, setAgentName] = useState("DeFi Approval Sentinel");
  const [agentTokenId, setAgentTokenId] = useState("101");
  const [tags, setTags] = useState(defaultTags.join(", "));
  const [computeKey, setComputeKey] = useState("");
  const [target, setTarget] = useState("0x1234567890123456789012345678901234567890");
  const [value, setValue] = useState("0");
  const [calldata, setCalldata] = useState(exampleCalldata);
  const [protocol, setProtocol] = useState("ERC20 approval");
  const [notes, setNotes] = useState("Unknown spender requesting unlimited approval.");
  const [review, setReview] = useState<ComputeReview | null>(null);
  const [proof, setProof] = useState<ProofState>({});
  const [steps, setSteps] = useState<Step[]>([
    { label: "Wallet", status: "idle", detail: "Connect a 0G Mainnet wallet." },
    { label: "Agent", status: "idle", detail: "Upload metadata and register guardian." },
    { label: "Compute", status: "idle", detail: "Run 0G Compute transaction review." },
    { label: "Storage", status: "idle", detail: "Upload encrypted review evidence to 0G Storage." },
    { label: "DA", status: "idle", detail: "Submit compact review commitment to 0G DA." },
    { label: "Chain", status: "idle", detail: "Anchor protection receipt on 0G Chain." }
  ]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const contractReady = useMemo(
    () =>
      isAddressConfigured(clientConfig.guardianRegistryAddress) &&
      isAddressConfigured(clientConfig.protectionReceiptAddress),
    []
  );

  function setStep(label: string, status: StepStatus, detail: string) {
    setSteps((current) => current.map((step) => (step.label === label ? { ...step, status, detail } : step)));
  }

  async function connect() {
    setStep("Wallet", "running", "Requesting wallet access and switching to 0G Mainnet.");
    const connected = await connectWallet();
    setWallet(connected.address);
    setStep("Wallet", "done", `Connected ${connected.address}.`);
    return connected;
  }

  function buildProfile(owner: string): GuardianProfile {
    return guardianProfileSchema.parse({
      version: "1.0",
      name: agentName,
      owner,
      agentTokenId,
      tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      systemPrompt:
        "Review EVM transaction intents for unsafe approvals, unknown spenders, dangerous value transfer, calldata ambiguity, proxy risk, and social engineering.",
      policy: {
        blockUnlimitedApprovals: true,
        blockUnknownSpenders: true,
        maxNativeValue: "0.05",
        requireHumanConfirmationAboveRisk: 420
      },
      createdAt: new Date().toISOString()
    });
  }

  function buildIntent(): TxIntent {
    return txIntentSchema.parse({
      chainId: clientConfig.chainId,
      target,
      value,
      calldata,
      protocol,
      notes
    });
  }

  async function registerGuardian(owner: string, signer: ethers.Signer) {
    setStep("Agent", "running", "Uploading guardian metadata to 0G Storage.");
    const profile = buildProfile(owner);
    const uploaded = await uploadJsonTo0GFromBrowser(profile, signer);
    const metadataRoot = ethers.zeroPadValue(uploaded.rootHash as `0x${string}`, 32);
    const capabilityHash = hashJson({ tags: profile.tags, systemPrompt: profile.systemPrompt });
    setProof((current) => ({ ...current, agentRoot: uploaded.rootHash }));

    if (!contractReady) {
      setStep("Agent", "done", "Metadata uploaded. Contract addresses are not configured, so registration is pending deployment.");
      return profile;
    }

    setStep("Agent", "running", "Registering guardian on 0G Chain.");
    const contract = await guardianRegistryContract();
    const tx = (await contract.registerGuardian(
      BigInt(profile.agentTokenId),
      metadataRoot,
      capabilityHash,
      profile.name,
      profile.tags
    )) as ContractTransactionResponse;
    await tx.wait();
    setStep("Agent", "done", `Guardian registered. Tx ${shortHash(tx.hash)}.`);
    return profile;
  }

  async function runReview(profile: GuardianProfile, intent: TxIntent) {
    setStep("Compute", "running", "Calling 0G Compute or local fallback if no browser key was entered.");
    const result = await reviewTransactionWith0GCompute({
      apiKey: computeKey,
      baseUrl: clientConfig.computeBaseUrl,
      model: clientConfig.computeModel,
      guardianName: profile.name,
      policy: canonicalJson(profile.policy),
      txIntent: intent
    });
    const parsed = computeReviewSchema.parse(result);
    setReview(parsed);
    setStep("Compute", "done", `${verdictLabel(parsed.verdict)} with risk ${parsed.riskScore}/1000 via ${parsed.provider}.`);
    return parsed;
  }

  async function storeReport(
    owner: string,
    signer: ethers.Signer,
    profile: GuardianProfile,
    intent: TxIntent,
    computeReview: ComputeReview
  ) {
    setStep("Storage", "running", "Uploading full review report to 0G Storage.");
    const txIntentHash = hashJson(intent);
    const computeHash = hashJson(computeReview);
    const report = {
      version: "1.0",
      reviewId: hashJson({ owner, agentTokenId: profile.agentTokenId, txIntentHash, computeHash }),
      user: owner,
      agentTokenId: profile.agentTokenId,
      txIntentHash,
      computeHash,
      txIntent: intent,
      computeReview,
      createdAt: new Date().toISOString()
    };
    const uploaded = await uploadJsonTo0GFromBrowser(report, signer);
    setProof((current) => ({
      ...current,
      reportRoot: uploaded.rootHash,
      storageTx: uploaded.txHash,
      txIntentHash,
      computeHash,
      reviewId: report.reviewId
    }));
    setStep("Storage", "done", `Report root ${shortHash(uploaded.rootHash)}.`);
    return { report, uploaded, txIntentHash, computeHash };
  }

  async function submitDA(reportRoot: string, txIntentHash: string, computeHash: string, profile: GuardianProfile) {
    setStep("DA", "running", "Submitting compact evidence blob to 0G DA gateway or deterministic fallback.");
    const daBlob = {
      app: "GuardianMesh",
      version: "1.0",
      agentTokenId: profile.agentTokenId,
      txIntentHash,
      reportRoot,
      computeHash,
      timestamp: new Date().toISOString()
    };
    const da = await submitReviewBlobToDA(daBlob);
    setProof((current) => ({ ...current, daCommitment: da.commitment, daNote: da.note }));
    setStep("DA", da.mode === "gateway" ? "done" : "idle", `${shortHash(da.commitment)}. ${da.note}`);
    return da;
  }

  async function anchorReceipt(profile: GuardianProfile, reportRoot: string, txIntentHash: string, computeHash: string, daCommitment: string, computeReview: ComputeReview) {
    if (!contractReady) {
      setStep("Chain", "idle", "Deploy and configure contract addresses to anchor receipts.");
      return;
    }

    setStep("Chain", "running", "Anchoring protection receipt on 0G Chain.");
    const contract = await protectionReceiptContract();
    const tx = (await contract.recordReview(
      BigInt(profile.agentTokenId),
      txIntentHash,
      ethers.zeroPadValue(reportRoot as `0x${string}`, 32),
      daCommitment,
      computeHash,
      computeReview.riskScore,
      computeReview.verdict
    )) as ContractTransactionResponse;
    await tx.wait();
    setProof((current) => ({ ...current, receiptTx: tx.hash }));
    setStep("Chain", "done", `Receipt anchored. Tx ${shortHash(tx.hash)}.`);
  }

  async function handleRun(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const connected = wallet ? await connectWallet() : await connect();
      const profile = await registerGuardian(connected.address, connected.signer);
      const intent = buildIntent();
      const computeReview = await runReview(profile, intent);
      const stored = await storeReport(connected.address, connected.signer, profile, intent, computeReview);
      const da = await submitDA(stored.uploaded.rootHash, stored.txIntentHash, stored.computeHash, profile);
      await anchorReceipt(profile, stored.uploaded.rootHash, stored.txIntentHash, stored.computeHash, da.commitment, computeReview);
      setMessage("GuardianMesh proof flow completed. Any idle step needs deployment configuration or a DA gateway.");
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      setMessage(detail);
      setSteps((current) => current.map((step) => (step.status === "running" ? { ...step, status: "error", detail } : step)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app-shell">
      <nav className="topbar">
        <a className="brand" href="/">GuardianMesh</a>
        <div className="nav-links">
          <a href="#review">Review</a>
          <a href="#proof">Proof</a>
          <a href="/docs">Docs</a>
        </div>
        <button type="button" className="icon-button wide-button" onClick={connect} disabled={busy}>
          {wallet ? shortHash(wallet) : "Connect"}
        </button>
      </nav>

      <section className="workspace">
        <aside className="rail">
          <div className="rail-block">
            <span className="eyebrow">0G Mainnet</span>
            <h1>AI guard agents for verifiable transaction safety.</h1>
            <p>
              Create an Agent ID-linked guardian, run 0G Compute risk analysis, upload the evidence to 0G Storage,
              commit review data through 0G DA, and anchor a receipt on 0G Chain.
            </p>
          </div>

          <div className="module-list">
            {["0G Chain", "0G Storage", "0G Compute", "0G DA", "Agent ID"].map((module) => (
              <div className="module" key={module}>
                <span>{module}</span>
                <strong>Required</strong>
              </div>
            ))}
          </div>
        </aside>

        <form id="review" className="console" onSubmit={handleRun}>
          <section className="tool-section">
            <div className="section-head">
              <span>01</span>
              <h2>Guardian Agent</h2>
            </div>
            <div className="field-grid">
              <label>
                Agent name
                <input value={agentName} onChange={(event) => setAgentName(event.target.value)} />
              </label>
              <label>
                Agent ID token id
                <input value={agentTokenId} onChange={(event) => setAgentTokenId(event.target.value)} />
              </label>
            </div>
            <label>
              Capability tags
              <input value={tags} onChange={(event) => setTags(event.target.value)} />
            </label>
          </section>

          <section className="tool-section">
            <div className="section-head">
              <span>02</span>
              <h2>Transaction Intent</h2>
            </div>
            <div className="field-grid">
              <label>
                Target contract
                <input value={target} onChange={(event) => setTarget(event.target.value)} />
              </label>
              <label>
                Native value
                <input value={value} onChange={(event) => setValue(event.target.value)} />
              </label>
            </div>
            <label>
              Calldata
              <textarea value={calldata} onChange={(event) => setCalldata(event.target.value)} />
            </label>
            <div className="field-grid">
              <label>
                Protocol
                <input value={protocol} onChange={(event) => setProtocol(event.target.value)} />
              </label>
              <label>
                0G Compute API key, kept in browser memory
                <input
                  value={computeKey}
                  onChange={(event) => setComputeKey(event.target.value)}
                  placeholder="app-sk-... optional for local fallback"
                  type="password"
                />
              </label>
            </div>
            <label>
              Notes
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
            </label>
          </section>

          <button type="submit" className="primary-action" disabled={busy}>
            {busy ? "Running proof flow..." : "Review and Anchor"}
          </button>
          {message ? <p className="notice">{message}</p> : null}
        </form>
      </section>

      <section className="results-grid">
        <div className="panel">
          <div className="section-head">
            <span>Flow</span>
            <h2>Execution Status</h2>
          </div>
          <div className="timeline">
            {steps.map((step) => (
              <div className={`step ${step.status}`} key={step.label}>
                <span>{step.label}</span>
                <strong>{step.status}</strong>
                <p>{step.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="section-head">
            <span>AI</span>
            <h2>Risk Review</h2>
          </div>
          {review ? (
            <div className="review-box">
              <div className={`risk ${verdictLabel(review.verdict).toLowerCase()}`}>
                <strong>{review.riskScore}/1000</strong>
                <span>{verdictLabel(review.verdict)}</span>
              </div>
              <p>{review.plainEnglishSummary}</p>
              <ul>
                {review.detectedRisks.map((risk) => <li key={risk}>{risk}</li>)}
              </ul>
              <p className="mono">{review.provider} / {review.model}</p>
            </div>
          ) : (
            <p>Run a review to see 0G Compute output.</p>
          )}
        </div>
      </section>

      <section id="proof" className="proof-grid">
        <ProofItem label="Guardian metadata root" value={proof.agentRoot} href={proof.agentRoot ? storageLink(proof.agentRoot) : undefined} />
        <ProofItem label="Review report root" value={proof.reportRoot} href={proof.reportRoot ? storageLink(proof.reportRoot) : undefined} />
        <ProofItem label="Storage upload tx" value={proof.storageTx} href={proof.storageTx ? txLink(proof.storageTx) : undefined} />
        <ProofItem label="DA commitment" value={proof.daCommitment} />
        <ProofItem label="Tx intent hash" value={proof.txIntentHash} />
        <ProofItem label="Compute hash" value={proof.computeHash} />
        <ProofItem label="Receipt tx" value={proof.receiptTx} href={proof.receiptTx ? txLink(proof.receiptTx) : undefined} />
        <ProofItem label="Guardian registry" value={clientConfig.guardianRegistryAddress} href={isAddressConfigured(clientConfig.guardianRegistryAddress) ? addressLink(clientConfig.guardianRegistryAddress) : undefined} />
        <ProofItem label="Protection receipt" value={clientConfig.protectionReceiptAddress} href={isAddressConfigured(clientConfig.protectionReceiptAddress) ? addressLink(clientConfig.protectionReceiptAddress) : undefined} />
        <ProofItem label="Agent ID contract" value={clientConfig.agentIdContractAddress} href={isAddressConfigured(clientConfig.agentIdContractAddress) ? addressLink(clientConfig.agentIdContractAddress) : undefined} />
      </section>
    </main>
  );
}

function verdictLabel(verdict: Verdict) {
  return verdict === Verdict.ALLOW ? "ALLOW" : verdict === Verdict.WARN ? "WARN" : verdict === Verdict.BLOCK ? "BLOCK" : "UNKNOWN";
}

function ProofItem({ label, value, href }: { label: string; value?: string; href?: string }) {
  return (
    <div className="proof-card">
      <span>{label}</span>
      {href && value ? <a href={href} target="_blank" rel="noreferrer">{shortHash(value, 14)}</a> : <strong>{value ? shortHash(value, 14) : "pending"}</strong>}
    </div>
  );
}
