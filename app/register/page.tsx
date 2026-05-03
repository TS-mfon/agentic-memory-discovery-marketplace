import Link from "next/link";
import { RegisterAgentClient } from "@/components/RegisterAgentClient";

export default function RegisterPage() {
  return (
    <main className="site-shell narrow">
      <nav className="nav"><Link className="brand" href="/">Memory0G</Link><Link href="/explorer">Explorer</Link></nav>
      <section className="page-head">
        <div className="eyebrow">Create Agent Identity</div>
        <h1>Register Agent</h1>
        <p className="microcopy">Register, save address.</p>
      </section>
      <section className="panel focus">
        <RegisterAgentClient />
      </section>
    </main>
  );
}
