import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How edits work · Open Board",
  description:
    "How to propose input edits and add feedback on Open Board — numbers, rationale, daily updates.",
};

function Figure({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption: string;
}) {
  return (
    <figure className="guide-figure">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

export default function HelpPage() {
  return (
    <>
      <p className="crumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true"> / </span>
        How edits work
      </p>

      <h1>How edits work</h1>
      <p className="lede">
        Open Board is an open-source fantasy football model. Inspect the inputs,
        submit a better number with a why, and we distill community consensus —
        republished daily.
      </p>

      <div className="callout">
        You edit <strong>inputs</strong> (shares, rates, team pace, ceilings) —
        not locked fantasy-point totals. FP updates when accepted inputs are
        republished.
      </div>

      <h2>Where to start</h2>
      <ul className="guide-list">
        <li>
          <strong>See how the board works</strong> →{" "}
          <Link href="/">Home</Link> (Achane / MIA walkthrough)
        </li>
        <li>
          <strong>Read a player&apos;s outlook first</strong> →{" "}
          <Link href="/players">Players</Link>, then Propose only if you
          disagree with an input
        </li>
        <li>
          <strong>Draft / start-sit side-by-side</strong> →{" "}
          <Link href="/compare">Compare</Link>
        </li>
        <li>
          <strong>Offense environment / who gets the ball</strong> →{" "}
          <Link href="/teams">Teams</Link>
        </li>
        <li>
          <strong>Find an outlier across the league</strong> →{" "}
          <Link href="/rankings">Rankings</Link>, then open the card to propose
        </li>
      </ul>

      <h2>1 · Open a card</h2>
      <p className="guide-p">
        Player cards lead with <strong>season outlook</strong> (downside / base
        / upside) and share bands. History and details come next.{" "}
        <strong>Disagree?</strong> is where Propose and feedback live — after
        you&apos;ve seen the take.
      </p>
      <Figure
        src="/help/01-player-outlook.png"
        alt="Justin Jefferson player card showing community outlook and Add feedback"
        caption="Community outlook is the published why. Use Add feedback for a take without a single number."
      />

      <h2>2 · Find Propose</h2>
      <p className="guide-p">
        Look for <strong>Propose</strong> on efficiency / TD rates and team pace
        fields. Share bands use <strong>Dn / Base / Ceil</strong> on the team
        pie instead.
      </p>
      <Figure
        src="/help/02-propose-table.png"
        alt="Efficiency and TD rates table with Propose buttons on each row"
        caption="Each editable rate row has Propose on the right."
      />

      <h2>3 · Enter your number + why</h2>
      <ol className="guide-steps">
        <li>
          <strong>Your value.</strong> Shares and rates use percent entry (e.g.{" "}
          <span className="num">17.4</span> for 17.4%). Absolute fields match the
          units on the board.
        </li>
        <li>
          <strong>Rationale.</strong> Short and specific — role, scheme, QB,
          history. Evidence beats vibes.
        </li>
        <li>
          <strong>Season scope.</strong> Confirm this is a full-season projection
          with the depth chart mostly healthy — not a short injury spike.
        </li>
        <li>
          <strong>Submit.</strong> You’ll see confirmation right away. Pending
          edits feed the next daily review — they don’t rewrite the live board
          instantly.
        </li>
      </ol>
      <Figure
        src="/help/03-propose-modal.png"
        alt="Propose edit modal with value changed to 67%, rationale, and doctrine checked"
        caption="Change the number from Current, write the why, check season scope, Submit edit."
      />

      <h2>4 · Share pies (joint volume)</h2>
      <p className="guide-p">
        On a <Link href="/teams">team card</Link>, Target / Rush share tables let
        you propose downside, base, and ceiling for named players.{" "}
        <strong>Base</strong> (named + Other) should sum ≈ 100%. Ceilings do not
        — they can’t all hit together. If you raise one player, say who loses.
      </p>
      <Figure
        src="/help/04-team-pie.png"
        alt="MIN target and rush share pies with Dn Base Ceil propose buttons"
        caption="Dn / Base / Ceil per claimant. Watch the base sum check under each pie."
      />

      <h2>5 · What stays locked</h2>
      <p className="guide-p">
        History rows and rolled-up fantasy points are outputs. To move FP,
        change the inputs above — not these totals.
      </p>
      <Figure
        src="/help/06-locked-fp.png"
        alt="Season fantasy points downside base upside with note that FP totals are locked"
        caption="Downside / base / upside FP are locked roll-ups. Propose on rates or the team pie."
      />

      <div className="guide-table-wrap">
        <table className="data guide-table">
          <thead>
            <tr>
              <th>Editable</th>
              <th>Locked (read-only)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Target / rush share (dn · base · ceil)</td>
              <td>History seasons (prior years)</td>
            </tr>
            <tr>
              <td>Catch %, YPT, CAY, YAC, TD rates</td>
              <td>Rolled-up targets / yards / FP totals</td>
            </tr>
            <tr>
              <td>Team PPG, plays/g, pass rate, upside packs</td>
              <td>Market labels used only for orientation</td>
            </tr>
            <tr>
              <td>Add feedback (plain-language why)</td>
              <td>Community outlook text until republish</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>6 · Add feedback (no number)</h2>
      <p className="guide-p">
        Use <strong>Add feedback</strong> when your take isn’t a single field —
        scheme notes, role debates, or what the board is missing. Same inbox as
        Propose; distilled into the published outlook on republish.
      </p>
      <Figure
        src="/help/07-add-feedback.png"
        alt="Add general feedback modal with a written season-long note"
        caption="Broader season take — not a single-stat edit. Use Propose for those."
      />

      <h2>Good vs weak rationale</h2>
      <div className="guide-compare">
        <div className="guide-compare-card good">
          <div className="label">Strong</div>
          <p>
            “Slight catch% bump with Kyler — cleaner ball and fewer uncatchable
            deep misses than last year. Season-long healthy rate, not a spike
            week.”
          </p>
        </div>
        <div className="guide-compare-card weak">
          <div className="label">Weak</div>
          <p>
            “He’s elite / bump it” — no mechanism, no season scope, no evidence.
          </p>
        </div>
      </div>

      <h2>What happens next</h2>
      <ol className="guide-steps">
        <li>
          <strong>Submit</strong> → lands in the review inbox (pending).
        </li>
        <li>
          <strong>Daily review</strong> → accepted signals update pins and the
          published community outlook.
        </li>
        <li>
          <strong>Republish</strong> → “Last updated” moves; the public board
          stays coherent.
        </li>
      </ol>

      <h2>Tips</h2>
      <ul className="guide-list">
        <li>One field, one claim — keep the rationale tied to that input.</li>
        <li>
          Prefer healthy, season-long roles over temporary teammate-out spikes.
        </li>
        <li>On pies, name who gives up volume when you raise a share.</li>
        <li>
          Confidence is optional signal — the rationale does the real work.
        </li>
        <li>
          Homepage <strong>Site feedback</strong> is for the product/UX — bugs
          and ideas about Open Board itself — not player or team projections.
        </li>
      </ul>

      <div className="guide-cta">
        <Link href="/players" className="btn primary">
          Browse players
        </Link>
        <Link href="/teams" className="btn">
          Browse teams
        </Link>
        <Link href="/rankings" className="btn">
          Browse rankings
        </Link>
      </div>
    </>
  );
}
