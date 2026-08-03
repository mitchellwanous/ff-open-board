import Link from "next/link";
import { RankedStatCell } from "@/components/RankedStatCell";
import { BRAND_CONTRIBUTE_CALLOUT } from "@/lib/brand";
import { getTeams } from "@/lib/data";
import {
  compareNullable,
  nextSortDir,
  parseSortDir,
  sortHref,
  type SortDir,
} from "@/lib/sort";

type TeamSort =
  | "ppg"
  | "team"
  | "pass_yards"
  | "rush_yards"
  | "plays"
  | "board_fp";

export default async function TeamsIndex({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; dir?: string }>;
}) {
  const sp = await searchParams;
  const sort = (
    ["ppg", "team", "pass_yards", "rush_yards", "plays", "board_fp"].includes(
      sp.sort ?? "",
    )
      ? sp.sort
      : "ppg"
  ) as TeamSort;
  const dir = parseSortDir(sp.dir, sort === "team" ? "asc" : "desc");

  const teams = [...getTeams()].sort((a, b) => {
    const av =
      sort === "team"
        ? a.team
        : sort === "board_fp"
          ? a.board_fp
          : sort === "pass_yards"
            ? a.hub.pass_yards
            : sort === "rush_yards"
              ? a.hub.rush_yards
              : sort === "plays"
                ? a.hub.plays_pg
                : a.market.implied_ppg;
    const bv =
      sort === "team"
        ? b.team
        : sort === "board_fp"
          ? b.board_fp
          : sort === "pass_yards"
            ? b.hub.pass_yards
            : sort === "rush_yards"
              ? b.hub.rush_yards
              : sort === "plays"
                ? b.hub.plays_pg
                : b.market.implied_ppg;
    return compareNullable(av, bv, dir);
  });

  function header(key: TeamSort, label: string, right?: boolean) {
    const defaultDir: SortDir = key === "team" ? "asc" : "desc";
    const active = sort === key;
    const next = nextSortDir(sort, key, dir, defaultDir);
    return (
      <th className={right ? "right" : undefined}>
        <Link
          href={sortHref({
            basePath: "/teams",
            params: {},
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
      <h1>Teams</h1>
      <p className="lede">
        Offense strength first: points, pass and rush yards, and pace. Open a
        team to see who gets the ball and how the projection is built.
      </p>
      <div className="callout">{BRAND_CONTRIBUTE_CALLOUT}</div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              {header("team", "Team")}
              {header("ppg", "Proj PPG", true)}
              {header("pass_yards", "Pass yds", true)}
              {header("rush_yards", "Rush yds", true)}
              {header("plays", "Plays/G", true)}
              {header("board_fp", "Player FP total", true)}
              <th />
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t.team}>
                <td>
                  <Link href={`/teams/${t.team}`}>
                    <strong>{t.team}</strong>
                  </Link>
                </td>
                <td className="right">
                  <RankedStatCell
                    value={t.market.implied_ppg}
                    rank={t.market.ppg_rk}
                    digits={1}
                  />
                </td>
                <td className="right">
                  <RankedStatCell
                    value={t.hub.pass_yards}
                    rank={t.hub.pass_rk}
                    digits={null}
                  />
                </td>
                <td className="right">
                  <RankedStatCell
                    value={t.hub.rush_yards}
                    rank={t.hub.rush_rk}
                    digits={null}
                  />
                </td>
                <td className="right">
                  <RankedStatCell
                    value={t.hub.plays_pg}
                    rank={t.hub.plays_rk}
                    digits={1}
                  />
                </td>
                <td className="right">
                  <RankedStatCell
                    value={t.board_fp}
                    rank={t.board_rk}
                    digits={0}
                  />
                </td>
                <td className="right">
                  <Link
                    href={`/teams/${t.team}#suggest`}
                    className="faint"
                    style={{ fontSize: "0.8rem" }}
                  >
                    Contribute
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
