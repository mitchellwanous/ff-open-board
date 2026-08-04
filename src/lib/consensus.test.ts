/**
 * Smoke tests for live consensus + identity FP.
 * Run: npx tsx src/lib/consensus.test.ts
 */
import assert from "node:assert/strict";
import {
  latestVotesPerAuthor,
  resolveConsensus,
  weightedMedian,
} from "./consensus";
import { CONSENSUS_MIN_N } from "./consensusConstants";
import {
  scaleFpByIdentity,
  seasonFpIdentity,
} from "./projectFp";
import { hybridRenormPie, pieSum } from "./shareRenorm";
import type { OpenSourceEdit } from "./types";

function edit(
  partial: Partial<OpenSourceEdit> & { value: number; author: string },
): OpenSourceEdit {
  return {
    id: partial.id ?? Math.random().toString(36).slice(2),
    created_at: partial.created_at ?? "2026-08-03T12:00:00Z",
    grain: "player",
    subject_id: "00-0039040",
    subject_label: "Achane",
    field: "rush_share",
    field_label: "Rush share",
    official_value: 0.525,
    confidence: partial.confidence ?? "med",
    rationale: "test rationale long enough",
    doctrine_ok: true,
    status: partial.status ?? "pending",
    ...partial,
  };
}

// weighted median
assert.equal(weightedMedian([{ value: 1, weight: 1 }, { value: 3, weight: 1 }]), 2);
assert.equal(weightedMedian([{ value: 10, weight: 3 }, { value: 0, weight: 1 }]), 10);

// one vote per author (latest wins)
const votes = latestVotesPerAuthor(
  [
    edit({ author: "a", value: 0.5, created_at: "2026-08-01T00:00:00Z" }),
    edit({ author: "a", value: 0.6, created_at: "2026-08-02T00:00:00Z" }),
    edit({ author: "b", value: 0.55, created_at: "2026-08-02T00:00:00Z" }),
    edit({ author: "c", value: 0.9, status: "rejected", created_at: "2026-08-03T00:00:00Z" }),
  ],
  "rush_share",
);
assert.equal(votes.length, 2);
assert.ok(votes.some((v) => v.value === 0.6));

// min_n gate
const building = resolveConsensus(
  [
    edit({ author: "a", value: 0.58 }),
    edit({ author: "b", value: 0.56 }),
  ],
  "rush_share",
  0.525,
)!;
assert.equal(building.unlocked, false);
assert.equal(building.value, 0.525);
assert.equal(building.n, 2);

const unlocked = resolveConsensus(
  [
    edit({ author: "a", value: 0.58 }),
    edit({ author: "b", value: 0.56 }),
    edit({ author: "c", value: 0.57 }),
  ],
  "rush_share",
  0.525,
)!;
assert.equal(unlocked.unlocked, true);
assert.equal(unlocked.n, CONSENSUS_MIN_N);
assert.ok(Math.abs(unlocked.value - 0.57) < 0.011);

// identity scales freeze FP
const seed = seasonFpIdentity({
  position: "RB",
  gamesPlayed: 15,
  teamTargets: 516,
  teamRushAtt: 400,
  targetShare: 0.15,
  rushShare: 0.525,
  catchPct: 0.67,
  ypt: 6.5,
  recTdRate: 0.054,
  ypc: 5.1,
  rushTdRate: 0.033,
  passYpa: 0,
  passTdRate: 0,
  intRate: 0,
});
const hotter = seasonFpIdentity({
  position: "RB",
  gamesPlayed: 15,
  teamTargets: 516,
  teamRushAtt: 400,
  targetShare: 0.15,
  rushShare: 0.58,
  catchPct: 0.67,
  ypt: 6.5,
  recTdRate: 0.054,
  ypc: 5.1,
  rushTdRate: 0.033,
  passYpa: 0,
  passTdRate: 0,
  intRate: 0,
});
const scaled = scaleFpByIdentity(266.6, seed.seasonFp, hotter.seasonFp);
assert.ok(scaled != null && scaled > 266.6);

// hybrid share renorm
const pie = hybridRenormPie([
  { id: "odunze", position: "WR", kind: "player", share: 0.28, locked: true },
  { id: "burden", position: "WR", kind: "player", share: 0.16, locked: false },
  { id: "loveland", position: "TE", kind: "player", share: 0.17, locked: false },
  { id: "swift", position: "RB", kind: "player", share: 0.08, locked: false },
  { id: "other", position: "OTHER", kind: "other", share: 0.37, locked: false },
]);
assert.ok(Math.abs(pieSum(pie) - 1) < 1e-6);
const byId = Object.fromEntries(pie.map((s) => [s.id, s.share]));
assert.ok(Math.abs(byId.odunze - 0.28) < 1e-9);
// Same-pos WR absorbs first: Burden drops; TE/RB barely move until WR+Other exhausted
assert.ok(byId.burden < 0.16 - 0.01);
assert.ok(byId.loveland > 0.16); // TE barely cut vs Burden
assert.ok(0.16 - byId.burden > 0.17 - byId.loveland);

console.log("consensus + identity + shareRenorm smoke tests passed");
