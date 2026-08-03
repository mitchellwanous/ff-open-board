import Link from "next/link";
import {
  BRAND_CATCHPHRASE,
  BRAND_FORMULA,
  BRAND_NAME,
  BRAND_TAGLINE,
} from "@/lib/brand";

export default function HelpPage() {
  return (
    <>
      <h1>Help</h1>
      <p className="lede">
        <strong>{BRAND_NAME}.</strong> {BRAND_TAGLINE} {BRAND_CATCHPHRASE}
      </p>
      <p className="lede" style={{ marginTop: "0.85rem" }}>
        We&apos;re building half-PPR projections in public. How every player is
        built: <strong>{BRAND_FORMULA}</strong>. If you disagree with an
        input, contribute a better one with a short reason — we review and
        republish so the collective model improves.
      </p>

      <div className="callout">
        Start on <Link href="/">Home</Link> or{" "}
        <Link href="/players">Players</Link>. Read the projection first.
        Contribute only when you disagree with an input.
      </div>

      <h2>What you can contribute</h2>
      <ul className="guide-list">
        <li>
          <strong>Team offense:</strong> how many points / plays, pass rate, how
          hot or cold the offense could run
        </li>
        <li>
          <strong>Player share:</strong> how much of the targets or carries a
          player gets (downside / expected / upside)
        </li>
        <li>
          <strong>Player efficiency:</strong> yards per touch, catch rate, TD
          rates, and similar (depends on position)
        </li>
      </ul>

      <h2>How contributing works</h2>
      <ol className="guide-list">
        <li>Inspect the pieces behind the fantasy total</li>
        <li>Contribute the input you disagree with — and a short reason</li>
        <li>We review and republish; accepted inputs update the board for everyone</li>
      </ol>

      <p className="muted" style={{ marginTop: "1.5rem" }}>
        <Link href="/players" className="btn primary">
          Contribute an input
        </Link>
      </p>
    </>
  );
}
