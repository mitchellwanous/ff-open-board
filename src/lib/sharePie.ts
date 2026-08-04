import type { PieSegment } from "@/lib/types";

export type ShareHistCell = {
  pct: number | null;
  /** Team that season — null if unknown. */
  team: string | null;
};

export type PlayerShareHist = Record<
  string,
  Array<{
    season: number;
    kind: string;
    team: string | null;
    target_share: number | null;
    rush_share: number | null;
  }>
>;

/** Build hist map for a pie segment — include other-team seasons as context. */
export function buildShareHistForSeg(
  seg: PieSegment,
  pieKind: "target" | "rush",
  team: string,
  playerHist: PlayerShareHist,
  years: number[],
): Record<number, ShareHistCell> {
  const out: Record<number, ShareHistCell> = {};
  for (const y of years) out[y] = { pct: null, team: null };
  if (seg.kind !== "player" || !seg.player_id) return out;
  const hist = playerHist[seg.player_id] ?? [];
  const key = pieKind === "target" ? "target_share" : "rush_share";
  for (const h of hist) {
    if (h.kind !== "actual") continue;
    if (!years.includes(h.season)) continue;
    const raw = h[key];
    if (raw == null || Number.isNaN(raw)) continue;
    const pct = Math.abs(raw) <= 1.5 ? raw * 100 : raw;
    const prev = out[h.season];
    const isHome = !h.team || h.team === team;
    // Prefer a season spent on the current team when both exist.
    if (prev.pct != null && prev.team === team) continue;
    if (prev.pct != null && !isHome) continue;
    out[h.season] = { pct, team: h.team };
  }
  return out;
}
