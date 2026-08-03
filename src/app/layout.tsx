import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import {
  BRAND_DESCRIPTION,
  BRAND_NAME,
} from "@/lib/brand";
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
  title: `${BRAND_NAME} · 2026 Half-PPR`,
  description: BRAND_DESCRIPTION,
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
            <Link href="/" className="brand brand-lockup">
              <Image
                src="/ff-collective-icon.png"
                alt=""
                width={28}
                height={28}
                className="brand-mark"
                priority
              />
              <span className="brand-text">{BRAND_NAME}</span>
            </Link>
            <Link href="/players">Players</Link>
            <Link href="/compare">Compare</Link>
            <Link href="/teams">Teams</Link>
            <Link href="/explore">Explore</Link>
            <Link href="/help">Help</Link>
            <span className="badge accent" style={{ marginLeft: "auto" }}>
              2026 · ESPN half-PPR
            </span>
          </div>
        </header>
        <main className="shell">{children}</main>
        <Analytics />
      </body>
    </html>
  );
}
