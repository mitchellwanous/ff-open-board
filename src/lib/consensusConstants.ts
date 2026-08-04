/** Live consensus contract — drives the public board. */

/** Contributions needed before consensus overrides the freeze seed. */
export const CONSENSUS_MIN_N = 3;

/** Confidence → vote weight for weighted median. */
export const CONFIDENCE_WEIGHT: Record<"low" | "med" | "high", number> = {
  low: 1,
  med: 2,
  high: 3,
};

/** Soft outlier gate vs freeze seed (fraction). Beyond this → exclude from median. */
export const OUTLIER_FRAC = 0.5;

export const TEAM_GAMES = 17;

/** ESPN half-PPR weights (lab model/config.py). */
export const HALF_PPR = {
  passYd: 0.04,
  passTd: 4,
  int: -2,
  rushYd: 0.1,
  recYd: 0.1,
  rec: 0.5,
  td: 6,
} as const;
