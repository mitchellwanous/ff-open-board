/**
 * User-functionality matrix for The FF Collective.
 *
 * Covered by Playwright E2E (tests/user-functionality.spec.ts):
 * 1. Home — meta freeze banner, nav, CTAs, Site feedback
 * 2. Teams index — PPG-ranked table, navigate to team card
 * 3. Team card — offense, pies, claimable Propose, roster→player
 * 4. Players index — position filters, navigate to player card
 * 5. Player card — season outlook, guided edit sheets, share/efficiency
 * 5b. Community outlook — auto-summary from Propose edits (empty until edits exist)
 * 6. Explore / Rankings — defs listed; ranking tables ordered
 * 7. Ranking table — ordered values, deep-link to subject card
 * 8. Edits API — reject locked/OOR/no-doctrine/short rationale; accept valid; outlook why note
 * 9. Edit UI — Propose modal submit → community median updates
 * 10. Cross-links — player→team, ranking→player, team pie→player
 * 11. Position claimables — WR has tgt% not rush% only; QB has rush% not tgt%
 */

export const FIXTURES = {
  team: "BUF",
  softTeam: "ARI",
  wr: { id: "00-0037261", name: "Khalil Shakir", team: "BUF" },
  /** Regression: hist shares as fractions must not render as 0.2%. */
  rice: { id: "00-0039067", name: "Rashee Rice", team: "KC" },
  qb: { id: "00-0034857", name: "Josh Allen", team: "BUF" },
  rb: { id: "00-0037248", name: "James Cook", team: "BUF" },
  rankingTgt: "player-tgt-share",
  rankingPpg: "team-implied-ppg",
} as const;
