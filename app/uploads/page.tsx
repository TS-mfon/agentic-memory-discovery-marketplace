import Link from "next/link";
import { listUploads } from "@/lib/db";

export default async function UploadsPage() {
  const uploads = await listUploads().catch(() => []);
  return (
    <main className="site-shell">
      <nav className="nav"><Link className="brand" href="/">Memory0G</Link><Link href="/memory">Upload Memory</Link></nav>
      <section className="page-head">
        <div className="eyebrow">0G Memory Roots</div>
        <h1>Recent Memory Uploads</h1>
      </section>
      <section className="feed spacious">
        {uploads.length === 0 ? <div className="empty">No memory uploads yet.</div> : null}
        {uploads.map((upload: any, index) => (
          <div className="event" key={String(upload.root_hash ?? upload.rootHash ?? index)}>
            <strong>{String(upload.agent_address ?? upload.agentAddress)}</strong>
            <span className="hash">{String(upload.root_hash ?? upload.rootHash)}</span>
            <span>{String(upload.size_bytes ?? upload.sizeBytes)} bytes</span>
          </div>
        ))}
      </section>
    </main>
  );
}
