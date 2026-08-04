/**
 * Consensus aggregation for live collective inputs.
 * One vote per author (latest), weighted median, min_n gate, soft outlier filter.
 */

import type { OpenSourceEdit } from "./types";
import {
  CONFIDENCE_WEIGHT,
  CONSENSUS_MIN_N,
  OUTLIER_FRAC,
} from "./consensusConstants";

export type ConsensusPoint = {
  /** Effective value (consensus if unlocked, else seed). */
  value: number;
  /** Raw weighted median of eligible votes (null if none). */
  median: number | null;
  n: number;
  /** True when n >= CONSENSUS_MIN_N and median replaces seed. */
  unlocked: boolean;
  seed: number;
};

function confWeight(c: OpenSourceEdit["confidence"]): number {
  return CONFIDENCE_WEIGHT[c] ?? CONFIDENCE_WEIGHT.med;
}

/**
 * Keep latest numeric edit per author for a single field.
 * Eligible statuses: pending + reviewed (rejected excluded — spam lane).
 */
export function latestVotesPerAuthor(
  edits: OpenSourceEdit[],
  field: string,
): OpenSourceEdit[] {
  const byAuthor = new Map<string, OpenSourceEdit>();
  const eligible = edits
    .filter(
      (e) =>
        e.field === field &&
        e.value != null &&
        !Number.isNaN(e.value) &&
        e.status !== "rejected",
    )
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  for (const e of eligible) {
    const key = (e.author || "anonymous").trim().toLowerCase() || "anonymous";
    byAuthor.set(key, e);
  }
  return [...byAuthor.values()];
}

/** Weighted median; weights are positive integers (confidence). */
export function weightedMedian(
  points: Array<{ value: number; weight: number }>,
): number | null {
  if (!points.length) return null;
  const expanded: number[] = [];
  for (const p of points) {
    const w = Math.max(1, Math.round(p.weight));
    for (let i = 0; i < w; i++) expanded.push(p.value);
  }
  expanded.sort((a, b) => a - b);
  const mid = Math.floor(expanded.length / 2);
  return expanded.length % 2 === 0
    ? (expanded[mid - 1] + expanded[mid]) / 2
    : expanded[mid];
}

function passesOutlierGate(
  value: number,
  seed: number | null,
): boolean {
  if (seed == null || Number.isNaN(seed)) return true;
  if (Math.abs(seed) < 1e-9) return Math.abs(value) < 0.25;
  const frac = Math.abs(value - seed) / Math.abs(seed);
  return frac <= OUTLIER_FRAC;
}

/**
 * Resolve effective value for one field given seed + edits on that subject.
 */
export function resolveConsensus(
  edits: OpenSourceEdit[],
  field: string,
  seed: number | null,
): ConsensusPoint | null {
  if (seed == null || Number.isNaN(seed)) {
    const votes = latestVotesPerAuthor(edits, field);
    if (!votes.length) return null;
    const median = weightedMedian(
      votes.map((v) => ({ value: v.value as number, weight: confWeight(v.confidence) })),
    );
    if (median == null) return null;
    const n = votes.length;
    const unlocked = n >= CONSENSUS_MIN_N;
    return {
      value: unlocked ? median : median,
      median,
      n,
      unlocked,
      seed: median,
    };
  }

  const votes = latestVotesPerAuthor(edits, field).filter((v) =>
    passesOutlierGate(v.value as number, seed),
  );
  const n = votes.length;
  const median =
    n === 0
      ? null
      : weightedMedian(
          votes.map((v) => ({
            value: v.value as number,
            weight: confWeight(v.confidence),
          })),
        );
  const unlocked = n >= CONSENSUS_MIN_N && median != null;
  return {
    value: unlocked ? (median as number) : seed,
    median,
    n,
    unlocked,
    seed,
  };
}

/**
 * Build field → ConsensusPoint map for a subject.
 * Only includes fields that have at least one eligible vote OR that you pass seeds for.
 */
export function consensusMapForSubject(
  edits: OpenSourceEdit[],
  seeds: Record<string, number | null>,
): Record<string, ConsensusPoint> {
  const fields = new Set<string>([
    ...Object.keys(seeds),
    ...edits.map((e) => e.field),
  ]);
  const out: Record<string, ConsensusPoint> = {};
  for (const field of fields) {
    if (field === "general_feedback" || field === "app_feedback") continue;
    const seed = seeds[field] ?? null;
    const point = resolveConsensus(edits, field, seed);
    if (point) out[field] = point;
  }
  return out;
}

/** Legacy-shaped community map for UI that expects { median, n }. */
export function toCommunityShape(
  map: Record<string, ConsensusPoint>,
): Record<string, { median: number; n: number; unlocked: boolean }> {
  const out: Record<string, { median: number; n: number; unlocked: boolean }> =
    {};
  for (const [k, v] of Object.entries(map)) {
    if (v.n <= 0 || v.median == null) continue;
    out[k] = {
      median: v.unlocked ? v.value : v.median,
      n: v.n,
      unlocked: v.unlocked,
    };
  }
  return out;
}
