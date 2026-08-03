import Link from "next/link";
import { ScenarioFpCell } from "@/components/ScenarioFpCell";
import { BRAND_CONTRIBUTE_CALLOUT } from "@/lib/brand";
import { getPlayers } from "@/lib/data";
import {
  compareNullable,
  nextSortDir,
  parseSortDir,
  sortHref,
  type SortDir,
} from "@/lib/sort";

type ListSort = "downside" | "base" | "upside";

export default async function PlayersIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ pos?: string; sort?: string; dir?: string }>;
}) {
  const sp = await searchParams;
  const pos = sp.pos?.toUpperCase();
  let players = getPlayers();
  if (pos && ["QB", "RB", "WR", "TE"].includes(pos)) {
    players = players.filter((p) => p.position === pos);
  }

  const sort = (
    ["downside", "base", "upside"].includes(sp.sort ?? "") ? sp.sort : "base"
  ) as ListSort;
  const dir = parseSortDir(sp.dir, "desc");

  players = [...players].sort((a, b) => {
    const av =
      sort === "downside"
        ? a.draft.downside_fp
        : sort === "upside"
          ? a.draft.scenario_fp
          : a.fp.season_fp;
    const bv =
      sort === "downside"
        ? b.draft.downside_fp
        : sort === "upside"
          ? b.draft.scenario_fp
          : b.fp.season_fp;
    return compareNullable(av, bv, dir);
  });

  function header(key: ListSort, label: string) {
    const defaultDir: SortDir = "desc";
    const active = sort === key;
    const next = nextSortDir(sort, key, dir, defaultDir);
    return (
      <th className="right col-fp">
        <Link
          href={sortHref({
            basePath: "/players",
            params: { pos: pos || undefined },
            sort: key,
            dir: active ? next : defaultDir,
          })}
          className={active ? "sort-active" : "sort-link"}
        >
          {label}
          {active ? (dir === "asc" ? " ↑" : " ↓") : ""}
        </Link>
      </th>
    );
  }

  return (
    <>
      <h1>Players</h1>
      <p className="lede">
        2026 half-PPR fantasy points — downside, expected, and upside. Open a
        name for the pieces behind the number.
      </p>
      <div className="callout">{BRAND_CONTRIBUTE_CALLOUT}</div>

      <div className="pos-filters">
        {["ALL", "QB", "RB", "WR", "TE"].map((p) => {
          const href =
            p === "ALL"
              ? sortHref({
                  basePath: "/players",
                  params: {},
                  sort,
                  dir,
                })
              : sortHref({
                  basePath: "/players",
                  params: { pos: p },
                  sort,
                  dir,
                });
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
        <table className="data players-board">
          <thead>
            <tr>
              <th className="col-rank">#</th>
              <th className="col-player">Player</th>
              <th className="col-pos">Pos</th>
              <th className="col-team">Team</th>
              {header("downside", "Downside")}
              {header("base", "Expected")}
              {header("upside", "Upside")}
              <th className="col-actions" />
            </tr>
          </thead>
          <tbody>
            {players.slice(0, 250).map((p, i) => (
              <tr key={p.player_id}>
                <td className="num col-rank">{i + 1}</td>
                <td className="col-player">
                  <Link href={`/players/${p.player_id}`}>
                    <strong>{p.name}</strong>
                  </Link>
                </td>
                <td className="col-pos">{p.position}</td>
                <td className="col-team">
                  <Link href={`/teams/${p.team}`}>{p.team}</Link>
                </td>
                <td className="right col-fp">
                  <ScenarioFpCell
                    kind="downside"
                    position={p.position}
                    fp={p.draft.downside_fp}
                    rank={p.draft.pos_downside_rank}
                  />
                </td>
                <td className="right col-fp">
                  <ScenarioFpCell
                    kind="expected"
                    position={p.position}
                    fp={p.fp.season_fp}
                    rank={p.draft.pos_rank}
                  />
                </td>
                <td className="right col-fp">
                  <ScenarioFpCell
                    kind="upside"
                    position={p.position}
                    fp={p.draft.scenario_fp}
                    rank={p.draft.pos_upside_rank}
                  />
                </td>
                <td className="col-actions">
                  <div className="row-actions">
                    <Link
                      href={`/players/${p.player_id}#suggest`}
                      className="faint"
                    >
                      Contribute
                    </Link>
                    <Link
                      href={`/compare?ids=${encodeURIComponent(p.player_id)}`}
                      className="faint"
                    >
                      Compare
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
