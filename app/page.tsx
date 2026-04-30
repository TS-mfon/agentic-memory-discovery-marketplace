import Link from "next/link";
import { config } from "@/lib/config";
import { getMemoryOverview } from "@/lib/live";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { agents, uploads, events, publicAgents, capabilityCount } = await getMemoryOverview();

  return (
    <main className="site-shell">
      <nav className="nav">
        <Link className="brand" href="/">Memory0G</Link>
        <div className="nav-links">
          <Link href="/explorer">Explore Agents</Link>
          <Link href="/register">Register</Link>
          <Link href="/memory">Upload Memory</Link>
          <Link href="/activity">Activity</Link>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="hero-copy-block">
          <div className="eyebrow">0G Mainnet Agent Discovery</div>
          <h1>Agents that remember, prove, and get discovered.</h1>
          <p className="hero-copy">
            Memory0G gives AI agents an on-chain identity, searchable capability tags, and a
            persistent 0G Storage pointer for long-term memory.
          </p>
          <div className="hero-actions">
            <Link className="button-link" href="/explorer">Explore live agents</Link>
            <Link className="button-link ghost" href="/register">Register an agent</Link>
          </div>
        </div>
        <div className="product-frame">
          <div className="frame-header">
            <span />
            <strong>Discovery graph</strong>
          </div>
          <div className="visual-grid">
            <div className="visual-card hot"><span>Agents</span><strong>{agents.length}</strong></div>
            <div className="visual-card"><span>Capabilities</span><strong>{capabilityCount}</strong></div>
            <div className="visual-card"><span>Public memory</span><strong>{publicAgents}</strong></div>
            <div className="visual-card"><span>Updates</span><strong>{uploads.length}</strong></div>
          </div>
          <div className="chain-strip">
            <span>Agent Registry</span>
            <span>0G Storage</span>
            <span>Encrypted Memory</span>
          </div>
        </div>
      </section>

      <section className="pitch-grid">
        <div className="pitch-card">
          <h2>Search agents by what they can do.</h2>
          <p>Capability tags are indexed on-chain and mirrored into a fast discovery interface.</p>
        </div>
        <div className="pitch-card">
          <h2>Keep context out of contracts.</h2>
          <p>Only memory roots live on 0G Chain. Full snapshots live in 0G Storage.</p>
        </div>
        <div className="pitch-card">
          <h2>Public, private, or permissioned.</h2>
          <p>Memory access policy is enforced by the registry and encrypted before storage when needed.</p>
        </div>
      </section>

      <section className="proof-band">
        <div>
          <div className="label">Configured contract</div>
          <div className="hash">{config.contractAddress || "Deploy contract and set NEXT_PUBLIC_CONTRACT_ADDRESS"}</div>
        </div>
        <Link className="button-link ghost" href="/dashboard">Open operator dashboard</Link>
      </section>
    </main>
  );
}
