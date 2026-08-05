/**
 * Live-board QA for share units + intercalated upside/downside ranks.
 * Run: npx tsx src/lib/qaShareAndRanks.test.ts
 */
import assert from "node:assert/strict";
import { buildLiveBoard } from "./liveBoard";
import { fmtShare } from "./format";

async function main() {
  const board = await buildLiveBoard();
  const rice = board.players.find((p) => p.player_id === "00-0039067");
  assert.ok(rice, "Rashee Rice missing from live board");

  const usage = rice.usage.target_share;
  assert.ok(
    usage != null && usage > 5,
    `usage.target_share should be percent points, got ${usage}`,
  );
  assert.equal(fmtShare(usage, 0), "25%" /* 24.5 rounds */);

  const hist = (rice.hist ?? []).filter((h) => h.kind === "actual");
  assert.ok(hist.length > 0, "Rice hist missing");
  for (const h of hist) {
    if (h.target_share == null) continue;
    const shown = fmtShare(h.target_share, 1);
    assert.ok(
      !shown.startsWith("0.") && shown !== "0.0%" && shown !== "0.2%",
      `hist ${h.season} target_share displayed as ${shown} (raw ${h.target_share})`,
    );
    assert.match(shown, /^\d+\.\d%$/);
  }

  const { season_fp } = rice.fp;
  const { downside_fp, scenario_fp, pos_rank, pos_downside_rank, pos_upside_rank } =
    rice.draft;

  assert.ok(season_fp != null && scenario_fp != null && pos_rank != null);
  assert.ok(pos_upside_rank != null && pos_downside_rank != null);

  if (scenario_fp > season_fp) {
    assert.ok(
      pos_upside_rank <= pos_rank,
      `Rice upside FP ${scenario_fp} > Expected ${season_fp} but upside rank WR${pos_upside_rank} worse than Expected WR${pos_rank}`,
    );
  }
  if (downside_fp != null && downside_fp < season_fp) {
    assert.ok(
      pos_downside_rank >= pos_rank,
      `Rice downside FP ${downside_fp} < Expected ${season_fp} but downside rank WR${pos_downside_rank} better than Expected WR${pos_rank}`,
    );
  }

  // Spot-check: several WRs with upside > expected must not rank worse
  const wrs = board.players.filter((p) => p.position === "WR");
  let checked = 0;
  for (const p of wrs) {
    const base = p.fp.season_fp;
    const up = p.draft.scenario_fp;
    const br = p.draft.pos_rank;
    const ur = p.draft.pos_upside_rank;
    if (base == null || up == null || br == null || ur == null) continue;
    if (up <= base) continue;
    assert.ok(
      ur <= br,
      `${p.name}: upside FP ${up} > ${base} but WR${ur} worse than WR${br}`,
    );
    checked += 1;
  }
  assert.ok(checked >= 20, `expected many WR upside checks, got ${checked}`);

  console.log(
    JSON.stringify(
      {
        rice: {
          usage_tgt: usage,
          hist_fmt: hist.map((h) => ({
            season: h.season,
            raw: h.target_share,
            shown: fmtShare(h.target_share, 1),
          })),
          season_fp,
          downside_fp,
          scenario_fp,
          pos_rank,
          pos_downside_rank,
          pos_upside_rank,
        },
        wr_upside_checks: checked,
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
