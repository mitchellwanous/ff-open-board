import Link from "next/link";
import { notFound } from "next/navigation";
import { getRankings } from "@/lib/data";
import { fmt, fmtShare } from "@/lib/format";

export default async function RankingTablePage({
  params,
}: {
  params: Promise<{ stat: string }>;
}) {
  const { stat } = await params;
  const { defs, tables } = getRankings();
  const def = defs.find((d) => d.id === stat);
  const rows = tables[stat];
  if (!def || !rows) notFound();
  const ranking = def;

  const isShare =
    ranking.format === "pct" ||
    ranking.field.includes("share") ||
    ranking.field === "pass_rate";

  function show(v: number) {
    if (ranking.field === "pass_rate") return `${fmt(v, 0)}%`;
    if (isShare && ranking.grain === "player") return fmtShare(v);
    if (ranking.field.includes("rank")) return String(Math.round(v));
    return fmt(v, 1);
  }

  return (
    <>
      <p className="faint" style={{ marginTop: "1.25rem" }}>
        <Link href="/rankings">Rankings</Link> / {ranking.label}
      </p>
      <h1>{ranking.label}</h1>
      <p className="lede">
        {ranking.grain === "team" ? "Team" : "Player"} grain
        {ranking.positions ? ` · ${ranking.positions.join(", ")}` : ""} ·{" "}
        {ranking.higher_is_better ? "higher is better" : "lower is better"}
      </p>
      <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>
            <th>#</th>
            <th>{ranking.grain === "team" ? "Team" : "Player"}</th>
            {ranking.grain === "player" ? <th>Pos</th> : null}
            {ranking.grain === "player" ? <th>Team</th> : null}
            <th className="right">{ranking.label}</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 100).map((r) => (
            <tr key={r.id}>
              <td className="num">{r.rank}</td>
              <td>
                <Link
                  href={
                    ranking.grain === "team"
                      ? `/teams/${r.id}`
                      : r.href || `/players/${r.id}`
                  }
                >
                  <strong>{r.label}</strong>
                </Link>
              </td>
              {ranking.grain === "player" ? <td>{r.position}</td> : null}
              {ranking.grain === "player" ? (
                <td>
                  <Link href={`/teams/${r.team}`}>{r.team}</Link>
                </td>
              ) : null}
              <td className="right num">{show(r.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  );
}
