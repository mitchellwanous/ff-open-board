/**
 * Upside/downside ranks vs last-3-seasons actual FP at the position.
 * Expected rank stays on this year's Expected board (separate).
 */

export type HistFpLadders = {
  years: number[];
  by_pos: Record<string, Record<string, number[]>>;
  method?: string;
  label?: string;
};

/** Average finish across seasons, rounded to a whole position rank. */
export function histAvgPosRank(
  fp: number | null | undefined,
  yearLadders: number[][],
): number | null {
  if (fp == null || !Number.isFinite(fp) || yearLadders.length === 0) return null;
  const ranks: number[] = [];
  for (const ladder of yearLadders) {
    if (!ladder.length) continue;
    ranks.push(ladder.filter((x) => x > fp).length + 1);
  }
  if (!ranks.length) return null;
  return Math.round(ranks.reduce((a, b) => a + b, 0) / ranks.length);
}

export function yearLaddersForPos(
  ladders: HistFpLadders | null | undefined,
  position: string,
): number[][] {
  if (!ladders?.by_pos) return [];
  const byYear = ladders.by_pos[position] ?? {};
  const years = ladders.years?.length
    ? ladders.years
    : Object.keys(byYear)
        .map(Number)
        .sort((a, b) => a - b);
  return years
    .map((y) => byYear[String(y)] ?? [])
    .filter((arr) => arr.length > 0);
}

export function histRanksByPlayer(
  players: Array<{
    player_id: string;
    position: string;
    live: { downside_fp: number | null; scenario_fp: number | null };
  }>,
  ladders: HistFpLadders | null | undefined,
): { dn: Map<string, number>; up: Map<string, number> } {
  const dn = new Map<string, number>();
  const up = new Map<string, number>();
  for (const p of players) {
    const years = yearLaddersForPos(ladders, p.position);
    const d = histAvgPosRank(p.live.downside_fp, years);
    const u = histAvgPosRank(p.live.scenario_fp, years);
    if (d != null) dn.set(p.player_id, d);
    if (u != null) up.set(p.player_id, u);
  }
  return { dn, up };
}
