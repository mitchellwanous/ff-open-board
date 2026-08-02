import Link from "next/link";
import { getPlayers } from "@/lib/data";
import { fmt } from "@/lib/format";

export default async function PlayersIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ pos?: string }>;
}) {
  const sp = await searchParams;
  const pos = sp.pos?.toUpperCase();
  let players = getPlayers();
  if (pos && ["QB", "RB", "WR", "TE"].includes(pos)) {
    players = players.filter((p) => p.position === pos);
  }
  players = [...players].sort(
    (a, b) => (b.fp.season_fp ?? 0) - (a.fp.season_fp ?? 0),
  );

  return (
    <>
      <h1>Players</h1>
      <p className="lede">
        Ordered by base season FP. Columns show downside → base → upside season
        projections. Filter by position, then open a card to propose edits on
        inputs.
      </p>
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1rem" }}>
        {["ALL", "QB", "RB", "WR", "TE"].map((p) => {
          const href = p === "ALL" ? "/players" : `/players?pos=${p}`;
          const active = (p === "ALL" && !pos) || p === pos;
          return (
            <Link
              key={p}
              href={href}
              className={`badge${active ? " accent" : ""}`}
            >
              {p}
            </Link>
          );
        })}
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>#</th>
              <th>Player</th>
              <th>Pos</th>
              <th>Team</th>
              <th className="right">Downside</th>
              <th className="right">Base FP</th>
              <th className="right">Upside</th>
            </tr>
          </thead>
          <tbody>
            {players.slice(0, 200).map((p, i) => (
              <tr key={p.player_id}>
                <td className="num">{i + 1}</td>
                <td>
                  <Link href={`/players/${p.player_id}`}>
                    <strong>{p.name}</strong>
                  </Link>
                </td>
                <td>{p.position}</td>
                <td>
                  <Link href={`/teams/${p.team}`}>{p.team}</Link>
                </td>
                <td className="right num">{fmt(p.draft.downside_fp, 1)}</td>
                <td className="right num">{fmt(p.fp.season_fp, 1)}</td>
                <td className="right num">{fmt(p.draft.scenario_fp, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
