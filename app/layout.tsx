import "./styles.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Memory0G",
  description: "Universal agent memory, discovery, and proof roots on 0G.",
  icons: {
    icon: "/icon.svg"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
