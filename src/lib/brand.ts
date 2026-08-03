/** Site brand — display name, catchphrase, and supporting lines. */

export const BRAND_NAME = "The FF Collective";
export const BRAND_SHORT = "FF Collective";
/** Punch line under the name */
export const BRAND_CATCHPHRASE = "The collective is stronger than one.";
/** Category line — what this is */
export const BRAND_TAGLINE = "Crowdsourced fantasy football projections.";
export const BRAND_FORMULA =
  "team offense + player share + player efficiency = fantasy points";
export const BRAND_DESCRIPTION =
  "Crowdsourced fantasy football projections. The collective is stronger than one. We're building the best half-PPR board in public — contribute an input, we review and republish together.";

/** Shared list/index callout — Players, Teams, Compare */
export const BRAND_CONTRIBUTE_CALLOUT =
  "Disagree with an input? Open the page, inspect the pieces, and contribute a better number with a short reason. We review contributions and republish daily so the collective model improves.";

export const BRAND_CONTRIBUTE_LOOP_LABEL = "How contributing works";

/** Player-card contribute loop (same shape as home, scoped to one projection). */
export const BRAND_PLAYER_CONTRIBUTE_LOOP: ReadonlyArray<{
  title: string;
  body: string;
}> = [
  {
    title: "Inspect the pieces",
    body: "team offense, player share, and player efficiency behind this fantasy total.",
  },
  {
    title: "Contribute an input",
    body: "change only what you disagree with and leave a short reason.",
  },
  {
    title: "We review and republish",
    body: "accepted inputs update the collective model for everyone.",
  },
];

/** After a successful contribution submit (sheets + contribute modal). */
export const BRAND_CONTRIBUTE_SUCCESS =
  "Contribution submitted — we review and republish daily.";

/** Team pie intro — named shares are collective inputs. */
export const BRAND_TEAM_PIE_INTRO =
  "Named target and rush shares are collective inputs — contribute downside / expected / upside on each claimant. Named + Other should sum near 100% on expected.";
