import Link from "next/link";
import type { NeedsLookRow } from "@/lib/liveBoard";
import { CONSENSUS_MIN_N } from "@/lib/consensusConstants";

/**
 * Quiet helper strip: open pages that already have a take started.
 * Plain labels only — never field keys.
 */
export function LiveCollectivePanel({
  needsLook,
}: {
  needsLook: NeedsLookRow[];
  /** @deprecated ignored — recent dump was noise */
  recentMoves?: unknown;
}) {
  const waiting = needsLook
    .filter((r) => r.reason === "building")
    .slice(0, 4);

  if (!waiting.length) return null;

  return (
    <section className="home-section" aria-labelledby="help-finish-heading">
      <h2 id="help-finish-heading">Where you can help</h2>
      <p className="muted" style={{ fontSize: "0.9rem", maxWidth: "36rem" }}>
        Someone already left a number on these. Open the page and add your take
        with a short reason. After {CONSENSUS_MIN_N} people contribute on the
        same input, the board uses the middle number.
      </p>
      <ul className="guide-list" style={{ marginTop: "0.75rem" }}>
        {waiting.map((r) => (
          <li key={`${r.grain}-${r.subject_id}-${r.field}`}>
            <Link href={r.href} className="text-link">
              {r.subject_label}
            </Link>
            {" — "}
            {r.field_label}
            <span className="faint">
              {" "}
              ({r.n} of {CONSENSUS_MIN_N} takes)
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
