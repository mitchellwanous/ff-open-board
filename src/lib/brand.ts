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
  "Crowdsourced fantasy football projections. The collective is stronger than one. We're building the best half-PPR board in public — contribute an input; after a few contributions the board updates; we audit for spam.";

/** Shared list/index callout — Players, Teams, Compare */
export const BRAND_CONTRIBUTE_CALLOUT =
  "Disagree with an input? Open the page, inspect the pieces, and contribute a better number with a short reason. After 3 contributions on a field, the board uses the crowd median — we still reject spam.";

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
    title: "The board updates",
    body: "after 3 contributions on a field, fantasy points move for everyone; we audit for spam.",
  },
];

/** After a successful contribution submit (sheets + contribute modal). */
export const BRAND_CONTRIBUTE_SUCCESS =
  "Contribution in — after 3 on this field, the board uses the crowd median.";

/** Fallback when vote count is unknown client-side. */
export const BRAND_CONTRIBUTE_SUCCESS_LIVE =
  "Board updated — this field now uses the crowd median.";

/** Team pie intro — named shares are collective inputs. */
export const BRAND_TEAM_PIE_INTRO =
  "Named target and rush shares are collective inputs — contribute downside / expected / upside on each claimant. After 3 contributions, Expected uses the crowd median and teammate shares rebalance so named + Other sum to 100%.";

/** One-line rule for home / help. */
export const BRAND_LIVE_RULE =
  "After 3 people contribute on the same input, the board uses the middle number. Spam still gets rejected.";

/** Published player-math writeup (Summary / Base / Upside / Limits). */
export const BRAND_PLAYER_MATH_TITLE = "Player math";
export const BRAND_PLAYER_MATH_SUB =
  "How we get to the fantasy total — and what would move it.";
export const BRAND_PLAYER_MATH_CTA =
  "Want to improve a piece of this projection? Contribute below.";

/** Gated contribute entry on player cards (math first, then pieces). */
export const BRAND_CONTRIBUTE_CTA = "Contribute to this projection";
export const BRAND_CONTRIBUTE_CHOOSER_TITLE =
  "Which piece do you want to contribute to?";
export const BRAND_CONTRIBUTE_CHOOSER_SUB =
  "Fantasy points come from team offense, player share, and player efficiency. Open any piece — you can come back and contribute to more than one.";
export const BRAND_CONTRIBUTE_PIECES: ReadonlyArray<{
  id: "offense" | "share" | "efficiency";
  title: string;
  body: string;
}> = [
  {
    id: "offense",
    title: "Team offense",
    body: "How many points this offense scores",
  },
  {
    id: "share",
    title: "Player share",
    body: "The team target pie — his slice and who he’s fighting with",
  },
  {
    id: "efficiency",
    title: "Player efficiency",
    body: "What he does when he gets the ball",
  },
];
