import Link from "next/link";
import { UploadMemoryClient } from "@/components/UploadMemoryClient";

export default function MemoryPage() {
  return (
    <main className="site-shell narrow">
      <nav className="nav"><Link className="brand" href="/">Memory0G</Link><Link href="/uploads">Memory Uploads</Link></nav>
      <section className="page-head">
        <div className="eyebrow">Upload Agent Memory</div>
        <h1>Upload Memory</h1>
        <p className="microcopy">Store memory, save root.</p>
      </section>
      <section className="panel focus">
        <UploadMemoryClient />
      </section>
    </main>
  );
}
