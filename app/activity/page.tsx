import Link from "next/link";
import { getContractEvents } from "@/lib/live";

export const dynamic = "force-dynamic";

function eventSummary(name: string) {
  if (name === "AgentRegistered") return "Agent profile created";
  if (name === "MemoryUpdated") return "Memory root updated";
  if (name === "CapabilitiesUpdated") return "Skills were changed";
  if (name === "AccessGranted") return "Memory access shared";
  if (name === "AccessPolicyUpdated") return "Privacy policy changed";
  return "Mainnet registry event";
}

function formatValue(value: unknown): string {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(formatValue).join(", ");
  if (value && typeof value === "object") return JSON.stringify(value);
  return String(value ?? "");
}

function visibleArgs(args: Record<string, unknown>) {
  return Object.entries(args).filter(([key]) => Number.isNaN(Number(key)));
}

export default async function ActivityPage() {
  const events = await getContractEvents().catch(() => []);
  return (
    <main className="site-shell">
      <nav className="nav"><Link className="brand" href="/">Memory0G</Link><Link href="/explorer">Explorer</Link></nav>
      <section className="page-head">
        <div className="eyebrow">Verified Mainnet History</div>
        <h1>Contract Activity</h1>
        <p className="microcopy">Trace every memory proof.</p>
      </section>
      <section className="activity-list">
        {events.length === 0 ? <div className="empty">No events found yet.</div> : null}
        {events.map((event: any, index) => (
          <article className="activity-card" key={`${event.txHash ?? index}-${event.logIndex ?? index}`}>
            <div className="activity-topline">
              <div>
                <span className="activity-type">{String(event.eventName ?? "Event")}</span>
                <h2>{eventSummary(String(event.eventName ?? ""))}</h2>
              </div>
              <span className="pill live">Verified</span>
            </div>
            <dl className="detail-grid">
              {visibleArgs(event.args ?? {}).slice(0, 6).map(([key, value]) => (
                <div key={key}>
                  <dt>{key.replace(/([A-Z])/g, " $1")}</dt>
                  <dd>{formatValue(value)}</dd>
                </div>
              ))}
              <div>
                <dt>Block</dt>
                <dd>{String(event.blockNumber ?? "latest")}</dd>
              </div>
            </dl>
            <a className="hash-link" href={String(event.explorer ?? "#")}>View transaction</a>
          </article>
        ))}
      </section>
    </main>
  );
}
