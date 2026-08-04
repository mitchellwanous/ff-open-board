"use client";

/**
 * Design v2 — story cards.
 * Full condensed writeup, restructured for hierarchy:
 * Summary lede → Base/Upside cards (big FP anchor + verdict + support) → quiet Limits.
 * FP → rank punches must match Season outlook (passed as props from live board).
 */
export type PlayerMathOutlook = {
  position: string;
  expectedFp: number;
  expectedRank: number | null;
  upsideFp: number;
  upsideRank: number | null;
};

function posRank(position: string, rank: number | null): string {
  if (rank == null) return position;
  return `${position}${rank}`;
}

function wholeFp(fp: number): number {
  return Math.round(fp);
}

export function PlayerMathDesignOptions({
  outlook,
}: {
  outlook: PlayerMathOutlook;
}) {
  const baseRank = posRank(outlook.position, outlook.expectedRank);
  const upsideRank = posRank(outlook.position, outlook.upsideRank);

  return (
    <section className="pm2" aria-label="Projection writeup">
      <div className="pm2-summary">
        <span className="pm2-eyebrow">Summary</span>
        <ul className="pm2-summary-list">
          <li>
            The Rams are projected <strong>25.9 PPG</strong>, 4th-highest
            scoring offense in the NFL.
          </li>
          <li>
            Nacua is already an alpha: about <strong>29% of targets</strong> in
            2023 and again in 2025 (312 half-PPR); we hold him at{" "}
            <strong>27%</strong> with Adams and Ferguson still paid.
          </li>
          <li>
            Upside is mostly finishing holding on that top-5 offense — with only
            a thin reclaim to about <strong>29.5% of targets</strong>.
          </li>
        </ul>
      </div>

      <div className="pm2-cases">
        <article className="pm2-card" aria-label="Base case">
          <div className="pm2-card-top">
            <span className="pm2-eyebrow">Base case</span>
            <span className="badge">{baseRank}</span>
          </div>
          <p className="pm2-fp num">
            {wholeFp(outlook.expectedFp)}
            <span className="pm2-fp-unit"> half-PPR</span>
          </p>
          <p className="pm2-verdict">
            That is the alpha seat — not a WR2 timeshare.
          </p>
          <ul className="pm2-points">
            <li>
              2025: <strong>~29% of targets</strong>, 312 half-PPR in 16 games —
              Adams still took ~20%. 2023 was also ~29%. Ferguson is the
              elevated TE1 at 13%; that is a small haircut off peak, not a new
              hierarchy. We project <strong>27% of targets</strong>.
            </li>
            <li>
              Around Nacua that leaves: Davante Adams (<strong>16%</strong> of
              targets), Terrance Ferguson (<strong>13%</strong>), Kyren
              Williams (8%), Colby Parkinson (6.5%), plus Jordan Whittington
              (4.5%) — then TE depth, WR depth, and RB depth.
            </li>
          </ul>
        </article>

        <article className="pm2-card pm2-card--up" aria-label="Upside case">
          <div className="pm2-card-top">
            <span className="pm2-eyebrow">Upside case</span>
            <span className="badge accent">{upsideRank}</span>
          </div>
          <p className="pm2-fp num accent">
            {wholeFp(outlook.upsideFp)}
            <span className="pm2-fp-unit"> half-PPR</span>
          </p>
          <p className="pm2-verdict">
            That lands about {wholeFp(outlook.upsideFp)} half-PPR → true WR1
            smash territory. The leap is getting back to history, not inventing
            a 31% tier.
          </p>
          <p className="pm2-path-lead">The path is:</p>
          <ol className="pm2-path">
            <li>
              Targets only <strong>27% → 29.5%</strong> from Whittington / WR
              depth / TE crumbs — nothing material from Adams
            </li>
            <li>
              Catch rate, yards per target, and TD rate hold near last year’s
              smash
            </li>
            <li>Los Angeles stays hot on that top-5 scoring line</li>
          </ol>
        </article>
      </div>

      <div className="pm2-limits">
        <span className="pm2-eyebrow">Where upside is limited</span>
        <ul className="pm2-limits-list">
          <li>
            His share is already elite. <strong>~28–29% of targets</strong> is
            about as high as he has gone; we cap him at 29.5%, not a 31% wipe.
          </li>
          <li>
            Adams (up to ~18.5% of targets) and Ferguson (up to ~17%) stay
            paid. There is not another alpha-sized hole above him.
          </li>
          <li>
            The Rams are already 4th in projected scoring. There is less “clear
            the offense” juice here than on a soft Vegas team — the path is
            usage reclaim at the margin, not a new environment.
          </li>
        </ul>
      </div>
    </section>
  );
}
