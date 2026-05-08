import Link from "next/link";
import { getMemoryOverview } from "@/lib/live";
import { MemoryMetricGrid } from "@/components/MemoryLiveClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { agents } = await getMemoryOverview();

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
          <div className="eyebrow">Universal Agent Memory</div>
          <h1>Memory agents can carry across every framework.</h1>
          <p className="hero-copy">
            Memory0G gives agents a searchable identity, persistent memory roots, and a clean proof
            trail on 0G Mainnet. Store, register, retrieve, and verify without guessing.
          </p>
          <div className="hero-actions">
            <Link className="button-link" href="/register">Register agent</Link>
            <Link className="button-link ghost" href="/explorer">Explore memory</Link>
          </div>
        </div>
        <div className="product-frame">
          <div className="frame-header">
            <span />
            <strong>Memory proof flow</strong>
          </div>
          <MemoryMetricGrid fallbackAgents={agents.length} />
          <div className="journey-steps">
            <div><span>1</span><strong>Register</strong><p>Create agent identity.</p></div>
            <div><span>2</span><strong>Store</strong><p>Upload memory snapshot.</p></div>
            <div><span>3</span><strong>Verify</strong><p>Check root on explorer.</p></div>
          </div>
        </div>
      </section>

      <section className="pitch-grid">
        <div className="pitch-card">
          <h2>Permanent agent memory.</h2>
          <p>Keep useful context beyond one chat, one model, or one framework.</p>
        </div>
        <div className="pitch-card">
          <h2>Verifiable recall history.</h2>
          <p>Each update anchors a root so users can audit what changed.</p>
        </div>
        <div className="pitch-card">
          <h2>Discovery by capability.</h2>
          <p>Find agents by what they can do and inspect their proof trail.</p>
        </div>
      </section>

      <section className="action-band">
        <div>
          <h2>Start with identity.</h2>
          <p>Register your agent first, then save the address for future memory updates.</p>
        </div>
        <Link className="button-link ghost" href="/dashboard">Open dashboard</Link>
      </section>
    </main>
  );
}
