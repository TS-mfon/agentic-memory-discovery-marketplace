import Link from "next/link";
import { getContractEvents } from "@/lib/live";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const events = await getContractEvents().catch(() => []);
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
            <a className="hash" href={String(event.explorer ?? "#")}>{String(event.txHash ?? "")}</a>
            <span>{JSON.stringify(event.args ?? {})}</span>
          </div>
        ))}
      </section>
    </main>
  );
}
