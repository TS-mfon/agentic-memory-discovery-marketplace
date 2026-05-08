import "./styles.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GuardianMesh",
  description: "Agentic transaction firewall using 0G Storage, Compute, Chain, DA, and Agent ID.",
  icons: {
    icon: "/icon.svg"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
