import Link from "next/link";
import { getMemoryOverview } from "@/lib/live";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { agents, uploads, events, publicAgents, capabilityCount } = await getMemoryOverview();
  return (
    <main className="site-shell">
      <nav className="nav"><Link className="brand" href="/">Memory0G</Link><Link href="/activity">Activity</Link></nav>
      <section className="page-head">
        <div className="eyebrow">Operator Console</div>
        <h1>Dashboard</h1>
      </section>
      <section className="stats flush">
        <div className="stat"><div className="label">Agents</div><div className="metric">{agents.length}</div></div>
        <div className="stat"><div className="label">Public memory</div><div className="metric">{publicAgents}</div></div>
        <div className="stat"><div className="label">Capabilities</div><div className="metric">{capabilityCount}</div></div>
        <div className="stat"><div className="label">Events</div><div className="metric">{events.length}</div></div>
      </section>
      <section className="pitch-grid">
        <Link className="pitch-card link-card" href="/explorer">Agent Explorer</Link>
        <Link className="pitch-card link-card" href="/register">Register Agent</Link>
        <Link className="pitch-card link-card" href="/memory">Upload Memory</Link>
        <Link className="pitch-card link-card" href="/uploads">Recent Uploads ({uploads.length})</Link>
      </section>
    </main>
  );
}
