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

export function generateStaticParams() {
  return getTeams().map((t) => ({ team: t.team }));
}

export default async function TeamCardPage({
  params,
}: {
  params: Promise<{ team: string }>;
}) {
  const { team: raw } = await params;
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
        <p className="lede">
          {team.summary.replace(/(\d+)\.0\b/g, "$1")}
        </p>
      ) : null}

      <CommunityOutlook
        grain="team"
        subjectId={team.team}
        subjectLabel={team.team}
        communityNote={team.community_note}
      />

      <h2>0 · Recent history</h2>
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
            <tr key={h.season} className={h.kind === "proj" ? "proj" : undefined}>
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

      <h2>1 · Coaching & market</h2>
      <div className="stat-grid">
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
        <div className="stat">
          <div className="label">Projected points / game</div>
          <div className="value num accent">{fmt(team.market.implied_ppg, 1)}</div>
        </div>
        <div className="stat">
          <div className="label">Vegas win total</div>
          <div className="value num">{fmt(team.market.win_total, 1)}</div>
        </div>
      </div>
      {team.staff.scheme_prior_team ? (
        <p className="muted" style={{ fontSize: "0.85rem" }}>
          Scheme reference team: {team.staff.scheme_prior_team}
        </p>
      ) : null}

      <h2>2 · 2026 projected offense</h2>
      <p className="muted" style={{ fontSize: "0.9rem" }}>
        Projection next to last completed season
        {ly ? ` (${ly.season})` : ""}. Read-only.
      </p>
      <div className="stat-grid">
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
        <div className="stat">
          <div className="label">Pass yards</div>
          <div className="value num">{fmtInt(team.hub.pass_yards)}</div>
          {ly ? (
            <div className="sub">
              {lyLabel} {fmtInt(ly.pass_yards)}
            </div>
          ) : null}
        </div>
        <div className="stat">
          <div className="label">Rush yards</div>
          <div className="value num accent">{fmtInt(team.hub.rush_yards)}</div>
          {ly ? (
            <div className="sub">
              {lyLabel} {fmtInt(ly.rush_yards)}
            </div>
          ) : null}
        </div>
      </div>
      <div className="table-wrap">
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
            <td className="right num faint">{fmtInt(ly?.team_targets ?? null)}</td>
          </tr>
          <tr>
            <td>Designed rush attempts</td>
            <td className="right num">{fmtInt(team.hub.designed_rush_attempts)}</td>
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
            <td>Pressure rate (approx)</td>
            <td className="right num">{fmt(team.hub.pressure_proxy, 1)}%</td>
            <td className="right num faint">
              {ly?.pressure_proxy != null
                ? `${fmt(ly.pressure_proxy, 1)}%`
                : "—"}
            </td>
          </tr>
          <tr>
            <td>Pass yards per attempt</td>
            <td className="right num">{fmt(team.hub.pass_ypa_used, 2)}</td>
            <td className="right num faint">{fmt(ly?.pass_ypa ?? null, 2)}</td>
          </tr>
          <tr>
            <td>Red-zone plays / goal-line rushes</td>
            <td className="right num">
              {fmtInt(team.hub.rz_plays)} / {fmtInt(team.hub.gl_rush_attempts)}
            </td>
            <td className="right num faint">
              {ly
                ? `${fmtInt(ly.rz_plays ?? null)} / ${fmtInt(ly.gl_rush_attempts ?? null)}`
                : "—"}
            </td>
          </tr>
        </tbody>
      </table>
      </div>

      <h2>3 · Team upside / downside range</h2>
      <p className="muted" style={{ fontSize: "0.9rem" }}>
        Multipliers on a strong or soft year vs the base projection (1.05 ≈ +5%).
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
        <div className="stat">
          <div className="label">How set</div>
          <div className="value" style={{ fontSize: "0.85rem" }}>
            {team.scenario.source}
          </div>
        </div>
      </div>

      <h2>4 · Team environment (propose)</h2>
      <ClaimableTable
        grain="team"
        subjectId={team.team}
        subjectLabel={team.team}
        rows={claimRows}
      />

      <h2 id="share-pies">5 · Who gets the ball (share pies)</h2>
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
            <th>Player</th>
            <th>Pos</th>
            <th className="right">Downside</th>
            <th className="right">Base</th>
            <th className="right">Upside</th>
          </tr>
        </thead>
        <tbody>
          {[...players]
            .sort((a, b) => (b.fp.season_fp ?? 0) - (a.fp.season_fp ?? 0))
            .map((p) => (
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
    </>
  );
}
