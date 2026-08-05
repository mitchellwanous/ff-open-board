/**
 * Share / percent display smoke tests.
 * Run: npx tsx src/lib/format.test.ts
 */
import assert from "node:assert/strict";
import { fmtShare } from "./format";

// Hist shares are fractions (0–1) — must multiply to percent points.
assert.equal(fmtShare(0.245, 1), "24.5%");
assert.equal(fmtShare(0.1703, 1), "17.0%");
assert.equal(fmtShare(0.0505, 1), "5.1%");

// Usage / pie shares are already percent points (0–100).
assert.equal(fmtShare(24.5, 1), "24.5%");
assert.equal(fmtShare(24.5, 0), "25%");

// Empty
assert.equal(fmtShare(null), "—");
assert.equal(fmtShare(undefined), "—");

console.log("format.test.ts: ok");
