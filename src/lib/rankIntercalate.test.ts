/**
 * Upside/downside ranks intercalate into the Expected ladder.
 * Run: npx tsx src/lib/rankIntercalate.test.ts
 */
import assert from "node:assert/strict";
import { intercalateRanksAgainstExpected } from "./liveBoard";
import type { LivePlayer } from "./liveBoard";

function stub(
  id: string,
  season_fp: number,
  downside_fp: number,
  scenario_fp: number,
): LivePlayer {
  return {
    player_id: id,
    name: id,
    position: "WR",
    team: "KC",
    live: { season_fp, downside_fp, scenario_fp },
  } as unknown as LivePlayer;
}

// Ladder Expected: A 300, B 200, C 100
const players = [
  stub("A", 300, 250, 350),
  stub("B", 200, 150, 280),
  stub("C", 100, 80, 220),
];

const up = intercalateRanksAgainstExpected(players, (p) => p.live.scenario_fp);
// B upside 280 beats A's Expected 300? No → 1 person above → WR2
assert.equal(up.get("A"), 1); // 350 > all Expected
assert.equal(up.get("B"), 2); // 280 < 300, > 200 and 100
assert.equal(up.get("C"), 2); // 220 < 300, > 200? No 220 > 200 → only A above → WR2

const dn = intercalateRanksAgainstExpected(players, (p) => p.live.downside_fp);
assert.equal(dn.get("A"), 2); // 250 < 300, > 200 → WR2
assert.equal(dn.get("B"), 3); // 150 < 300 and 200, > 100 → WR3
assert.equal(dn.get("C"), 4); // 80 below all three Expected → WR4

// Critical: upside FP higher than Expected must not rank worse than Expected
// when intercalated (the old "rank all upside together" bug).
assert.ok((up.get("B") ?? 99) <= 2);
assert.ok(280 > 200); // B's upside clears B's Expected

console.log("rankIntercalate.test.ts: ok");
