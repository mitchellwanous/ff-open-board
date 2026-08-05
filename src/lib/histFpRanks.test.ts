/**
 * Hist actual-ladder ranks (rounded avg of last 3 seasons).
 * Run: npx tsx src/lib/histFpRanks.test.ts
 */
import assert from "node:assert/strict";
import { histAvgPosRank } from "./histFpRanks";

// Synthetic: year1 WR1=300,WR2=200; year2 same; year3 same
const years = [
  [300, 200, 100],
  [300, 200, 100],
  [300, 200, 100],
];
assert.equal(histAvgPosRank(350, years), 1);
assert.equal(histAvgPosRank(250, years), 2);
assert.equal(histAvgPosRank(150, years), 3);
assert.equal(histAvgPosRank(50, years), 4);

// Mixed years → average then round (2,2,3) → 2.33 → 2
assert.equal(
  histAvgPosRank(250, [
    [300, 200], // rank 2
    [300, 200], // rank 2
    [400, 300, 200], // rank 3
  ]),
  2,
);

assert.equal(histAvgPosRank(null, years), null);
console.log("histFpRanks.test.ts: ok");
