import Link from "next/link";
import { getMeta, getRankings, getTeams } from "@/lib/data";

export default function HomePage() {
  const meta = getMeta();
  const teams = getTeams();
  const rankings = getRankings();

  return (
    <>
      <h1>Open Board</h1>
      <p className="lede">
        Inspect every team and player input that feeds the 2026 ESPN half-PPR
        model — with history for orientation — then click <strong>Propose</strong>{" "}
        on editable fields to submit an edit. Player boards show downside /
        base / upside season fantasy points.
      </p>
      <div className="callout">
        Freeze {meta.exported_on} · {meta.n_teams} teams · {meta.n_players}{" "}
        players · edit store: <strong>{meta.edit_backend}</strong>
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
          <div className="label">Rank tables</div>
          <div className="value num">{rankings.defs.length}</div>
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
        <div className="list-card">
          <strong>How edits work</strong>
          <p className="muted" style={{ margin: "0.4rem 0 0", fontSize: "0.9rem" }}>
            Open a team or player card → scroll to editable rows → Propose. You
            edit inputs (shares, ceilings, team pace…), not locked FP totals.
          </p>
        </div>
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
