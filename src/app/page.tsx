import Link from "next/link";
import { AppFeedbackButton } from "@/components/AppFeedbackButton";
import { getMeta, getTeams } from "@/lib/data";

export default function HomePage() {
  const meta = getMeta();
  const teams = getTeams();

  return (
    <>
      <h1>Open Board</h1>
      <p className="lede">
        An open-source fantasy football model, sharpened by community consensus.
        Inspect every input, submit your take with evidence, and we distill the
        sharpest board we can — updated daily.
      </p>
      <div className="callout">
        Last updated {meta.exported_on} · {meta.n_teams} teams ·{" "}
        {meta.n_players} players · republished daily
      </div>
      <div className="home-actions">
        <AppFeedbackButton />
        <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
          Bugs, UX, or ideas about the site itself — not player projections.
        </p>
      </div>

      <div className="stat-grid">
        <div className="stat">
          <div className="label">Season</div>
          <div className="value num">{meta.season}</div>
        </div>
        <div className="stat">
          <div className="label">Scoring</div>
          <div className="value" style={{ fontSize: "1rem" }}>
            {meta.scoring}
          </div>
        </div>
        <div className="stat">
          <div className="label">Status</div>
          <div className="value warn" style={{ fontSize: "1rem" }}>
            Early beta
          </div>
        </div>
      </div>

      <h2>Start here</h2>
      <div className="two-col">
        <Link href="/teams" className="list-card">
          <strong>Team cards</strong>
          <p className="muted" style={{ margin: "0.4rem 0 0", fontSize: "0.9rem" }}>
            Projected offense, history, who gets the ball, and team inputs.
          </p>
        </Link>
        <Link href="/players" className="list-card">
          <strong>Player cards</strong>
          <p className="muted" style={{ margin: "0.4rem 0 0", fontSize: "0.9rem" }}>
            Usage, rates, fantasy points, history, Propose on shares.
          </p>
        </Link>
        <Link href="/rankings" className="list-card">
          <strong>Stat rankings</strong>
          <p className="muted" style={{ margin: "0.4rem 0 0", fontSize: "0.9rem" }}>
            One table per field — then jump to the card to propose.
          </p>
        </Link>
        <Link href="/help" className="list-card">
          <strong>How edits work</strong>
          <p className="muted" style={{ margin: "0.4rem 0 0", fontSize: "0.9rem" }}>
            Short guide: propose numbers, add feedback, and how daily updates
            land on the board.
          </p>
        </Link>
      </div>

      <h2>Teams</h2>
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
