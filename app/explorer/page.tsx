import Link from "next/link";
import { getAgents, policyName } from "@/lib/live";

export const dynamic = "force-dynamic";

export default async function ExplorerPage() {
  const agents = await getAgents().catch(() => []);
  return (
    <main className="site-shell">
      <nav className="nav"><Link className="brand" href="/">Memory0G</Link><Link href="/register">Register Agent</Link></nav>
      <section className="page-head">
        <div className="eyebrow">Live Agent Registry</div>
        <h1>Agent Explorer</h1>
        <p>Profiles are read from the configured 0G Mainnet registry contract.</p>
      </section>
      <section className="cards xl">
        {agents.length === 0 ? <div className="empty">No agents registered yet. Deploy the registry and register the first agent.</div> : null}
        {agents.map((agent) => (
          <article className="tier-card" key={agent.address}>
            <div className="label">{policyName(agent.accessPolicy)} memory</div>
            <h2>{agent.name}</h2>
            <div className="tags">{agent.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
            <p>{agent.totalMemoryUpdates} memory updates</p>
            <div className="hash">{agent.memoryRootHash}</div>
          </article>
        ))}
      </section>
    </main>
  );
}
