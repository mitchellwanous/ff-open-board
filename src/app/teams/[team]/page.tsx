import Link from "next/link";
import { notFound } from "next/navigation";
import { ClaimableTable } from "@/components/ClaimableTable";
import { CommunityOutlook } from "@/components/CommunityOutlook";
import { SharePieEditor } from "@/components/SharePieEditor";
import {
  getClaimableFields,
  getPlayersByTeam,
  getTeam,
  getTeams,
} from "@/lib/data";
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

type RosterSort = "name" | "pos" | "downside" | "base" | "upside";

export default async function TeamCardPage({
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

  const players = getPlayersByTeam(team.team);
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

  const maxPpg = Math.max(...team.hist.map((h) => h.ppg ?? 0), 1);
  const ly = [...team.hist].reverse().find((h) => h.kind === "actual") ?? null;
  const lyLabel = ly ? `LY ${ly.season}` : "Last year";

  const rosterSort = (
    ["name", "pos", "downside", "base", "upside"].includes(sp.sort ?? "")
      ? sp.sort
      : "base"
  ) as RosterSort;
  const rosterDir = parseSortDir(
    sp.dir,
    rosterSort === "name" || rosterSort === "pos" ? "asc" : "desc",
  );
  const rosterBase = `/teams/${team.team}`;
  const rosterSorted = [...players].sort((a, b) => {
    const map: Record<RosterSort, number | string | null | undefined> = {
      name: a.name,
      pos: a.position,
      downside: a.draft.downside_fp,
      base: a.fp.season_fp,
      upside: a.draft.scenario_fp,
    };
    const mapB: Record<RosterSort, number | string | null | undefined> = {
      name: b.name,
      pos: b.position,
      downside: b.draft.downside_fp,
      base: b.fp.season_fp,
      upside: b.draft.scenario_fp,
    };
    return compareNullable(map[rosterSort], mapB[rosterSort], rosterDir);
  });

  function rosterHeader(key: RosterSort, label: string, alignRight?: boolean) {
    const defaultDir: SortDir =
      key === "name" || key === "pos" ? "asc" : "desc";
    const dir = nextSortDir(rosterSort, key, rosterDir, defaultDir);
    const active = rosterSort === key;
    return (
      <th className={alignRight ? "right" : undefined}>
        <Link
          href={sortHref({
            basePath: rosterBase,
            params: {},
            sort: key,
            dir: active ? dir : defaultDir,
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
          Proj PPG #{team.market.ppg_rk} · {fmt(team.market.implied_ppg, 1)}
        </span>
        <span className="badge">Board FP #{team.board_rk}</span>
        {team.staff.oc_changed ? (
          <span className="badge warn">New OC</span>
        ) : null}
        {team.staff.hc_changed ? (
          <span className="badge warn">New HC</span>
        ) : null}
      </div>
      {team.summary ? (
        <p className="lede">{team.summary.replace(/(\d+)\.0\b/g, "$1")}</p>
      ) : null}

      <CommunityOutlook
        grain="team"
        subjectId={team.team}
        subjectLabel={team.team}
        communityNote={team.community_note}
      />

      <h2>Offense snapshot</h2>
      <div className="stat-grid">
        <div className="stat">
          <div className="label">Projected points / game</div>
          <div className="value num accent">
            {fmt(team.market.implied_ppg, 1)}
          </div>
        </div>
        <div className="stat">
          <div className="label">Vegas win total</div>
          <div className="value num">{fmt(team.market.win_total, 1)}</div>
        </div>
        <div className="stat">
          <div className="label">Plays / game</div>
          <div className="value num">{fmt(team.hub.plays_pg, 1)}</div>
          {ly ? (
            <div className="sub">
              {lyLabel} {fmt(ly.plays_pg, 1)}
            </div>
          ) : null}
        </div>
        <div className="stat">
          <div className="label">Pass rate</div>
          <div className="value num">{fmt(team.hub.pass_rate, 0)}%</div>
          {ly ? (
            <div className="sub">
              {lyLabel} {fmt(ly.pass_rate, 0)}%
            </div>
          ) : null}
        </div>
      </div>
      <div className="stat-grid" style={{ marginTop: "0.75rem" }}>
        <div className="stat">
          <div className="label">Pass yards</div>
          <div className="value num">{fmtInt(team.hub.pass_yards)}</div>
        </div>
        <div className="stat">
          <div className="label">Rush yards</div>
          <div className="value num accent">{fmtInt(team.hub.rush_yards)}</div>
        </div>
        <div className="stat">
          <div className="label">Head coach</div>
          <div className="value compact">{team.staff.head_coach}</div>
        </div>
        <div className="stat">
          <div className="label">Offensive coordinator</div>
          <div
            className={`value compact${team.staff.oc_changed ? " warn" : ""}`}
          >
            {team.staff.oc_name}
          </div>
        </div>
      </div>

      <h2 id="share-pies">Who gets the ball</h2>
      <p className="muted" style={{ fontSize: "0.9rem" }}>
        Target and rush shares. Propose low / expected / high on named players
        so the pie stays near 100%.
      </p>
      <div className="two-col">
        <SharePieEditor
          team={team.team}
          pieKind="target"
          title="Target share"
          segs={team.tgt_segs}
          claimable={allClaimable}
        />
        <SharePieEditor
          team={team.team}
          pieKind="rush"
          title="Rush share"
          segs={team.rush_segs}
          claimable={allClaimable}
        />
      </div>

      <h2>Roster on board</h2>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              {rosterHeader("name", "Player")}
              {rosterHeader("pos", "Pos")}
              {rosterHeader("downside", "Downside", true)}
              {rosterHeader("base", "Base", true)}
              {rosterHeader("upside", "Upside", true)}
            </tr>
          </thead>
          <tbody>
            {rosterSorted.map((p) => (
              <tr key={p.player_id}>
                <td>
                  <Link href={`/players/${p.player_id}`}>{p.name}</Link>
                </td>
                <td>{p.position}</td>
                <td className="right num">{fmt(p.draft.downside_fp, 1)}</td>
                <td className="right num">{fmt(p.fp.season_fp, 1)}</td>
                <td className="right num">{fmt(p.draft.scenario_fp, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Recent history</h2>
      <p className="muted" style={{ fontSize: "0.9rem" }}>
        Actual offense 2021–2025 vs 2026 projection. Read-only.
      </p>
      <div className="spark" aria-hidden>
        {team.hist.map((h) => (
          <span
            key={h.season}
            className={h.kind === "proj" ? "proj" : "actual"}
            style={{ height: `${Math.max(8, ((h.ppg ?? 0) / maxPpg) * 100)}%` }}
            title={`${h.season}: ${h.ppg}`}
          />
        ))}
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Season</th>
              <th className="right">PPG</th>
              <th className="right">Plays/G</th>
              <th className="right">Pass%</th>
              <th className="right">Pass yds</th>
              <th className="right">Rush yds</th>
              <th className="right">Targets</th>
            </tr>
          </thead>
          <tbody>
            {team.hist.map((h) => (
              <tr
                key={h.season}
                className={h.kind === "proj" ? "proj" : undefined}
              >
                <td>
                  {h.season}
                  {h.kind === "proj" ? (
                    <span className="badge proj" style={{ marginLeft: 6 }}>
                      proj
                    </span>
                  ) : null}
                </td>
                <td className="right num">{fmt(h.ppg, 1)}</td>
                <td className="right num">{fmt(h.plays_pg, 1)}</td>
                <td className="right num">{fmt(h.pass_rate, 0)}%</td>
                <td className="right num">{fmtInt(h.pass_yards)}</td>
                <td className="right num">{fmtInt(h.rush_yards)}</td>
                <td className="right num">{fmtInt(h.team_targets)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <details className="details-block">
        <summary>More offense detail vs last year</summary>
        <div className="table-wrap" style={{ marginTop: "0.75rem" }}>
          <table className="data tight">
            <thead>
              <tr>
                <th>Stat</th>
                <th className="right">2026</th>
                <th className="right">{ly ? String(ly.season) : "Last year"}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Team targets (season)</td>
                <td className="right num">{fmtInt(team.hub.team_targets)}</td>
                <td className="right num faint">
                  {fmtInt(ly?.team_targets ?? null)}
                </td>
              </tr>
              <tr>
                <td>Designed rush attempts</td>
                <td className="right num">
                  {fmtInt(team.hub.designed_rush_attempts)}
                </td>
                <td className="right num faint">
                  {fmtInt(ly?.designed_rush_attempts ?? null)}
                </td>
              </tr>
              <tr>
                <td>Sack rate</td>
                <td className="right num">{fmt(team.hub.sack_rate, 1)}%</td>
                <td className="right num faint">
                  {ly?.sack_rate != null ? `${fmt(ly.sack_rate, 1)}%` : "—"}
                </td>
              </tr>
              <tr>
                <td>Pass yards per attempt</td>
                <td className="right num">{fmt(team.hub.pass_ypa_used, 2)}</td>
                <td className="right num faint">
                  {fmt(ly?.pass_ypa ?? null, 2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>

      <details className="details-block">
        <summary>Upside / downside offense range</summary>
        <p className="muted" style={{ fontSize: "0.9rem" }}>
          Multipliers on a strong or soft year vs the base projection (1.05 ≈
          +5%).
        </p>
        <div className="stat-grid">
          <div className="stat">
            <div className="label">Play volume</div>
            <div className="value num" style={{ fontSize: "1rem" }}>
              {fmt(team.scenario.vol_dn, 3)}–{fmt(team.scenario.vol_up, 3)}
            </div>
          </div>
          <div className="stat">
            <div className="label">Pass-rate swing</div>
            <div className="value num" style={{ fontSize: "1rem" }}>
              {fmt(team.scenario.pass_tilt_dn, 3)} / +
              {fmt(team.scenario.pass_tilt_up, 3)}
            </div>
          </div>
          <div className="stat">
            <div className="label">Efficiency</div>
            <div className="value num" style={{ fontSize: "1rem" }}>
              {fmt(team.scenario.eff_dn, 3)}–{fmt(team.scenario.eff_up, 3)}
            </div>
          </div>
        </div>
      </details>

      <h2>Disagree with team inputs?</h2>
      <p className="muted" style={{ fontSize: "0.9rem" }}>
        Propose pace, pass rate, or offense strength — not locked player FP
        totals.
      </p>
      <ClaimableTable
        grain="team"
        subjectId={team.team}
        subjectLabel={team.team}
        rows={claimRows}
      />
    </>
  );
}
