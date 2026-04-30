import Link from "next/link";
import { UploadMemoryClient } from "@/components/UploadMemoryClient";

export default function MemoryPage() {
  return (
    <main className="site-shell narrow">
      <nav className="nav"><Link className="brand" href="/">Memory0G</Link><Link href="/uploads">Memory Uploads</Link></nav>
      <section className="page-head">
        <div className="eyebrow">0G Storage Snapshot</div>
        <h1>Upload Memory</h1>
        <p>Persist a standard memory object to 0G Storage and prepare the `updateMemory` transaction.</p>
      </section>
      <section className="panel focus">
        <UploadMemoryClient />
      </section>
    </main>
  );
}
