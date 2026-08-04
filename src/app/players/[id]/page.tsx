import Link from "next/link";
import { notFound } from "next/navigation";
import { ClaimableTable } from "@/components/ClaimableTable";
import { CommunityOutlook } from "@/components/CommunityOutlook";
import { EditProjectionBuckets } from "@/components/EditProjectionBuckets";
import {
  PlayerMathCases,
  PlayerMathLimits,
  PlayerMathSummary,
} from "@/components/PlayerMathStory";
import { SubjectChangeLog } from "@/components/SubjectChangeLog";
import type { ShareClaimantRow } from "@/components/TeamShareContributeSheet";
import {
  getClaimableFields,
  getOfficialValue,
  getTeam,
} from "@/lib/data";
import { getLivePlayer, getLivePlayers } from "@/lib/liveBoard";
import { fmt, fmtInt, pointsPerPlay } from "@/lib/format";
import { buildShareHistForSeg } from "@/lib/sharePie";

const SHARE_FIELDS = new Set([
  "target_share_dn",
  "target_share",
  "target_share_ceil",
  "rush_share_dn",
  "rush_share",
  "rush_share_ceil",
]);

const SHARE_LABELS: Record<string, string> = {
  rush_share_dn: "Downside rush share",
  rush_share: "Expected rush share",
  rush_share_ceil: "Upside rush share",
  target_share_dn: "Downside target share",
  target_share: "Expected target share",
  target_share_ceil: "Upside target share",
};

const SHARE_ORDER = [
  "rush_share_dn",
  "rush_share",
  "rush_share_ceil",
  "target_share_dn",
  "target_share",
  "target_share_ceil",
];

const EFF_ORDER_RB = [
  "ypc",
  "rush_td_rate",
  "catch_pct",
  "ypt",
  "cay_per_rec",
  "yac_per_rec",
  "rec_td_rate",
];

export default async function PlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const classicEdit = sp.edit === "classic";
  const p = await getLivePlayer(id);
  if (!p) notFound();
  const team = getTeam(p.team);
  const allClaimable = getClaimableFields();

  const rateRows = allClaimable
    .filter((c) => {
      if (c.grain !== "player") return false;
      if (SHARE_FIELDS.has(c.field)) return false;
      if (c.positions && !c.positions.includes(p.position)) return false;
      return true;
    })
    .map((field) => {
      const liveVal = (p as unknown as Record<string, number | null>)[field.field];
      return {
        field,
        official:
          typeof liveVal === "number"
            ? liveVal
            : getOfficialValue("player", p.player_id, field.field),
      };
    })
    .sort((a, b) => {
      if (p.position !== "RB") return 0;
      const ia = EFF_ORDER_RB.indexOf(a.field.field);
      const ib = EFF_ORDER_RB.indexOf(b.field.field);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });

  const shareRows = allClaimable
    .filter((c) => {
      if (c.grain !== "player") return false;
      if (!SHARE_FIELDS.has(c.field)) return false;
      if (c.positions && !c.positions.includes(p.position)) return false;
      return true;
    })
    .map((field) => {
      const liveVal = (p as unknown as Record<string, number | null>)[field.field];
      return {
        field,
        official:
          typeof liveVal === "number"
            ? liveVal
            : getOfficialValue("player", p.player_id, field.field),
        displayLabel: SHARE_LABELS[field.field],
      };
    })
    .sort(
      (a, b) =>
        SHARE_ORDER.indexOf(a.field.field) - SHARE_ORDER.indexOf(b.field.field),
    );

  const teamRows = allClaimable
    .filter((c) => c.grain === "team" && !c.field.includes("other"))
    .map((field) => {
      const passRateShare =
        team?.hub.pass_rate == null
          ? null
          : Math.abs(team.hub.pass_rate) > 1.5
            ? team.hub.pass_rate / 100
            : team.hub.pass_rate;
      const map: Record<string, number | null | undefined> = {
        implied_ppg: team?.market.implied_ppg,
        points_per_play: pointsPerPlay(
          team?.market.implied_ppg,
          team?.hub.plays_pg,
        ),
        plays_pg: team?.hub.plays_pg,
        pass_rate: passRateShare,
        vol_up: team?.scenario.vol_up,
        eff_up: team?.scenario.eff_up,
      };
      return { field, official: map[field.field] ?? null };
    });

  const showTgt = ["WR", "TE", "RB"].includes(p.position);
  const showRush = ["RB", "QB"].includes(p.position);
  const maxFp = Math.max(...p.hist.map((h) => h.season_fp ?? 0), 1);

  const histActual = p.hist.filter((h) => h.kind === "actual").slice(-3);
  const offenseSnapshot = [
    {
      label: "Proj PPG",
      value: fmt(p.team_pack.implied_ppg, 1) ?? "—",
      sub: team?.market.ppg_rk != null ? `#${team.market.ppg_rk}` : undefined,
      accent: true,
    },
    {
      label: "Points / play",
      value:
        fmt(pointsPerPlay(p.team_pack.implied_ppg, p.team_pack.plays_pg), 3) ??
        "—",
      sub: "PPG ÷ plays",
    },
    {
      label: "Pass yards",
      value: fmtInt(team?.hub.pass_yards),
      sub: team?.hub.pass_rk != null ? `#${team.hub.pass_rk}` : undefined,
    },
    {
      label: "Rush yards",
      value: fmtInt(team?.hub.rush_yards),
      sub: team?.hub.rush_rk != null ? `#${team.hub.rush_rk}` : undefined,
    },
    {
      label: "Plays / G",
      value: fmt(p.team_pack.plays_pg, 1) ?? "—",
      sub: team?.hub.plays_rk != null ? `#${team.hub.plays_rk}` : undefined,
    },
    {
      label: "Pass rate",
      value: `${fmt(p.team_pack.pass_rate, 0)}%`,
    },
  ];

  const shareBands = [
    ...(showRush
      ? [
          {
            group: "Rush share",
            downside: `${fmt(p.usage.rush_share_floor, 0)}%`,
            expected: `${fmt(p.usage.rush_share, 0)}%`,
            upside: `${fmt(p.usage.rush_share_ceil, 0)}%`,
          },
        ]
      : []),
    ...(showTgt
      ? [
          {
            group: "Target share",
            downside: `${fmt(p.usage.target_share_floor, 0)}%`,
            expected: `${fmt(p.usage.target_share, 0)}%`,
            upside: `${fmt(p.usage.target_share_ceil, 0)}%`,
          },
        ]
      : []),
  ];

  const efficiencyGroups = [
    ...(showRush
      ? [
          {
            group: "Rush",
            stats: [
              { label: "Yards / carry", value: fmt(p.rates.ypc, 2) ?? "—" },
              {
                label: "Rush TD rate",
                value: `${fmt(p.rates.rush_td_rate, 1)}%`,
              },
            ],
          },
        ]
      : []),
    ...(showTgt
      ? [
          {
            group: "Receiving",
            stats: [
              { label: "Catch %", value: `${fmt(p.rates.catch_pct, 0)}%` },
              { label: "Yards / target", value: fmt(p.rates.ypt, 2) ?? "—" },
              {
                label: "Rec TD rate",
                value: `${fmt(p.rates.rec_td_rate, 1)}%`,
              },
            ],
          },
        ]
      : []),
    ...(p.position === "QB"
      ? [
          {
            group: "Passing",
            stats: [
              { label: "Pass YPA", value: fmt(p.rates.pass_ypa, 2) ?? "—" },
              {
                label: "Pass TD rate",
                value: `${fmt(p.rates.pass_td_rate, 1)}%`,
              },
              { label: "INT rate", value: `${fmt(p.rates.int_rate, 1)}%` },
            ],
          },
        ]
      : []),
  ];

  const teamHistActual = (team?.hist ?? [])
    .filter((h) => h.kind === "actual")
    .slice(-3);
  const offenseBoard = {
    staffLine: [
      team?.staff.head_coach ? `HC ${team.staff.head_coach}` : null,
      team?.staff.oc_name ? `OC ${team.staff.oc_name}` : null,
      team?.staff.notes === "continuity" ? "continuity" : null,
      team?.staff.oc_changed ? "New OC" : null,
    ]
      .filter(Boolean)
      .join(" · "),
    winTotal: team?.market.win_total ?? null,
    ppgRk: team?.market.ppg_rk ?? null,
    years: teamHistActual.map((h) => h.season),
    histBySeason: Object.fromEntries(
      teamHistActual.map((h) => [
        h.season,
        {
          ppg: h.ppg,
          plays_pg: h.plays_pg,
          pass_rate: h.pass_rate,
          pass_yards: h.pass_yards,
          rush_yards: h.rush_yards,
        },
      ]),
    ),
    projYards: {
      pass_yards: team?.hub.pass_yards ?? null,
      rush_yards: team?.hub.rush_yards ?? null,
    },
    scenario: {
      vol_up: team?.scenario.vol_up ?? null,
      vol_dn: team?.scenario.vol_dn ?? null,
      eff_up: team?.scenario.eff_up ?? null,
      eff_dn: team?.scenario.eff_dn ?? null,
    },
  };

  const shareBoard = {
    years: histActual.map((h) => h.season),
    gamesBySeason: Object.fromEntries(
      histActual.map((h) => [h.season, h.games]),
    ),
    teamBySeason: Object.fromEntries(
      histActual.map((h) => [h.season, h.team]),
    ),
    currentTeam: p.team,
    showRush,
    showTgt,
    histBySeason: Object.fromEntries(
      histActual.map((h) => [
        h.season,
        {
          rush_share: h.rush_share,
          target_share: h.target_share,
        },
      ]),
    ),
  };

  const efficiencyBoard = {
    years: histActual.map((h) => h.season),
    gamesBySeason: Object.fromEntries(
      histActual.map((h) => [h.season, h.games]),
    ),
    showRush,
    showTgt,
    showPass: p.position === "QB",
    histBySeason: Object.fromEntries(
      histActual.map((h) => [
        h.season,
        {
          ypc: h.ypc ?? null,
          rush_td_rate: h.rush_td_rate ?? null,
          catch_pct: h.catch_pct ?? null,
          ypt: h.ypt ?? null,
          rec_td_rate: h.rec_td_rate ?? null,
          pass_ypa: h.pass_ypa ?? null,
          pass_td_rate: h.pass_td_rate ?? null,
          int_rate: h.int_rate ?? null,
        },
      ]),
    ),
  };

  const bucketsHref = `/players/${p.player_id}`;
  const classicHref = `/players/${p.player_id}?edit=classic`;
  const math = p.player_math ?? null;
  const useMathLayout = Boolean(math);

  let targetPie: { years: number[]; rows: ShareClaimantRow[] } | undefined;
  if (useMathLayout && team && ["WR", "TE"].includes(p.position)) {
    const teammates = (await getLivePlayers()).filter((x) => x.team === p.team);
    const playerHist: Record<
      string,
      Array<{
        season: number;
        kind: string;
        team: string | null;
        target_share: number | null;
        rush_share: number | null;
      }>
    > = {};
    const seasonSet = new Set<number>();
    for (const mate of teammates) {
      playerHist[mate.player_id] = (mate.hist ?? []).map((h) => ({
        season: h.season,
        kind: h.kind,
        team: h.team,
        target_share: h.target_share,
        rush_share: h.rush_share,
      }));
      for (const h of mate.hist ?? []) {
        if (h.kind === "actual" && h.team === p.team) seasonSet.add(h.season);
      }
    }
    const pieYears = [...seasonSet].sort((a, b) => a - b).slice(-3);
    const baseDef =
      allClaimable.find((c) => c.field === "target_share") ?? null;
    const dnDef =
      allClaimable.find((c) => c.field === "target_share_dn") ?? null;
    const ceilDef =
      allClaimable.find((c) => c.field === "target_share_ceil") ?? null;
    const depthDef =
      allClaimable.find((c) => c.field === "target_share_other") ?? null;
    const tgtSegs = [...team.tgt_segs].sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "depth" ? 1 : -1;
      return (b.share ?? 0) - (a.share ?? 0);
    });
    targetPie = {
      years: pieYears,
      rows: tgtSegs.map((s) => {
        const key = s.kind === "player" ? s.player_id! : "depth:OTHER";
        return {
          key,
          kind: s.kind,
          playerId: s.player_id,
          name: s.name,
          position: s.position,
          histBySeason: buildShareHistForSeg(
            s,
            "target",
            p.team,
            playerHist,
            pieYears,
          ),
          shareDn: s.share_dn,
          share: s.share,
          shareCeil: s.share_ceil,
          dnField: s.kind === "player" ? dnDef : null,
          baseField: s.kind === "player" ? baseDef : depthDef,
          ceilField: s.kind === "player" ? ceilDef : null,
        };
      }),
    };
  }

  const mathOutlook = {
    position: p.position,
    expectedFp: p.fp.season_fp ?? 0,
    expectedRank: p.draft.pos_rank,
    upsideFp: p.draft.scenario_fp ?? 0,
    upsideRank: p.draft.pos_upside_rank,
  };

  const classicContribute = (
    <>
      <h2 id="suggest">Contribute to this projection</h2>
      <p className="muted" style={{ fontSize: "0.9rem" }}>
        Classic field-by-field inventory.{" "}
        <Link href={bucketsHref} className="text-link">
          Back to guided sheets
        </Link>
      </p>
      <h3 style={{ fontSize: "0.95rem", marginTop: "1.25rem" }}>
        Team offense ({p.team})
      </h3>
      <p className="muted" style={{ fontSize: "0.85rem" }}>
        Includes pace, pass rate, and upside volume/efficiency boosts.
      </p>
      <ClaimableTable
        grain="team"
        subjectId={p.team}
        subjectLabel={p.team}
        rows={teamRows}
      />
      <h3 style={{ fontSize: "0.95rem", marginTop: "1.25rem" }}>
        Player share (team pie)
      </h3>
      <p style={{ marginBottom: "0.5rem" }}>
        <Link href={`/teams/${p.team}#share-pies`} className="btn primary">
          Contribute on {p.team} pie
        </Link>
      </p>
      <ClaimableTable
        grain="player"
        subjectId={p.player_id}
        subjectLabel={p.name}
        rows={shareRows}
      />
      <h3 style={{ fontSize: "0.95rem", marginTop: "1.25rem" }}>
        Efficiency &amp; TD rates
      </h3>
      <ClaimableTable
        grain="player"
        subjectId={p.player_id}
        subjectLabel={p.name}
        rows={rateRows}
      />
    </>
  );

  const bucketsProps = {
    playerId: p.player_id,
    playerName: p.name,
    team: p.team,
    position: p.position,
    offenseRows: teamRows,
    shareRows,
    efficiencyRows: rateRows,
    offenseSnapshot,
    shareBands,
    efficiencyGroups,
    offenseBoard,
    shareBoard,
    efficiencyBoard,
    pieHref: `/teams/${p.team}#share-pies`,
    classicHref,
  };

  return (
    <>
      <p className="faint" style={{ marginTop: "1.25rem" }}>
        <Link href="/players">Players</Link> / {p.name}
      </p>
      <h1 className={useMathLayout ? "pm2-player-name" : undefined}>{p.name}</h1>
      <div
        className={useMathLayout ? "pm2-player-meta" : undefined}
        style={
          useMathLayout
            ? undefined
            : { display: "flex", gap: "0.4rem", flexWrap: "wrap" }
        }
      >
        <span className="badge accent">{p.position}</span>
        <span className="badge">
          <Link href={`/teams/${p.team}`}>{p.team}</Link>
        </span>
        {p.draft.pos_rank != null ? (
          <span className="badge">
            {p.position}
            {p.draft.pos_rank}
          </span>
        ) : null}
        <Link
          href={`/compare?ids=${encodeURIComponent(p.player_id)}`}
          className="badge"
        >
          Compare
        </Link>
      </div>

      {useMathLayout && math ? (
        <>
          <div className="pm2">
            {classicEdit ? null : (
              <div className="pm2-top">
                <PlayerMathSummary summary={math.summary} />
                <EditProjectionBuckets
                  {...bucketsProps}
                  entry="gated"
                  gatedLayout="card"
                  gatedBottomAnchorId="pm2-contribute-bottom"
                  targetPie={targetPie}
                />
              </div>
            )}
            {classicEdit ? (
              <PlayerMathSummary summary={math.summary} />
            ) : null}
            <PlayerMathCases content={math} outlook={mathOutlook} />
            <PlayerMathLimits limits={math.limits} />
            {classicEdit ? null : <div id="pm2-contribute-bottom" />}
          </div>
          {classicEdit ? classicContribute : null}
        </>
      ) : (
        <>
          <CommunityOutlook
            grain="player"
            subjectId={p.player_id}
            subjectLabel={p.name}
            communityNote={p.community_note}
            editHref="#suggest"
          />

          <h2>Season outlook</h2>
          <p className="muted" style={{ fontSize: "0.9rem" }}>
            Half PPR fantasy points from team offense + player share + player
            efficiency. Totals come from those pieces. To change them, contribute
            below.
          </p>
          <div className="stat-grid">
            <div className="stat">
              <div className="label">Downside</div>
              <div className="value num warn">{fmt(p.draft.downside_fp, 1)}</div>
              {p.draft.pos_downside_rank != null ? (
                <div className="sub">
                  {p.position}
                  {p.draft.pos_downside_rank}
                </div>
              ) : null}
            </div>
            <div className="stat">
              <div className="label">Expected</div>
              <div className="value num">{fmt(p.fp.season_fp, 1)}</div>
              {p.draft.pos_rank != null ? (
                <div className="sub">
                  {p.position}
                  {p.draft.pos_rank}
                </div>
              ) : null}
            </div>
            <div className="stat">
              <div className="label">Upside</div>
              <div className="value num accent">
                {fmt(p.draft.scenario_fp, 1)}
              </div>
              {p.draft.pos_upside_rank != null ? (
                <div className="sub">
                  {p.position}
                  {p.draft.pos_upside_rank}
                </div>
              ) : null}
            </div>
            <div className="stat">
              <div className="label">FP / G · games</div>
              <div className="value num" style={{ fontSize: "1rem" }}>
                {fmt(p.fp.fp_per_game, 2)} · {fmt(p.fp.games_played_proj, 1)}
              </div>
            </div>
          </div>
          {(p.draft.downside_blurb ||
            p.draft.base_blurb ||
            p.draft.upside_blurb) && (
            <div className="scenario-blurbs">
              {p.draft.downside_blurb ? (
                <p>
                  <span className="scenario-blurbs__tag warn">Downside</span>
                  {p.draft.downside_blurb}
                </p>
              ) : null}
              {p.draft.base_blurb ? (
                <p>
                  <span className="scenario-blurbs__tag">Expected</span>
                  {p.draft.base_blurb}
                </p>
              ) : null}
              {p.draft.upside_blurb ? (
                <p>
                  <span className="scenario-blurbs__tag accent">Upside</span>
                  {p.draft.upside_blurb}
                </p>
              ) : null}
            </div>
          )}

          {classicEdit ? (
            classicContribute
          ) : (
            <EditProjectionBuckets {...bucketsProps} />
          )}
        </>
      )}

      <h2>Recent history</h2>
      <div className="spark" aria-hidden>
        {p.hist.map((h) => (
          <span
            key={`${h.season}-${h.kind}`}
            className={h.kind === "proj" ? "proj" : "actual"}
            style={{
              height: `${Math.max(8, ((h.season_fp ?? 0) / maxFp) * 100)}%`,
            }}
          />
        ))}
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Season</th>
              <th>Tm</th>
              <th className="right">GP</th>
              <th className="right">Tgt%</th>
              <th className="right">Rush%</th>
              <th className="right">FP</th>
            </tr>
          </thead>
          <tbody>
            {p.hist.map((h) => (
              <tr
                key={`${h.season}-${h.kind}`}
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
                <td>{h.team ?? "—"}</td>
                <td className="right num">{fmt(h.games, 1)}</td>
                <td className="right num">{fmt(h.target_share, 1)}%</td>
                <td className="right num">{fmt(h.rush_share, 1)}%</td>
                <td className="right num">{fmt(h.season_fp, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <details className="details-block">
        <summary>Counting stats (outputs)</summary>
        <div className="stat-grid" style={{ marginTop: "0.75rem" }}>
          {p.position === "RB" ? (
            <>
              <div className="stat">
                <div className="label">Rush att</div>
                <div className="value num">{fmtInt(p.volume.rush_att)}</div>
              </div>
              <div className="stat">
                <div className="label">Rush yards</div>
                <div className="value num">{fmtInt(p.volume.rush_yards)}</div>
              </div>
              <div className="stat">
                <div className="label">Targets</div>
                <div className="value num">{fmtInt(p.volume.targets)}</div>
              </div>
              <div className="stat">
                <div className="label">Receptions</div>
                <div className="value num">{fmtInt(p.volume.receptions)}</div>
              </div>
            </>
          ) : null}
          {["WR", "TE"].includes(p.position) ? (
            <>
              <div className="stat">
                <div className="label">Targets</div>
                <div className="value num">{fmtInt(p.volume.targets)}</div>
              </div>
              <div className="stat">
                <div className="label">Receptions</div>
                <div className="value num">{fmtInt(p.volume.receptions)}</div>
              </div>
              <div className="stat">
                <div className="label">Rec yards</div>
                <div className="value num">{fmtInt(p.volume.rec_yards)}</div>
              </div>
              <div className="stat">
                <div className="label">Rec TDs</div>
                <div className="value num">{fmt(p.volume.rec_tds, 1)}</div>
              </div>
            </>
          ) : null}
          {p.position === "QB" ? (
            <>
              <div className="stat">
                <div className="label">Pass att</div>
                <div className="value num">{fmtInt(p.volume.pass_attempts)}</div>
              </div>
              <div className="stat">
                <div className="label">Pass yards</div>
                <div className="value num">{fmtInt(p.volume.pass_yards)}</div>
              </div>
              <div className="stat">
                <div className="label">Rush att</div>
                <div className="value num">{fmtInt(p.volume.rush_att)}</div>
              </div>
            </>
          ) : null}
        </div>
      </details>

      <SubjectChangeLog
        grain="player"
        subjectId={p.player_id}
        subjectLabel={p.name}
      />
    </>
  );
}
