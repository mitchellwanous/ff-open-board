/**
 * Live-board QA: hist upside/downside ranks + Expected vs board.
 * Run: npx tsx src/lib/qaShareAndRanks.test.ts
 */
import assert from "node:assert/strict";
import { buildLiveBoard } from "./liveBoard";
import { fmtShare } from "./format";
import { getHistFpLadders } from "./data";
import { histAvgPosRank, yearLaddersForPos } from "./histFpRanks";

async function main() {
  const board = await buildLiveBoard();
  const rice = board.players.find((p) => p.player_id === "00-0039067");
  assert.ok(rice, "Rashee Rice missing from live board");

  const usage = rice.usage.target_share;
  assert.ok(
    usage != null && usage > 5,
    `usage.target_share should be percent points, got ${usage}`,
  );

  const hist = (rice.hist ?? []).filter((h) => h.kind === "actual");
  assert.ok(hist.length > 0, "Rice hist missing");
  for (const h of hist) {
    if (h.target_share == null) continue;
    const shown = fmtShare(h.target_share, 1);
    assert.ok(
      !shown.startsWith("0.") && shown !== "0.0%" && shown !== "0.2%",
      `hist ${h.season} target_share displayed as ${shown} (raw ${h.target_share})`,
    );
  }

  const ladders = getHistFpLadders();
  assert.ok(ladders, "hist_fp_ladders.json missing — run lab export");
  assert.ok((ladders.years?.length ?? 0) >= 3);

  const { season_fp } = rice.fp;
  const { downside_fp, scenario_fp, pos_rank, pos_downside_rank, pos_upside_rank } =
    rice.draft;

  assert.ok(season_fp != null && scenario_fp != null && pos_rank != null);
  assert.ok(pos_upside_rank != null && pos_downside_rank != null);

  const wrYears = yearLaddersForPos(ladders, "WR");
  const expectUp = histAvgPosRank(scenario_fp, wrYears);
  const expectDn = histAvgPosRank(downside_fp, wrYears);
  assert.equal(pos_upside_rank, expectUp);
  assert.equal(pos_downside_rank, expectDn);

  // Rice upside ~306 → historically ~WR2 (rounded from ~2.3)
  assert.ok(
    (pos_upside_rank ?? 99) <= 3,
    `Rice upside rank expected ~WR2, got WR${pos_upside_rank}`,
  );
  assert.ok(
    (pos_downside_rank ?? 0) >= 20,
    `Rice downside rank expected mid/late WR, got WR${pos_downside_rank}`,
  );

  console.log(
    JSON.stringify(
      {
        rice: {
          usage_tgt: usage,
          season_fp,
          downside_fp,
          scenario_fp,
          pos_rank,
          pos_downside_rank,
          pos_upside_rank,
          hist_years: ladders.years,
        },
      },
      null,
      2,
    ),
  );
  console.log("qaShareAndRanks.test.ts: ok");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
