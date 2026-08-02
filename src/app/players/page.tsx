import Link from "next/link";
import { getPlayers } from "@/lib/data";
import { fmt } from "@/lib/format";
import {
  compareNullable,
  nextSortDir,
  parseSortDir,
  sortHref,
  type SortDir,
} from "@/lib/sort";

type PlayerSort =
  | "name"
  | "team"
  | "pos"
  | "downside"
  | "base"
  | "upside"
  | "pos_rank";

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

  const sortKeys: PlayerSort[] = [
    "name",
    "team",
    "pos",
    "downside",
    "base",
    "upside",
    "pos_rank",
  ];
  const sort = (
    sortKeys.includes(sp.sort as PlayerSort) ? sp.sort : "base"
  ) as PlayerSort;
  const dir = parseSortDir(
    sp.dir,
    sort === "name" || sort === "team" || sort === "pos" || sort === "pos_rank"
      ? "asc"
      : "desc",
  );

  players = [...players].sort((a, b) => {
    const av: Record<PlayerSort, number | string | null | undefined> = {
      name: a.name,
      team: a.team,
      pos: a.position,
      downside: a.draft.downside_fp,
      base: a.fp.season_fp,
      upside: a.draft.scenario_fp,
      pos_rank: a.draft.pos_rank,
    };
    const bv: Record<PlayerSort, number | string | null | undefined> = {
      name: b.name,
      team: b.team,
      pos: b.position,
      downside: b.draft.downside_fp,
      base: b.fp.season_fp,
      upside: b.draft.scenario_fp,
      pos_rank: b.draft.pos_rank,
    };
    return compareNullable(av[sort], bv[sort], dir);
  });

  function header(
    key: PlayerSort,
    label: string,
    opts?: { right?: boolean; defaultDir?: SortDir },
  ) {
    const defaultDir =
      opts?.defaultDir ??
      (key === "name" || key === "team" || key === "pos" || key === "pos_rank"
        ? "asc"
        : "desc");
    const active = sort === key;
    const next = nextSortDir(sort, key, dir, defaultDir);
    return (
      <th className={opts?.right ? "right" : undefined}>
        <Link
          href={sortHref({
            basePath: "/players",
            params: { pos: pos && pos !== "ALL" ? pos : undefined },
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
        Click a column to sort. Filter by position, open a card for the full
        outlook, or{" "}
        <Link href="/compare">compare players</Link> side by side.
      </p>
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1rem" }}>
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
        <table className="data">
          <thead>
            <tr>
              <th>#</th>
              {header("name", "Player")}
              {header("pos", "Pos")}
              {header("team", "Team")}
              {pos ? header("pos_rank", "Pos rk", { right: true }) : null}
              {header("downside", "Downside", { right: true })}
              {header("base", "Base FP", { right: true })}
              {header("upside", "Upside", { right: true })}
              <th />
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
                {pos ? (
                  <td className="right num">{p.draft.pos_rank ?? "—"}</td>
                ) : null}
                <td className="right num">{fmt(p.draft.downside_fp, 1)}</td>
                <td className="right num">{fmt(p.fp.season_fp, 1)}</td>
                <td className="right num">{fmt(p.draft.scenario_fp, 1)}</td>
                <td>
                  <Link
                    href={`/compare?ids=${encodeURIComponent(p.player_id)}`}
                    className="faint"
                    style={{ fontSize: "0.8rem" }}
                  >
                    Compare
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
