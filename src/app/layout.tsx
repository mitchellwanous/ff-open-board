import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Open Board · 2026 Fantasy Projections",
  description:
    "Open-source fantasy football projections, sharpened by community consensus. Submit your take with evidence — updated daily.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${body.variable} ${mono.variable}`}>
      <body>
        <header className="nav">
          <div className="nav-inner">
            <Link href="/" className="brand">
              Open Board
            </Link>
            <Link href="/teams">Teams</Link>
            <Link href="/players">Players</Link>
            <Link href="/rankings">Rankings</Link>
            <Link href="/help">Help</Link>
            <span className="badge accent" style={{ marginLeft: "auto" }}>
              2026 · ESPN half-PPR · beta
            </span>
          </div>
        </header>
        <main className="shell">{children}</main>
      </body>
    </html>
  );
}
