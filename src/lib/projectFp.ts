/**
 * Lightweight half-PPR identity recompute for the live collective board.
 * Absolute identity can drift from lab M5 — we scale freeze FP by
 * identity(live) / identity(seed) so the board moves with consensus deltas.
 */

import { HALF_PPR, TEAM_GAMES } from "./consensusConstants";

export type IdentityInputs = {
  position: string;
  gamesPlayed: number;
  teamTargets: number;
  teamRushAtt: number;
  targetShare: number;
  rushShare: number;
  catchPct: number;
  ypt: number;
  recTdRate: number;
  ypc: number;
  rushTdRate: number;
  passYpa: number;
  passTdRate: number;
  intRate: number;
  /** QB pass attempt share of team targets; default 1. */
  qbPassShare?: number;
};

export type IdentityResult = {
  seasonFp: number;
  fpPerGame: number;
  passFp: number;
  rushFp: number;
  recFp: number;
};

function asRate01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.abs(n) > 1.5 ? n / 100 : n;
}

export function normalizeShare(n: number | null | undefined): number {
  if (n == null || Number.isNaN(n)) return 0;
  return asRate01(n);
}

export function seasonFpIdentity(p: IdentityInputs): IdentityResult {
  const gp = Math.max(0.1, p.gamesPlayed || TEAM_GAMES);
  const gpScale = gp / TEAM_GAMES;
  let passFp = 0;
  let rushFp = 0;
  let recFp = 0;

  const tgtShare = normalizeShare(p.targetShare);
  const rushShare = normalizeShare(p.rushShare);
  const catchPct = normalizeShare(p.catchPct);
  const recTdRate = normalizeShare(p.recTdRate);
  const rushTdRate = normalizeShare(p.rushTdRate);
  const passTdRate = normalizeShare(p.passTdRate);
  const intRate = normalizeShare(p.intRate);

  if (p.position === "QB") {
    const att = p.teamTargets * (p.qbPassShare ?? 1);
    const passYd = att * (p.passYpa || 0);
    const passTd = att * passTdRate;
    const ints = att * intRate;
    const rushAtt = p.teamRushAtt * rushShare;
    const rushYd = rushAtt * (p.ypc || 0);
    const rushTd = rushAtt * rushTdRate;
    passFp =
      passYd * HALF_PPR.passYd +
      passTd * HALF_PPR.passTd +
      ints * HALF_PPR.int;
    rushFp = rushYd * HALF_PPR.rushYd + rushTd * HALF_PPR.td;
  } else {
    const tgt = p.teamTargets * tgtShare;
    const rec = tgt * catchPct;
    const recYd = tgt * (p.ypt || 0);
    const recTd = tgt * recTdRate;
    recFp =
      recYd * HALF_PPR.recYd + rec * HALF_PPR.rec + recTd * HALF_PPR.td;
    if (p.position === "RB" || rushShare > 0.001) {
      const rushAtt = p.teamRushAtt * rushShare;
      const rushYd = rushAtt * (p.ypc || 0);
      const rushTd = rushAtt * rushTdRate;
      rushFp = rushYd * HALF_PPR.rushYd + rushTd * HALF_PPR.td;
    }
  }

  const full = passFp + rushFp + recFp;
  const seasonFp = full * gpScale;
  return {
    seasonFp,
    fpPerGame: seasonFp / gp,
    passFp: passFp * gpScale,
    rushFp: rushFp * gpScale,
    recFp: recFp * gpScale,
  };
}

/**
 * Scale freeze FP by identity ratio so consensus deltas move the board
 * without requiring identity to match lab absolute FP.
 */
export function scaleFpByIdentity(
  freezeFp: number | null,
  seedIdentity: number,
  liveIdentity: number,
): number | null {
  if (freezeFp == null || Number.isNaN(freezeFp)) return freezeFp;
  if (seedIdentity <= 1e-6) return freezeFp;
  const scale = liveIdentity / seedIdentity;
  if (!Number.isFinite(scale) || scale <= 0) return freezeFp;
  return Math.round(freezeFp * scale * 10) / 10;
}

/** Rebuild team targets / rush att when plays or pass rate consensus moves. */
export function scaleTeamVolume(args: {
  seedTargets: number;
  seedRushAtt: number;
  seedPlaysPg: number;
  seedPassRate: number;
  livePlaysPg: number;
  livePassRate: number;
}): { teamTargets: number; teamRushAtt: number } {
  const seedPlays = Math.max(1, args.seedPlaysPg);
  const seedPass = normalizeShare(args.seedPassRate);
  const livePass = normalizeShare(args.livePassRate);
  const playsScale = args.livePlaysPg / seedPlays;
  const passScale =
    seedPass > 1e-6 ? livePass / seedPass : 1;
  const rushSeed = Math.max(1e-6, 1 - seedPass);
  const rushLive = Math.max(1e-6, 1 - livePass);
  const rushScale = rushLive / rushSeed;
  return {
    teamTargets: args.seedTargets * playsScale * passScale,
    teamRushAtt: args.seedRushAtt * playsScale * rushScale,
  };
}
