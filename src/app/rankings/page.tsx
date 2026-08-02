import Link from "next/link";
import { getRankings } from "@/lib/data";

export default function RankingsIndexPage() {
  const { defs } = getRankings();
  const team = defs.filter((d) => d.grain === "team");
  const player = defs.filter((d) => d.grain === "player");

  return (
    <>
      <h1>Rankings</h1>
      <p className="lede">
        One table per model field. Use rankings to compare; open the card to
        propose an edit.
      </p>
      <h2>Team</h2>
      <div className="list-grid">
        {team.map((d) => (
          <Link key={d.id} href={`/rankings/${d.id}`} className="list-card">
            <strong>{d.label}</strong>
            <div className="faint" style={{ fontSize: "0.8rem", marginTop: 4 }}>
              {d.field}
            </div>
          </Link>
        ))}
      </div>
      <h2>Player</h2>
      <div className="list-grid">
        {player.map((d) => (
          <Link key={d.id} href={`/rankings/${d.id}`} className="list-card">
            <strong>{d.label}</strong>
            <div className="faint" style={{ fontSize: "0.8rem", marginTop: 4 }}>
              {d.field}
              {d.positions ? ` · ${d.positions.join("/")}` : ""}
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
