import Link from "next/link";
import { getTeams } from "@/lib/data";
import { fmt } from "@/lib/format";

export default function TeamsIndexPage() {
  const teams = [...getTeams()].sort(
    (a, b) => (a.market.ppg_rk ?? 99) - (b.market.ppg_rk ?? 99),
  );

  return (
    <>
      <h1>Teams</h1>
      <p className="lede">
        Sorted by projected points/game. Open a card for history, projected
        offense, who gets the ball, and inputs you can propose on.
      </p>
      <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>
            <th>PPG rk</th>
            <th>Team</th>
            <th className="right">Proj PPG</th>
            <th className="right">Plays/G</th>
            <th className="right">Pass%</th>
            <th className="right">Board FP</th>
            <th>OC</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((t) => (
            <tr key={t.team}>
              <td className="num">{t.market.ppg_rk ?? "—"}</td>
              <td>
                <Link href={`/teams/${t.team}`}>
                  <strong>{t.team}</strong>
                </Link>
              </td>
              <td className="right num">{fmt(t.market.implied_ppg, 1)}</td>
              <td className="right num">{fmt(t.hub.plays_pg, 1)}</td>
              <td className="right num">{fmt(t.hub.pass_rate, 0)}%</td>
              <td className="right num">{fmt(t.board_fp, 0)}</td>
              <td className="muted">
                {t.staff.oc_name}
                {t.staff.oc_changed ? (
                  <span className="badge warn" style={{ marginLeft: 6 }}>
                    new
                  </span>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  );
}
