import { clientConfig } from "@/lib/config";

export default function DocsPage() {
  return (
    <main className="doc-shell">
      <nav className="topbar">
        <a className="brand" href="/">GuardianMesh</a>
        <div className="nav-links">
          <a href="/">Review Console</a>
          <a href="#architecture">Architecture</a>
          <a href="#submission">Submission</a>
        </div>
      </nav>

      <section className="doc-hero">
        <span className="eyebrow">Judge Notes</span>
        <h1>No-backend 0G agentic firewall.</h1>
        <p>
          GuardianMesh runs the product path from the browser: wallet signing, 0G Storage uploads,
          0G Compute inference, DA evidence commitment, and 0G Chain receipt anchoring. Deployment
          scripts are used only for contracts and optional DA client submission.
        </p>
      </section>

      <section id="architecture" className="doc-grid">
        <div className="doc-card">
          <h2>0G Modules</h2>
          <ul>
            <li>0G Chain stores guardian registrations and protection receipts.</li>
            <li>0G Storage stores encrypted agent metadata and full review reports.</li>
            <li>0G Compute reviews transaction intents with an OpenAI-compatible endpoint.</li>
            <li>0G DA stores compact review evidence commitments for availability.</li>
            <li>Agent ID links each guardian to an ownable AI identity token.</li>
          </ul>
        </div>
        <div className="doc-card">
          <h2>Architecture</h2>
          <pre className="mono">{`Browser + Wallet
  -> 0G Storage SDK: metadata/report roots
  -> 0G Compute: risk JSON
  -> 0G DA gateway/script: evidence commitment
  -> 0G Chain: GuardianRegistry + ProtectionReceipt
  -> ChainScan/StorageScan proof page`}</pre>
        </div>
        <div className="doc-card">
          <h2>Configured Addresses</h2>
          <ul>
            <li>Guardian registry: {clientConfig.guardianRegistryAddress || "pending deployment"}</li>
            <li>Protection receipt: {clientConfig.protectionReceiptAddress || "pending deployment"}</li>
            <li>Agent ID: {clientConfig.agentIdContractAddress || "pending configuration"}</li>
            <li>DA gateway: {clientConfig.daGatewayUrl || "local fallback commitment"}</li>
          </ul>
        </div>
        <div id="submission" className="doc-card">
          <h2>Submission Checklist</h2>
          <ol>
            <li>Deploy contracts to 0G mainnet.</li>
            <li>Set Vercel public env vars for contract addresses.</li>
            <li>Run one full review and save ChainScan + StorageScan links.</li>
            <li>Publish X post with #0GHackathon, #BuildOn0G, @0G_labs, @0g_CN, @0g_Eco, @HackQuest_.</li>
          </ol>
        </div>
      </section>
    </main>
  );
}
