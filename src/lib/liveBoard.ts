/**
 * Live collective board: freeze seed ⊕ consensus → hybrid pie renorm →
 * identity FP scale + ranks.
 *
 * Doctrine (locked):
 * - Expected moves at CONSENSUS_MIN_N (live unlock).
 * - Base share unlocks hybrid-renorm the team pie (same-pos → Other → rest).
 * - Rates unlock without pie renorm; FP recomputes from identity ratio.
 */

import {
  consensusMapForSubject,
  type ConsensusPoint,
} from "./consensus";
import { CONSENSUS_MIN_N } from "./consensusConstants";
import { getClaimableFields, getOfficialValue, getPlayers, getTeams } from "./data";
import { listEdits } from "./edits";
import {
  scaleFpByIdentity,
  scaleTeamVolume,
  seasonFpIdentity,
  type IdentityInputs,
} from "./projectFp";
import { hybridRenormPie, type PieSlot } from "./shareRenorm";
import type { OpenSourceEdit, PieSegment, Player, Team } from "./types";

export type LiveMeta = {
  mode: "live_collective";
  min_n: number;
};

export type LivePlayer = Player & {
  live: {
    season_fp: number | null;
    downside_fp: number | null;
    scenario_fp: number | null;
    pos_rank: number | null;
    pos_downside_rank: number | null;
    pos_upside_rank: number | null;
    inputs_unlocked: number;
    from_consensus: boolean;
  };
};

function asShare(n: number | null | undefined): number | null {
  if (n == null || Number.isNaN(n)) return null;
  return Math.abs(n) > 1.5 ? n / 100 : n;
}

function playerSeedInputs(p: Player): Record<string, number | null> {
  return {
    target_share_dn: p.target_share_dn ?? asShare(p.usage.target_share_floor),
    target_share: p.target_share ?? asShare(p.usage.target_share),
    target_share_ceil:
      p.target_share_ceil ?? asShare(p.usage.target_share_ceil),
    rush_share_dn: p.rush_share_dn ?? asShare(p.usage.rush_share_floor),
    rush_share: p.rush_share ?? asShare(p.usage.rush_share),
    rush_share_ceil: p.rush_share_ceil ?? asShare(p.usage.rush_share_ceil),
    catch_pct: p.catch_pct ?? asShare(p.rates.catch_pct),
    ypt: p.ypt ?? p.rates.ypt,
    cay_per_rec: p.cay_per_rec ?? p.rates.cay_per_rec,
    yac_per_rec: p.yac_per_rec ?? p.rates.yac_per_rec,
    rec_td_rate: p.rec_td_rate ?? asShare(p.rates.rec_td_rate),
    ypc: p.ypc ?? p.rates.ypc,
    rush_td_rate: p.rush_td_rate ?? asShare(p.rates.rush_td_rate),
    pass_ypa: p.pass_ypa ?? p.rates.pass_ypa,
    pass_td_rate: p.pass_td_rate ?? asShare(p.rates.pass_td_rate),
    int_rate: p.int_rate ?? asShare(p.rates.int_rate),
  };
}

function teamSeedInputs(t: Team): Record<string, number | null> {
  return {
    implied_ppg: t.market.implied_ppg,
    plays_pg: t.hub.plays_pg,
    pass_rate: asShare(t.hub.pass_rate),
    vol_up: t.scenario.vol_up,
    eff_up: t.scenario.eff_up,
    target_share_other: t.depth_shares?.target_share_other ?? null,
    rush_share_other: t.depth_shares?.rush_share_other ?? null,
  };
}

function eff(
  map: Record<string, ConsensusPoint>,
  field: string,
  seed: number | null,
): number | null {
  if (map[field]) return map[field].value;
  return seed;
}

function identityFrom(
  p: Player,
  shares: {
    tgt: number;
    rush: number;
    catchPct: number;
    ypt: number;
    recTd: number;
    ypc: number;
    rushTd: number;
    passYpa: number;
    passTd: number;
    intRate: number;
  },
  teamTargets: number,
  teamRushAtt: number,
): number {
  const gp = p.fp.games_played_proj ?? 17;
  const input: IdentityInputs = {
    position: p.position,
    gamesPlayed: gp,
    teamTargets,
    teamRushAtt,
    targetShare: shares.tgt,
    rushShare: shares.rush,
    catchPct: shares.catchPct,
    ypt: shares.ypt,
    recTdRate: shares.recTd,
    ypc: shares.ypc,
    rushTdRate: shares.rushTd,
    passYpa: shares.passYpa,
    passTdRate: shares.passTd,
    intRate: shares.intRate,
  };
  return seasonFpIdentity(input).seasonFp;
}

function rankByPos(
  players: LivePlayer[],
  valueOf: (p: LivePlayer) => number | null,
): Map<string, number> {
  const map = new Map<string, number>();
  const byPos = new Map<string, LivePlayer[]>();
  for (const p of players) {
    const list = byPos.get(p.position) ?? [];
    list.push(p);
    byPos.set(p.position, list);
  }
  for (const list of byPos.values()) {
    list.sort((a, b) => (valueOf(b) ?? -1e9) - (valueOf(a) ?? -1e9));
    list.forEach((p, i) => map.set(p.player_id, i + 1));
  }
  return map;
}

export type LiveBoard = {
  players: LivePlayer[];
  teams: Team[];
  teamConsensus: Record<string, Record<string, ConsensusPoint>>;
  playerConsensus: Record<string, Record<string, ConsensusPoint>>;
  needsLook: NeedsLookRow[];
  recentMoves: RecentMove[];
  meta: LiveMeta;
};

export type NeedsLookRow = {
  grain: "team" | "player";
  subject_id: string;
  subject_label: string;
  field: string;
  field_label: string;
  n: number;
  median: number | null;
  seed: number | null;
  href: string;
  reason: "building" | "unlocked";
};

export type RecentMove = {
  created_at: string;
  author: string;
  grain: "team" | "player";
  subject_id: string;
  subject_label: string;
  field: string;
  field_label: string;
  value: number | null;
  official_value: number | null;
  href: string;
  rationale: string;
};

function groupEdits(edits: OpenSourceEdit[]) {
  const byKey = new Map<string, OpenSourceEdit[]>();
  for (const e of edits) {
    if (e.grain !== "team" && e.grain !== "player") continue;
    if (e.value == null) continue;
    const key = `${e.grain}:${e.subject_id}`;
    const list = byKey.get(key) ?? [];
    list.push(e);
    byKey.set(key, list);
  }
  return byKey;
}

type ShareField = "target_share" | "rush_share";

/**
 * Build team pie slots from freeze seeds ⊕ consensus, then hybrid-renorm.
 */
function renormTeamPie(args: {
  team: Team;
  teamPlayers: Player[];
  playerConsensus: Record<string, Record<string, ConsensusPoint>>;
  teamConsensus: Record<string, ConsensusPoint>;
  field: ShareField;
}): { byPlayer: Map<string, number>; other: number } {
  const otherField =
    args.field === "target_share" ? "target_share_other" : "rush_share_other";
  const seedOther =
    asShare(args.team.depth_shares?.[otherField]) ??
    asShare(
      args.team[args.field === "target_share" ? "tgt_segs" : "rush_segs"].find(
        (s) => s.kind === "depth",
      )?.share,
    ) ??
    0;
  const otherC = args.teamConsensus[otherField];
  const otherLocked = Boolean(otherC?.unlocked);
  const otherShare = otherC ? asShare(otherC.value) ?? seedOther : seedOther;

  const slots: PieSlot[] = [];
  for (const p of args.teamPlayers) {
    const seeds = playerSeedInputs(p);
    const seed = seeds[args.field] ?? 0;
    const cmap = args.playerConsensus[p.player_id] ?? {};
    const c = cmap[args.field];
    const locked = Boolean(c?.unlocked);
    const share = c ? (asShare(c.value) ?? seed) : seed;
    if ((share ?? 0) <= 0 && !locked) continue;
    slots.push({
      id: p.player_id,
      position: p.position,
      kind: "player",
      share: share ?? 0,
      locked,
    });
  }
  slots.push({
    id: `__other__${args.team.team}`,
    position: "OTHER",
    kind: "other",
    share: otherShare ?? 0,
    locked: otherLocked,
  });

  // If nothing unlocked on this pie, keep freeze (still normalize soft float).
  const anyLock = slots.some((s) => s.locked);
  const out = anyLock ? hybridRenormPie(slots) : slots;

  const byPlayer = new Map<string, number>();
  let other = 0;
  for (const s of out) {
    if (s.kind === "other") other = s.share;
    else byPlayer.set(s.id, s.share);
  }
  return { byPlayer, other };
}

function patchSegs(
  segs: PieSegment[],
  byPlayer: Map<string, number>,
  other: number,
): PieSegment[] {
  // Freeze segs store Expected as percent (22.0); depth_shares stay 0–1.
  return segs.map((s) => {
    if (s.kind === "depth") {
      return { ...s, share: other * 100 };
    }
    if (s.kind === "player" && s.player_id && byPlayer.has(s.player_id)) {
      return { ...s, share: byPlayer.get(s.player_id)! * 100 };
    }
    return s;
  });
}

/**
 * Build the live collective board from freeze JSON + non-rejected edits.
 */
export async function buildLiveBoard(): Promise<LiveBoard> {
  const teams = getTeams();
  const players = getPlayers();
  const edits = (
    await listEdits({ status: ["pending", "reviewed"] })
  ).filter((e) => e.grain === "team" || e.grain === "player");

  const grouped = groupEdits(edits);

  const teamConsensus: Record<string, Record<string, ConsensusPoint>> = {};
  const liveTeamsDraft: Team[] = teams.map((t) => {
    const subjectEdits = grouped.get(`team:${t.team}`) ?? [];
    const seeds = teamSeedInputs(t);
    const cmap = consensusMapForSubject(subjectEdits, seeds);
    teamConsensus[t.team] = cmap;

    const plays = eff(cmap, "plays_pg", t.hub.plays_pg);
    const passRate = eff(cmap, "pass_rate", asShare(t.hub.pass_rate));
    const ppg = eff(cmap, "implied_ppg", t.market.implied_ppg);
    const volUp = eff(cmap, "vol_up", t.scenario.vol_up);
    const effUp = eff(cmap, "eff_up", t.scenario.eff_up);

    return {
      ...t,
      market: { ...t.market, implied_ppg: ppg },
      hub: {
        ...t.hub,
        plays_pg: plays,
        pass_rate:
          passRate == null
            ? t.hub.pass_rate
            : Math.abs(passRate) <= 1.5
              ? passRate * 100
              : passRate,
      },
      scenario: {
        ...t.scenario,
        vol_up: volUp,
        eff_up: effUp,
      },
      implied_ppg: ppg,
      plays_pg: plays,
      pass_rate:
        passRate == null
          ? t.pass_rate
          : Math.abs(passRate) <= 1.5
            ? passRate * 100
            : passRate,
      vol_up: volUp,
      eff_up: effUp,
    };
  });

  const teamByAbbr = new Map(liveTeamsDraft.map((t) => [t.team, t]));
  const seedTeamByAbbr = new Map(teams.map((t) => [t.team, t]));

  const playerConsensus: Record<string, Record<string, ConsensusPoint>> = {};
  for (const p of players) {
    const subjectEdits = grouped.get(`player:${p.player_id}`) ?? [];
    const seeds = playerSeedInputs(p);
    playerConsensus[p.player_id] = consensusMapForSubject(subjectEdits, seeds);
  }

  // Hybrid renorm base pies per team when any share unlocks
  const tgtByTeam = new Map<
    string,
    { byPlayer: Map<string, number>; other: number }
  >();
  const rushByTeam = new Map<
    string,
    { byPlayer: Map<string, number>; other: number }
  >();

  for (const t of liveTeamsDraft) {
    const teamPlayers = players.filter((p) => p.team === t.team);
    tgtByTeam.set(
      t.team,
      renormTeamPie({
        team: t,
        teamPlayers,
        playerConsensus,
        teamConsensus: teamConsensus[t.team] ?? {},
        field: "target_share",
      }),
    );
    rushByTeam.set(
      t.team,
      renormTeamPie({
        team: t,
        teamPlayers,
        playerConsensus,
        teamConsensus: teamConsensus[t.team] ?? {},
        field: "rush_share",
      }),
    );
  }

  const liveTeams: Team[] = liveTeamsDraft.map((t) => {
    const tgt = tgtByTeam.get(t.team)!;
    const rush = rushByTeam.get(t.team)!;
    return {
      ...t,
      depth_shares: {
        ...t.depth_shares,
        target_share_other: tgt.other,
        rush_share_other: rush.other,
      },
      tgt_segs: patchSegs(t.tgt_segs, tgt.byPlayer, tgt.other),
      rush_segs: patchSegs(t.rush_segs, rush.byPlayer, rush.other),
    };
  });
  for (const t of liveTeams) teamByAbbr.set(t.team, t);

  let livePlayers: LivePlayer[] = players.map((p) => {
    const cmap = playerConsensus[p.player_id] ?? {};
    const seeds = playerSeedInputs(p);

    const seedTeam = seedTeamByAbbr.get(p.team);
    const liveTeam = teamByAbbr.get(p.team);
    const seedTargets =
      seedTeam?.hub.team_targets ?? p.team_pack.team_targets ?? 500;
    const seedRushAtt = seedTeam?.hub.designed_rush_attempts ?? 400;
    const seedPlays = seedTeam?.hub.plays_pg ?? p.team_pack.plays_pg ?? 60;
    const seedPass =
      asShare(seedTeam?.hub.pass_rate) ??
      asShare(p.team_pack.pass_rate) ??
      0.6;
    const livePlays = liveTeam?.hub.plays_pg ?? seedPlays;
    const livePass = asShare(liveTeam?.hub.pass_rate) ?? seedPass;

    const vol = scaleTeamVolume({
      seedTargets,
      seedRushAtt,
      seedPlaysPg: seedPlays,
      seedPassRate: seedPass,
      livePlaysPg: livePlays ?? seedPlays,
      livePassRate: livePass,
    });

    const tgtPie = tgtByTeam.get(p.team);
    const rushPie = rushByTeam.get(p.team);
    const tgt =
      tgtPie?.byPlayer.get(p.player_id) ??
      eff(cmap, "target_share", seeds.target_share) ??
      0;
    const rush =
      rushPie?.byPlayer.get(p.player_id) ??
      eff(cmap, "rush_share", seeds.rush_share) ??
      0;
    const tgtDn = eff(cmap, "target_share_dn", seeds.target_share_dn) ?? tgt;
    const rushDn = eff(cmap, "rush_share_dn", seeds.rush_share_dn) ?? rush;
    const tgtCeil =
      eff(cmap, "target_share_ceil", seeds.target_share_ceil) ?? tgt;
    const rushCeil =
      eff(cmap, "rush_share_ceil", seeds.rush_share_ceil) ?? rush;
    const catchPct = eff(cmap, "catch_pct", seeds.catch_pct) ?? 0;
    const ypt = eff(cmap, "ypt", seeds.ypt) ?? 0;
    const recTd = eff(cmap, "rec_td_rate", seeds.rec_td_rate) ?? 0;
    const ypc = eff(cmap, "ypc", seeds.ypc) ?? 0;
    const rushTd = eff(cmap, "rush_td_rate", seeds.rush_td_rate) ?? 0;
    const passYpa = eff(cmap, "pass_ypa", seeds.pass_ypa) ?? 0;
    const passTd = eff(cmap, "pass_td_rate", seeds.pass_td_rate) ?? 0;
    const intRate = eff(cmap, "int_rate", seeds.int_rate) ?? 0;

    const ratesSeed = {
      catchPct: seeds.catch_pct ?? 0,
      ypt: seeds.ypt ?? 0,
      recTd: seeds.rec_td_rate ?? 0,
      ypc: seeds.ypc ?? 0,
      rushTd: seeds.rush_td_rate ?? 0,
      passYpa: seeds.pass_ypa ?? 0,
      passTd: seeds.pass_td_rate ?? 0,
      intRate: seeds.int_rate ?? 0,
    };
    const ratesLive = {
      catchPct,
      ypt,
      recTd,
      ypc,
      rushTd,
      passYpa,
      passTd,
      intRate,
    };

    const seedTgt = seeds.target_share ?? 0;
    const seedRush = seeds.rush_share ?? 0;
    const seedTgtDn = seeds.target_share_dn ?? seedTgt;
    const seedRushDn = seeds.rush_share_dn ?? seedRush;
    const seedTgtCeil = seeds.target_share_ceil ?? seedTgt;
    const seedRushCeil = seeds.rush_share_ceil ?? seedRush;

    // Pair each FP band with its own seed identity so we don't double-count
    // freeze downside/upside share packs already baked into draft.*_fp.
    const seedId = identityFrom(
      p,
      { tgt: seedTgt, rush: seedRush, ...ratesSeed },
      seedTargets,
      seedRushAtt,
    );
    const seedDnId = identityFrom(
      p,
      { tgt: seedTgtDn, rush: seedRushDn, ...ratesSeed },
      seedTargets,
      seedRushAtt,
    );
    const seedUpId = identityFrom(
      p,
      { tgt: seedTgtCeil, rush: seedRushCeil, ...ratesSeed },
      seedTargets,
      seedRushAtt,
    );
    const liveId = identityFrom(
      p,
      { tgt, rush, ...ratesLive },
      vol.teamTargets,
      vol.teamRushAtt,
    );
    const dnId = identityFrom(
      p,
      { tgt: tgtDn, rush: rushDn, ...ratesLive },
      vol.teamTargets,
      vol.teamRushAtt,
    );
    const upId = identityFrom(
      p,
      { tgt: tgtCeil, rush: rushCeil, ...ratesLive },
      vol.teamTargets,
      vol.teamRushAtt,
    );

    const seedVolUp = seedTeam?.scenario.vol_up ?? 1;
    const seedEffUp = seedTeam?.scenario.eff_up ?? 1;
    const liveVolUp = liveTeam?.scenario.vol_up ?? seedVolUp ?? 1;
    const liveEffUp = liveTeam?.scenario.eff_up ?? seedEffUp ?? 1;
    // Only the *delta* vs freeze packs — scenario_fp already includes seed packs.
    const upPackScale =
      ((seedVolUp ?? 1) > 0 ? (liveVolUp ?? 1) / (seedVolUp ?? 1) : 1) *
      ((seedEffUp ?? 1) > 0 ? (liveEffUp ?? 1) / (seedEffUp ?? 1) : 1);

    const season_fp = scaleFpByIdentity(p.fp.season_fp, seedId, liveId);
    const downside_fp = scaleFpByIdentity(p.draft.downside_fp, seedDnId, dnId);
    const scenario_fp = scaleFpByIdentity(
      p.draft.scenario_fp,
      seedUpId,
      upId * (Number.isFinite(upPackScale) ? upPackScale : 1),
    );

    const inputs_unlocked = Object.values(cmap).filter((c) => c.unlocked)
      .length;
    const teamUnlocked = Object.values(teamConsensus[p.team] ?? {}).filter(
      (c) => c.unlocked,
    ).length;
    const from_consensus = inputs_unlocked + teamUnlocked > 0;

    return {
      ...p,
      target_share: tgt,
      rush_share: rush,
      target_share_dn: tgtDn,
      rush_share_dn: rushDn,
      target_share_ceil: tgtCeil,
      rush_share_ceil: rushCeil,
      catch_pct: catchPct,
      ypt,
      rec_td_rate: recTd,
      ypc,
      rush_td_rate: rushTd,
      pass_ypa: passYpa,
      pass_td_rate: passTd,
      int_rate: intRate,
      usage: {
        ...p.usage,
        target_share: tgt != null ? tgt * 100 : p.usage.target_share,
        rush_share: rush != null ? rush * 100 : p.usage.rush_share,
      },
      season_fp,
      downside_fp,
      scenario_fp,
      fp: {
        ...p.fp,
        season_fp,
        fp_per_game:
          season_fp != null && p.fp.games_played_proj
            ? Math.round((season_fp / p.fp.games_played_proj) * 100) / 100
            : p.fp.fp_per_game,
      },
      draft: {
        ...p.draft,
        downside_fp,
        scenario_fp,
        upside_gap:
          season_fp != null && scenario_fp != null
            ? Math.round((scenario_fp - season_fp) * 10) / 10
            : p.draft.upside_gap,
        downside_gap:
          season_fp != null && downside_fp != null
            ? Math.round((season_fp - downside_fp) * 10) / 10
            : p.draft.downside_gap,
      },
      live: {
        season_fp,
        downside_fp,
        scenario_fp,
        pos_rank: null,
        pos_downside_rank: null,
        pos_upside_rank: null,
        inputs_unlocked: inputs_unlocked + teamUnlocked,
        from_consensus,
      },
    };
  });

  const baseRanks = rankByPos(livePlayers, (p) => p.live.season_fp);
  const dnRanks = rankByPos(livePlayers, (p) => p.live.downside_fp);
  const upRanks = rankByPos(livePlayers, (p) => p.live.scenario_fp);

  livePlayers = livePlayers.map((p) => ({
    ...p,
    draft: {
      ...p.draft,
      pos_rank: baseRanks.get(p.player_id) ?? p.draft.pos_rank,
      pos_downside_rank: dnRanks.get(p.player_id) ?? p.draft.pos_downside_rank,
      pos_upside_rank: upRanks.get(p.player_id) ?? p.draft.pos_upside_rank,
    },
    live: {
      ...p.live,
      pos_rank: baseRanks.get(p.player_id) ?? null,
      pos_downside_rank: dnRanks.get(p.player_id) ?? null,
      pos_upside_rank: upRanks.get(p.player_id) ?? null,
    },
  }));

  const needsLook = buildNeedsLook(
    teamConsensus,
    playerConsensus,
    teams,
    players,
  );
  const recentMoves = buildRecentMoves(edits);

  return {
    players: livePlayers.sort(
      (a, b) => (b.live.season_fp ?? 0) - (a.live.season_fp ?? 0),
    ),
    teams: liveTeams,
    teamConsensus,
    playerConsensus,
    needsLook,
    recentMoves,
    meta: {
      mode: "live_collective",
      min_n: CONSENSUS_MIN_N,
    },
  };
}

function buildNeedsLook(
  teamConsensus: Record<string, Record<string, ConsensusPoint>>,
  playerConsensus: Record<string, Record<string, ConsensusPoint>>,
  teams: Team[],
  players: Player[],
): NeedsLookRow[] {
  const rows: NeedsLookRow[] = [];
  const playerName = new Map(players.map((p) => [p.player_id, p.name]));
  const fieldLabels = new Map(
    getClaimableFields().map((f) => [f.field, f.label]),
  );

  for (const [team, cmap] of Object.entries(teamConsensus)) {
    for (const [field, c] of Object.entries(cmap)) {
      if (c.n === 0) continue;
      if (c.n < CONSENSUS_MIN_N || c.unlocked) {
        rows.push({
          grain: "team",
          subject_id: team,
          subject_label: team,
          field,
          field_label: fieldLabels.get(field) ?? field.replace(/_/g, " "),
          n: c.n,
          median: c.median,
          seed: c.seed,
          href: `/teams/${team}#suggest`,
          reason: c.n < CONSENSUS_MIN_N ? "building" : "unlocked",
        });
      }
    }
  }
  for (const [pid, cmap] of Object.entries(playerConsensus)) {
    for (const [field, c] of Object.entries(cmap)) {
      if (c.n === 0) continue;
      if (c.n < CONSENSUS_MIN_N || c.unlocked) {
        rows.push({
          grain: "player",
          subject_id: pid,
          subject_label: playerName.get(pid) ?? pid,
          field,
          field_label: fieldLabels.get(field) ?? field.replace(/_/g, " "),
          n: c.n,
          median: c.median,
          seed: c.seed,
          href: `/players/${pid}#suggest`,
          reason: c.n < CONSENSUS_MIN_N ? "building" : "unlocked",
        });
      }
    }
  }

  return rows
    .sort((a, b) => {
      const score = (r: NeedsLookRow) =>
        r.reason === "building" ? 100 - r.n : 50 + r.n;
      return score(b) - score(a);
    })
    .slice(0, 40);
}

function buildRecentMoves(edits: OpenSourceEdit[]): RecentMove[] {
  return edits
    .filter((e) => e.value != null && e.status !== "rejected")
    .slice(0, 25)
    .map((e) => ({
      created_at: e.created_at,
      author: e.author,
      grain: e.grain as "team" | "player",
      subject_id: e.subject_id,
      subject_label: e.subject_label,
      field: e.field,
      field_label: e.field_label,
      value: e.value,
      official_value: e.official_value,
      href:
        e.grain === "team"
          ? `/teams/${e.subject_id}#suggest`
          : `/players/${e.subject_id}#suggest`,
      rationale: e.rationale,
    }));
}

export async function getLivePlayers(): Promise<LivePlayer[]> {
  return (await buildLiveBoard()).players;
}

export async function getLivePlayer(
  id: string,
): Promise<LivePlayer | undefined> {
  return (await getLivePlayers()).find((p) => p.player_id === id);
}

export async function getLiveTeam(abbr: string): Promise<Team | undefined> {
  const board = await buildLiveBoard();
  return board.teams.find(
    (t) => t.team.toUpperCase() === abbr.toUpperCase(),
  );
}

export function effectiveOfficialValue(
  consensus: Record<string, ConsensusPoint>,
  grain: "team" | "player",
  subjectId: string,
  field: string,
): number | null {
  if (consensus[field]) return consensus[field].value;
  return getOfficialValue(grain, subjectId, field);
}

/** Message after a successful contribution given new vote count for that field. */
export function contributeOutcomeMessage(nForField: number): string {
  if (nForField >= CONSENSUS_MIN_N) {
    return "Board updated — Expected uses the crowd median; teammate shares rebalance to 100%.";
  }
  const need = CONSENSUS_MIN_N - nForField;
  return `Contribution in — ${need} more on this field and Expected will use the crowd median (${nForField} of ${CONSENSUS_MIN_N}).`;
}
