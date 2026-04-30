import Link from "next/link";
import { listEvents } from "@/lib/db";

export default async function ActivityPage() {
  const events = await listEvents().catch(() => []);
  return (
    <main className="site-shell">
      <nav className="nav"><Link className="brand" href="/">Memory0G</Link><Link href="/explorer">Explorer</Link></nav>
      <section className="page-head">
        <div className="eyebrow">On-chain Event Index</div>
        <h1>Contract Activity</h1>
      </section>
      <section className="feed spacious">
        {events.length === 0 ? <div className="empty">No synced events yet. Run `/api/sync` after deployment.</div> : null}
        {events.map((event: any, index) => (
          <div className="event" key={`${event.txHash ?? index}-${event.logIndex ?? index}`}>
            <strong>{String(event.eventName ?? "Event")}</strong>
            <span className="hash">{String(event.txHash ?? "")}</span>
          </div>
        ))}
      </section>
    </main>
  );
}
