import Link from "next/link";
import { getMemoryOverview } from "@/lib/live";
import { MemoryMetricGrid } from "@/components/MemoryLiveClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { agents, uploads } = await getMemoryOverview();
  return (
    <main className="site-shell">
      <nav className="nav"><Link className="brand" href="/">Memory0G</Link><Link href="/activity">Activity</Link></nav>
      <section className="page-head">
        <div className="eyebrow">Operator Console</div>
        <h1>Dashboard</h1>
      </section>
      <MemoryMetricGrid fallbackAgents={agents.length} mode="dashboard" />
      <section className="pitch-grid">
        <Link className="pitch-card link-card" href="/explorer">Agent Explorer</Link>
        <Link className="pitch-card link-card" href="/register">Register Agent</Link>
        <Link className="pitch-card link-card" href="/memory">Upload Memory</Link>
        <Link className="pitch-card link-card" href="/uploads">Recent Uploads ({uploads.length})</Link>
      </section>
    </main>
  );
}
