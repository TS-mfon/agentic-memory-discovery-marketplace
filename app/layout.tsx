import "./styles.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agentic Memory Discovery Marketplace",
  description: "Mainnet 0G registry for agent memory, capabilities, and discovery."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
