import Link from "next/link";
import { AppFeedbackButton } from "@/components/AppFeedbackButton";
import { LiveCollectivePanel } from "@/components/LiveCollectivePanel";
import {
  BRAND_CATCHPHRASE,
  BRAND_FORMULA,
  BRAND_NAME,
  BRAND_TAGLINE,
} from "@/lib/brand";
import { getMeta, getTeam } from "@/lib/data";
import { buildLiveBoard } from "@/lib/liveBoard";
import { fmt, fmtInt } from "@/lib/format";

const ACHANE_ID = "00-0039040";

export default async function HomePage() {
  const meta = getMeta();
  const board = await buildLiveBoard();
  const achane = board.players.find((p) => p.player_id === ACHANE_ID);
  const mia = getTeam("MIA");
  const pos = achane?.position ?? "RB";

  return (
    <>
      <p className="brand-kicker">{BRAND_TAGLINE}</p>
      <h1>{BRAND_NAME}</h1>
      <p className="lede">
        <strong>{BRAND_CATCHPHRASE}</strong>
      </p>
      <p className="lede" style={{ marginTop: "0.85rem" }}>
        We&apos;re building the best half-PPR projections in public. Anyone can
        contribute a better input with a short reason — the board gets sharper
        together.
      </p>
      <p className="lede" style={{ marginTop: "0.75rem" }}>
        How every player is built: <strong>{BRAND_FORMULA}</strong>. This site
        lays out those pieces for 2026. If you disagree with an input, contribute a
        better one with a short reason.
      </p>
      <div className="callout">
        Updated {meta.exported_on} · {meta.n_players} players · half PPR
      </div>

      <section className="home-section">
        <h2>Contribute to the model</h2>
        <div className="panel home-contribute">
          <p className="home-contribute__lead">
            You&apos;re not filing a ticket — you&apos;re feeding the collective
            model. After 3 people contribute on the same input, the board uses
            the middle number. We still reject spam.
          </p>
          <ol className="home-loop">
            <li>
              <strong>Inspect the pieces</strong> — team offense, player share,
              player efficiency behind every fantasy total.
            </li>
            <li>
              <strong>Contribute an input</strong> — change what you disagree
              with and leave a short reason.
            </li>
            <li>
              <strong>The board updates</strong> — after 3 takes on an input,
              fantasy points move for everyone; we audit for spam.
            </li>
          </ol>
          <div className="home-actions" style={{ margin: "1.1rem 0 0" }}>
            <Link href="/players" className="btn primary">
              Contribute an input
            </Link>
            <Link href="/help" className="btn">
              How contributing works
            </Link>
          </div>
        </div>
      </section>

      <section className="home-section">
        <h2>Use the board</h2>
        <div className="home-do home-do--secondary">
          <div className="home-do__item">
            <Link href="/players" className="btn">
              Browse players
            </Link>
            <p>
              See projected fantasy points for every player: a downside, our
              expected call, and an upside.
            </p>
          </div>
          <div className="home-do__item">
            <Link href="/compare" className="btn">
              Compare players
            </Link>
            <p>
              Put players side by side when you are deciding who to draft or
              start.
            </p>
          </div>
          <div className="home-do__item">
            <Link href="/teams" className="btn">
              Browse teams
            </Link>
            <p>
              See how strong an offense is and who gets the ball on each roster.
            </p>
          </div>
        </div>
      </section>

      <section className="home-section">
        <h2>Example</h2>
        <div className="panel home-example">
          <p className="home-example__lead">
            <Link href={`/players/${ACHANE_ID}`}>
              <strong>De&apos;Von Achane</strong>
            </Link>{" "}
            projects as{" "}
            <strong>
              {pos}
              {achane?.draft.pos_rank}
            </strong>{" "}
            ({fmt(achane?.fp.season_fp, 0)} expected fantasy points). Here is how
            that is built:
          </p>
          <ul className="guide-list">
            <li>
              <strong>Team offense:</strong> Miami at{" "}
              {fmt(achane?.team_pack.implied_ppg, 1)} points per game,{" "}
              {fmtInt(mia?.hub.pass_yards)} pass yards, and{" "}
              {fmtInt(mia?.hub.rush_yards)} rush yards
            </li>
            <li>
              <strong>Player share:</strong>{" "}
              {fmt(achane?.usage.rush_share, 0)}% of the rushes and{" "}
              {fmt(achane?.usage.target_share, 0)}% of the targets
            </li>
            <li>
              <strong>Player efficiency:</strong> {fmt(achane?.rates.ypc, 1)}{" "}
              yards per carry, {fmt(achane?.rates.ypt, 1)} yards per target,{" "}
              {fmt(achane?.rates.rush_td_rate, 1)}% rush TD rate,{" "}
              {fmt(achane?.rates.rec_td_rate, 1)}% receiving TD rate
            </li>
            <li>
              <strong>Fantasy points:</strong>{" "}
              {fmt(achane?.draft.downside_fp, 0)} downside ({pos}
              {achane?.draft.pos_downside_rank}) / {fmt(achane?.fp.season_fp, 0)}{" "}
              expected ({pos}
              {achane?.draft.pos_rank}) / {fmt(achane?.draft.scenario_fp, 0)}{" "}
              upside ({pos}
              {achane?.draft.pos_upside_rank})
            </li>
          </ul>
          <p className="muted home-example__why">
            Soft team offense + large rush and receiving roles + steady
            production when he gets the ball = that {pos}
            {achane?.draft.pos_rank} projection. Every one of those numbers is
            an input the collective can improve.
          </p>
          <div className="home-actions" style={{ margin: "1rem 0 0" }}>
            <Link
              href={`/players/${ACHANE_ID}#suggest`}
              className="btn primary"
            >
              Check Achane and contribute
            </Link>
            <Link
              href="/compare?ids=00-0039040,00-0034844,00-0040122"
              className="btn"
            >
              Compare to Saquon and Jeanty
            </Link>
          </div>
        </div>
      </section>

      <LiveCollectivePanel needsLook={board.needsLook} />

      <footer className="home-footer">
        <AppFeedbackButton />
        <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
          Bugs or UX ideas about the site — not player projections.{" "}
          <Link href="/help" className="text-link">
            How contributing works
          </Link>
        </p>
      </footer>
    </>
  );
}
