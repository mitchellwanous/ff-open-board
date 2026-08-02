import Link from "next/link";
import { AppFeedbackButton } from "@/components/AppFeedbackButton";
import { getMeta, getPlayer, getTeam, getTeams } from "@/lib/data";
import { fmt } from "@/lib/format";

const ACHANE_ID = "00-0039040";

export default function HomePage() {
  const meta = getMeta();
  const teams = getTeams();
  const achane = getPlayer(ACHANE_ID);
  const mia = getTeam("MIA");

  return (
    <>
      <h1>Open Board</h1>
      <p className="lede">
        2026 half-PPR projections you can inspect and challenge. Fantasy points
        come from <strong>team offense × player share × efficiency</strong> —
        propose better inputs; we republish daily.
      </p>
      <div className="callout">
        Last updated {meta.exported_on} · {meta.scoring} · {meta.n_players}{" "}
        players
      </div>

      <h2>Find a player</h2>
      <div className="home-actions" style={{ marginBottom: "1rem" }}>
        <Link href="/players" className="btn primary">
          Browse players
        </Link>
        <Link href="/compare" className="btn">
          Compare players
        </Link>
        <Link href="/teams" className="btn">
          Teams
        </Link>
      </div>
      <p className="muted" style={{ fontSize: "0.9rem", marginTop: 0 }}>
        Examples:{" "}
        <Link href={`/players/${ACHANE_ID}`}>De&apos;Von Achane</Link>
        {" · "}
        <Link href="/players/00-0039915">Ladd McConkey</Link>
        {" · "}
        <Link href="/players/00-0038606">Parker Washington</Link>
        {" · "}
        <Link href="/compare?ids=00-0039040,00-0034844,00-0040122">
          Achane vs Saquon vs Jeanty
        </Link>
      </p>

      <h2>How it works (example: Achane / MIA)</h2>
      <p className="muted" style={{ fontSize: "0.9rem" }}>
        One short loop — same structure for every player.
      </p>
      <ol className="how-steps">
        <li>
          <strong>Team offense.</strong> Miami is projected around{" "}
          <Link href="/teams/MIA">
            {fmt(mia?.market.implied_ppg ?? achane?.team_pack.implied_ppg, 1)}{" "}
            points / game
          </Link>{" "}
          (a soft environment already baked in).
        </li>
        <li>
          <strong>Role.</strong> Achane gets about{" "}
          <Link href={`/players/${ACHANE_ID}`}>
            {fmt(achane?.usage.rush_share, 0)}% of the rushes
          </Link>{" "}
          and {fmt(achane?.usage.target_share, 0)}% of the targets (with a
          low–high band if Wright eats or he consolidates).
        </li>
        <li>
          <strong>Efficiency.</strong> Yards per carry / catch and TD rates turn
          that volume into production.
        </li>
        <li>
          <strong>Season fantasy points.</strong> Those three become downside /{" "}
          base / upside — currently about{" "}
          <Link href={`/players/${ACHANE_ID}`}>
            {fmt(achane?.draft.downside_fp, 0)} /{" "}
            {fmt(achane?.fp.season_fp, 0)} /{" "}
            {fmt(achane?.draft.scenario_fp, 0)}
          </Link>{" "}
          (about {achane?.position}
          {achane?.draft.pos_downside_rank} / {achane?.position}
          {achane?.draft.pos_rank} / {achane?.position}
          {achane?.draft.pos_upside_rank} vs the board). FP totals on the card
          are locked.
        </li>
        <li>
          <strong>Community.</strong> Disagree? Propose a better{" "}
          <em>input</em> — MIA points/game, Achane&apos;s shares on the pie, or
          his rates — or leave outlook feedback. Don&apos;t edit the FP total
          directly.
        </li>
        <li>
          <strong>Republish.</strong> Accepted inputs + a distilled outlook
          update the board daily; fantasy points move because the inputs moved.
        </li>
      </ol>
      <p style={{ marginTop: "0.75rem" }}>
        <Link href={`/players/${ACHANE_ID}`} className="btn primary">
          Open Achane&apos;s card
        </Link>{" "}
        <Link href="/teams/MIA" className="btn">
          Open MIA team card
        </Link>{" "}
        <Link href="/help" className="btn">
          How edits work
        </Link>
      </p>

      <div className="home-actions" style={{ marginTop: "1.5rem" }}>
        <AppFeedbackButton />
        <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
          Bugs or UX ideas about the site — not player projections.
        </p>
      </div>

      <h2>All teams</h2>
      <div className="list-grid">
        {teams.map((t) => (
          <Link key={t.team} href={`/teams/${t.team}`} className="list-card">
            <div style={{ fontWeight: 650 }}>{t.team}</div>
            <div className="num muted" style={{ fontSize: "0.85rem" }}>
              {t.market.implied_ppg?.toFixed(1)} PPG
              {t.market.ppg_rk ? ` · #${t.market.ppg_rk}` : ""}
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
