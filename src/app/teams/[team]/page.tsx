import Link from "next/link";
import { notFound } from "next/navigation";
import { ClaimableTable } from "@/components/ClaimableTable";
import { CommunityOutlook } from "@/components/CommunityOutlook";
import { ScenarioFpCell } from "@/components/ScenarioFpCell";
import { SharePieEditor } from "@/components/SharePieEditor";
import {
  getClaimableFields,
  getPlayersByTeam,
  getTeam,
  getTeams,
} from "@/lib/data";
import { BRAND_TEAM_PIE_INTRO } from "@/lib/brand";
import { fmt, fmtInt } from "@/lib/format";
import {
  compareNullable,
  nextSortDir,
  parseSortDir,
  sortHref,
  type SortDir,
} from "@/lib/sort";

export function generateStaticParams() {
  return getTeams().map((t) => ({ team: t.team }));
}

type RosterSort = "name" | "downside" | "base" | "upside";

export default async function TeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ team: string }>;
  searchParams: Promise<{ sort?: string; dir?: string }>;
}) {
  const { team: raw } = await params;
  const sp = await searchParams;
  const team = getTeam(raw);
  if (!team) notFound();
  const teamAbbr = team.team;

  const players = getPlayersByTeam(teamAbbr);
  const allClaimable = getClaimableFields();
  const claimable = allClaimable.filter(
    (c) => c.grain === "team" && !c.field.includes("other"),
  );
  const claimRows = claimable.map((field) => {
    const passRateShare =
      team.hub.pass_rate == null
        ? null
        : Math.abs(team.hub.pass_rate) > 1.5
          ? team.hub.pass_rate / 100
          : team.hub.pass_rate;
    const officialMap: Record<string, number | null> = {
      implied_ppg: team.market.implied_ppg,
      plays_pg: team.hub.plays_pg,
      pass_rate: passRateShare,
      vol_up: team.scenario.vol_up,
      eff_up: team.scenario.eff_up,
    };
    return { field, official: officialMap[field.field] ?? null };
  });

  const rosterSort = (
    ["name", "downside", "base", "upside"].includes(sp.sort ?? "")
      ? sp.sort
      : "base"
  ) as RosterSort;
  const rosterDir = parseSortDir(
    sp.dir,
    rosterSort === "name" ? "asc" : "desc",
  );
  const rosterSorted = [...players].sort((a, b) => {
    const mapA = {
      name: a.name,
      downside: a.draft.downside_fp,
      base: a.fp.season_fp,
      upside: a.draft.scenario_fp,
    }[rosterSort];
    const mapB = {
      name: b.name,
      downside: b.draft.downside_fp,
      base: b.fp.season_fp,
      upside: b.draft.scenario_fp,
    }[rosterSort];
    return compareNullable(mapA, mapB, rosterDir);
  });

  function rosterHeader(key: RosterSort, label: string, right?: boolean) {
    const defaultDir: SortDir = key === "name" ? "asc" : "desc";
    const active = rosterSort === key;
    const next = nextSortDir(rosterSort, key, rosterDir, defaultDir);
    return (
      <th className={right ? "right" : undefined}>
        <Link
          href={sortHref({
            basePath: `/teams/${teamAbbr}`,
            params: {},
            sort: key,
            dir: active ? next : defaultDir,
          })}
          className={active ? "sort-active" : "sort-link"}
        >
          {label}
          {active ? (rosterDir === "asc" ? " ↑" : " ↓") : ""}
        </Link>
      </th>
    );
  }

  return (
    <>
      <p className="faint" style={{ marginTop: "1.25rem" }}>
        <Link href="/teams">Teams</Link> / {team.team}
      </p>
      <h1>{team.team}</h1>
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
        <span className="badge accent">
          {fmt(team.market.implied_ppg, 1)} PPG
          {team.market.ppg_rk ? ` · #${team.market.ppg_rk}` : ""}
        </span>
        {team.staff.oc_changed ? (
          <span className="badge warn">New OC</span>
        ) : null}
      </div>
      {team.summary ? (
        <p className="lede">{team.summary.replace(/(\d+)\.0\b/g, "$1")}</p>
      ) : null}

      {/* 1 · Team offense */}
      <h2>Team offense</h2>
      <p className="muted" style={{ fontSize: "0.9rem" }}>
        How strong the offense is — the first piece of every player projection.
      </p>
      <div className="stat-grid">
        <div className="stat">
          <div className="label">Projected points / game</div>
          <div className="value num accent">
            {fmt(team.market.implied_ppg, 1)}
          </div>
          {team.market.ppg_rk != null ? (
            <div className="sub">#{team.market.ppg_rk}</div>
          ) : null}
        </div>
        <div className="stat">
          <div className="label">Pass yards</div>
          <div className="value num">{fmtInt(team.hub.pass_yards)}</div>
          {team.hub.pass_rk != null ? (
            <div className="sub">#{team.hub.pass_rk}</div>
          ) : null}
        </div>
        <div className="stat">
          <div className="label">Rush yards</div>
          <div className="value num">{fmtInt(team.hub.rush_yards)}</div>
          {team.hub.rush_rk != null ? (
            <div className="sub">#{team.hub.rush_rk}</div>
          ) : null}
        </div>
        <div className="stat">
          <div className="label">Plays / game</div>
          <div className="value num">{fmt(team.hub.plays_pg, 1)}</div>
          {team.hub.plays_rk != null ? (
            <div className="sub">#{team.hub.plays_rk}</div>
          ) : null}
        </div>
        <div className="stat">
          <div className="label">Pass rate</div>
          <div className="value num">{fmt(team.hub.pass_rate, 0)}%</div>
        </div>
        <div className="stat">
          <div className="label">Vegas win total</div>
          <div className="value num">{fmt(team.market.win_total, 1)}</div>
        </div>
      </div>

      {/* 2 · Player share */}
      <h2 id="share-pies">Who gets the ball</h2>
      <p className="muted" style={{ fontSize: "0.9rem", maxWidth: "40rem" }}>
        {BRAND_TEAM_PIE_INTRO}
      </p>
      <div className="share-stack">
        <SharePieEditor
          team={team.team}
          pieKind="target"
          title="Target share"
          segs={team.tgt_segs}
          claimable={allClaimable}
          playerHrefPrefix="/players"
        />
        <SharePieEditor
          team={team.team}
          pieKind="rush"
          title="Rush share"
          segs={team.rush_segs}
          claimable={allClaimable}
          playerHrefPrefix="/players"
        />
      </div>

      {/* 3 · Fantasy outcomes */}
      <h2>Roster</h2>
      <p className="muted" style={{ fontSize: "0.9rem" }}>
        Fantasy points from team offense + each player&apos;s share and
        efficiency.
      </p>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              {rosterHeader("name", "Player")}
              <th>Pos</th>
              {rosterHeader("downside", "Downside", true)}
              {rosterHeader("base", "Expected", true)}
              {rosterHeader("upside", "Upside", true)}
              <th />
            </tr>
          </thead>
          <tbody>
            {rosterSorted.map((p) => (
              <tr key={p.player_id}>
                <td>
                  <Link href={`/players/${p.player_id}`}>{p.name}</Link>
                </td>
                <td>{p.position}</td>
                <td className="right">
                  <ScenarioFpCell
                    kind="downside"
                    position={p.position}
                    fp={p.draft.downside_fp}
                    rank={p.draft.pos_downside_rank}
                  />
                </td>
                <td className="right">
                  <ScenarioFpCell
                    kind="expected"
                    position={p.position}
                    fp={p.fp.season_fp}
                    rank={p.draft.pos_rank}
                  />
                </td>
                <td className="right">
                  <ScenarioFpCell
                    kind="upside"
                    position={p.position}
                    fp={p.draft.scenario_fp}
                    rank={p.draft.pos_upside_rank}
                  />
                </td>
                <td className="right">
                  <Link
                    href={`/players/${p.player_id}#suggest`}
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

      {/* 4 · Contribute */}
      <CommunityOutlook
        grain="team"
        subjectId={team.team}
        subjectLabel={team.team}
        communityNote={team.community_note}
      />

      <h2 id="suggest">Contribute to team offense</h2>
      <p className="muted" style={{ fontSize: "0.9rem" }}>
        Pace, pass rate, projected PPG, and upside volume/efficiency boosts.
        Contribute with a short reason; we review and republish daily.
      </p>
      <ClaimableTable
        grain="team"
        subjectId={team.team}
        subjectLabel={team.team}
        rows={claimRows}
      />

      <details className="details-block">
        <summary>History &amp; offense detail</summary>
        <div className="table-wrap" style={{ marginTop: "0.75rem" }}>
          <table className="data">
            <thead>
              <tr>
                <th>Season</th>
                <th className="right">PPG</th>
                <th className="right">Plays/G</th>
                <th className="right">Pass%</th>
                <th className="right">Targets</th>
              </tr>
            </thead>
            <tbody>
              {team.hist.map((h) => (
                <tr
                  key={h.season}
                  className={h.kind === "proj" ? "proj" : undefined}
                >
                  <td>{h.season}</td>
                  <td className="right num">{fmt(h.ppg, 1)}</td>
                  <td className="right num">{fmt(h.plays_pg, 1)}</td>
                  <td className="right num">{fmt(h.pass_rate, 0)}%</td>
                  <td className="right num">{fmtInt(h.team_targets)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
