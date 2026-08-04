import Link from "next/link";
import { notFound } from "next/navigation";
import { EditProjectionBuckets } from "@/components/EditProjectionBuckets";
import { PlayerMathDesignOptions } from "@/components/PlayerMathDesignOptions";
import type { ShareClaimantRow } from "@/components/TeamShareContributeSheet";
import {
  getClaimableFields,
  getOfficialValue,
  getTeam,
} from "@/lib/data";
import { getLivePlayer, getLivePlayers } from "@/lib/liveBoard";
import { BRAND_FORMULA } from "@/lib/brand";
import { fmt, fmtInt, pointsPerPlay } from "@/lib/format";
import { buildShareHistForSeg } from "@/lib/sharePie";
import type { PieSegment } from "@/lib/types";

const PUKA_ID = "00-0039075";

/** Share-only pin for the contribute pie demo. Outlook FP/ranks come from live. */
const PIN = {
  targetShare: 0.27,
  targetShareCeil: 0.295,
  targetShareFloor: 0.24,
};

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

const PIN_SHARE_OFFICIAL: Record<string, number> = {
  target_share_dn: PIN.targetShareFloor,
  target_share: PIN.targetShare,
  target_share_ceil: PIN.targetShareCeil,
};

export default async function PlayerMathOptionsMockPage() {
  const p = await getLivePlayer(PUKA_ID);
  if (!p) notFound();
  const team = getTeam(p.team);
  if (!team) notFound();
  const allClaimable = getClaimableFields();
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

  const pinSeg = (s: PieSegment): PieSegment => {
    if (s.player_id !== PUKA_ID) return s;
    return {
      ...s,
      share_dn: PIN.targetShareFloor * 100,
      share: PIN.targetShare * 100,
      share_ceil: PIN.targetShareCeil * 100,
    };
  };

  const tgtSegs = [...team.tgt_segs]
    .map(pinSeg)
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "depth" ? 1 : -1;
      return (b.share ?? 0) - (a.share ?? 0);
    });

  const targetPieRows: ShareClaimantRow[] = tgtSegs.map((s) => {
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
  });

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
      const pinned = PIN_SHARE_OFFICIAL[field.field];
      return {
        field,
        official:
          pinned != null
            ? pinned
            : typeof liveVal === "number"
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
        team.hub.pass_rate == null
          ? null
          : Math.abs(team.hub.pass_rate) > 1.5
            ? team.hub.pass_rate / 100
            : team.hub.pass_rate;
      const map: Record<string, number | null | undefined> = {
        implied_ppg: team.market.implied_ppg,
        points_per_play: pointsPerPlay(
          team.market.implied_ppg,
          team.hub.plays_pg,
        ),
        plays_pg: team.hub.plays_pg,
        pass_rate: passRateShare,
        vol_up: team.scenario.vol_up,
        eff_up: team.scenario.eff_up,
      };
      return { field, official: map[field.field] ?? null };
    });

  const histActual = p.hist.filter((h) => h.kind === "actual").slice(-3);

  const offenseSnapshot = [
    {
      label: "Proj PPG",
      value: fmt(p.team_pack.implied_ppg, 1) ?? "—",
      sub: team.market.ppg_rk != null ? `#${team.market.ppg_rk}` : undefined,
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
      value: fmtInt(team.hub.pass_yards),
      sub: team.hub.pass_rk != null ? `#${team.hub.pass_rk}` : undefined,
    },
    {
      label: "Rush yards",
      value: fmtInt(team.hub.rush_yards),
      sub: team.hub.rush_rk != null ? `#${team.hub.rush_rk}` : undefined,
    },
    {
      label: "Plays / G",
      value: fmt(p.team_pack.plays_pg, 1) ?? "—",
      sub: team.hub.plays_rk != null ? `#${team.hub.plays_rk}` : undefined,
    },
    {
      label: "Pass rate",
      value: `${fmt(p.team_pack.pass_rate, 0)}%`,
    },
  ];

  const shareBands = [
    {
      group: "Target share",
      downside: `${fmt(PIN.targetShareFloor * 100, 0)}%`,
      expected: `${fmt(PIN.targetShare * 100, 0)}%`,
      upside: `${fmt(PIN.targetShareCeil * 100, 0)}%`,
    },
  ];

  const efficiencyGroups = [
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
  ];

  const teamHistActual = (team.hist ?? [])
    .filter((h) => h.kind === "actual")
    .slice(-3);

  const offenseBoard = {
    staffLine: [
      team.staff.head_coach ? `HC ${team.staff.head_coach}` : null,
      team.staff.oc_name ? `OC ${team.staff.oc_name}` : null,
      team.staff.notes === "continuity" ? "continuity" : null,
      team.staff.oc_changed ? "New OC" : null,
    ]
      .filter(Boolean)
      .join(" · "),
    winTotal: team.market.win_total ?? null,
    ppgRk: team.market.ppg_rk ?? null,
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
      pass_yards: team.hub.pass_yards ?? null,
      rush_yards: team.hub.rush_yards ?? null,
    },
    scenario: {
      vol_up: team.scenario.vol_up ?? null,
      vol_dn: team.scenario.vol_dn ?? null,
      eff_up: team.scenario.eff_up ?? null,
      eff_dn: team.scenario.eff_dn ?? null,
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
    showRush: false,
    showTgt: true,
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
    showRush: false,
    showTgt: true,
    showPass: false,
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

  const liveHref = `/players/${p.player_id}`;

  return (
    <>
      <p className="faint" style={{ marginTop: "1.25rem" }}>
        <Link href="/">Home</Link> / mockups / player math
      </p>

      <div className="callout" style={{ marginTop: "0.85rem" }}>
        <strong>Design v2 — story cards.</strong> Summary lede, Base/Upside
        cards anchored by the FP numbers, quiet Limits footer. Full writeup
        kept; outlook FP/ranks from live board.
      </div>

      <p className="faint" style={{ marginTop: "1.25rem" }}>
        <Link href="/players">Players</Link> / {p.name}
      </p>
      <h1>{p.name}</h1>
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
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
      </div>

      <h2>Season outlook</h2>
      <p className="muted" style={{ fontSize: "0.9rem" }}>
        Half PPR fantasy points from {BRAND_FORMULA}.
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
          <div className="value num accent">{fmt(p.draft.scenario_fp, 1)}</div>
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

      <PlayerMathDesignOptions
        outlook={{
          position: p.position,
          expectedFp: p.fp.season_fp ?? 0,
          expectedRank: p.draft.pos_rank,
          upsideFp: p.draft.scenario_fp ?? 0,
          upsideRank: p.draft.pos_upside_rank,
        }}
      />

      <EditProjectionBuckets
        entry="gated"
        playerId={p.player_id}
        playerName={p.name}
        team={p.team}
        position={p.position}
        offenseRows={teamRows}
        shareRows={shareRows}
        efficiencyRows={rateRows}
        offenseSnapshot={offenseSnapshot}
        shareBands={shareBands}
        efficiencyGroups={efficiencyGroups}
        offenseBoard={offenseBoard}
        shareBoard={shareBoard}
        efficiencyBoard={efficiencyBoard}
        pieHref={`/teams/${p.team}#share-pies`}
        classicHref={`${liveHref}?edit=classic`}
        targetPie={{ years: pieYears, rows: targetPieRows }}
      />
    </>
  );
}
