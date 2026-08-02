import Link from "next/link";
import { getTeams } from "@/lib/data";
import { fmt } from "@/lib/format";
import {
  compareNullable,
  nextSortDir,
  parseSortDir,
  sortHref,
  type SortDir,
} from "@/lib/sort";

type TeamSort = "ppg_rk" | "team" | "ppg" | "plays" | "pass" | "board_fp";

export default async function TeamsIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; dir?: string }>;
}) {
  const sp = await searchParams;
  const sortKeys: TeamSort[] = [
    "ppg_rk",
    "team",
    "ppg",
    "plays",
    "pass",
    "board_fp",
  ];
  const sort = (
    sortKeys.includes(sp.sort as TeamSort) ? sp.sort : "ppg_rk"
  ) as TeamSort;
  const dir = parseSortDir(sp.dir, sort === "team" ? "asc" : "asc");

  const teams = [...getTeams()].sort((a, b) => {
    const av: Record<TeamSort, number | string | null | undefined> = {
      ppg_rk: a.market.ppg_rk,
      team: a.team,
      ppg: a.market.implied_ppg,
      plays: a.hub.plays_pg,
      pass: a.hub.pass_rate,
      board_fp: a.board_fp,
    };
    const bv: Record<TeamSort, number | string | null | undefined> = {
      ppg_rk: b.market.ppg_rk,
      team: b.team,
      ppg: b.market.implied_ppg,
      plays: b.hub.plays_pg,
      pass: b.hub.pass_rate,
      board_fp: b.board_fp,
    };
    // PPG / board FP: higher is "better" — default asc for ppg_rk (rank 1 first),
    // desc for raw PPG and board_fp when user picks those.
    return compareNullable(av[sort], bv[sort], dir);
  });

  function header(
    key: TeamSort,
    label: string,
    opts?: { right?: boolean; defaultDir?: SortDir },
  ) {
    const defaultDir =
      opts?.defaultDir ??
      (key === "ppg" || key === "board_fp" || key === "plays" || key === "pass"
        ? "desc"
        : "asc");
    const active = sort === key;
    const next = nextSortDir(sort, key, dir, defaultDir);
    return (
      <th className={opts?.right ? "right" : undefined}>
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
        Click a column to sort. Open a card for offense strength, who gets the
        ball, and inputs you can propose on.
      </p>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              {header("ppg_rk", "PPG rk")}
              {header("team", "Team")}
              {header("ppg", "Proj PPG", { right: true })}
              {header("plays", "Plays/G", { right: true })}
              {header("pass", "Pass%", { right: true })}
              {header("board_fp", "Board FP", { right: true })}
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
