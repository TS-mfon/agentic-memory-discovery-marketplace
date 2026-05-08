import Link from "next/link";
import { getAgents } from "@/lib/live";
import { AgentExplorerClient } from "@/components/MemoryLiveClient";

export const dynamic = "force-dynamic";

export default async function ExplorerPage() {
  const agents = await getAgents().catch(() => []);
  return (
    <main className="site-shell">
      <nav className="nav"><Link className="brand" href="/">Memory0G</Link><Link href="/register">Register Agent</Link></nav>
      <section className="page-head">
        <div className="eyebrow">Find Memory Agents</div>
        <h1>Agent Explorer</h1>
        <p className="microcopy">Search, inspect, verify.</p>
      </section>
      <AgentExplorerClient initialAgents={agents} />
    </main>
  );
}
