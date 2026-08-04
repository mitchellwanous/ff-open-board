/**
 * Hybrid share-pie renorm for live Expected unlocks.
 *
 * When base target_share / rush_share consensus locks a player (or Other):
 *   1. Locked slots keep their unlocked consensus values (cap Σ locks ≤ 0.97)
 *   2. Cut from unlocked in order: same-position → Other/depth → other positions
 *   3. Pie sums to 1.0
 *
 * Bands (dn/ceil) are not renormed here.
 */

export type PieSlot = {
  id: string;
  /** Player position (WR/TE/RB/QB) or "OTHER" for depth. */
  position: string;
  kind: "player" | "other";
  /** Pre-renorm share as a fraction in [0, 1]. */
  share: number;
  locked: boolean;
};

const LOCK_CAP = 0.97;

function clamp01(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return n > 1 ? 1 : n;
}

function sumShares(slots: PieSlot[]): number {
  return slots.reduce((s, x) => s + clamp01(x.share), 0);
}

function scaleGroup(slots: PieSlot[], ids: Set<string>, factor: number): void {
  for (const s of slots) {
    if (ids.has(s.id)) s.share = clamp01(s.share * factor);
  }
}

/**
 * Take `cut` share points from `ids` proportionally to current shares.
 * Returns how much was actually taken.
 */
function takeFromGroup(
  slots: PieSlot[],
  ids: Set<string>,
  cut: number,
): number {
  if (cut <= 1e-12 || ids.size === 0) return 0;
  let groupSum = 0;
  for (const s of slots) {
    if (ids.has(s.id)) groupSum += s.share;
  }
  if (groupSum <= 1e-12) return 0;
  const take = Math.min(cut, groupSum);
  const factor = (groupSum - take) / groupSum;
  scaleGroup(slots, ids, factor);
  return take;
}

/**
 * Hybrid renorm in place. Returns new slot shares (mutates copies).
 */
export function hybridRenormPie(input: PieSlot[]): PieSlot[] {
  const slots: PieSlot[] = input.map((s) => ({
    ...s,
    share: clamp01(s.share),
    position: s.position || (s.kind === "other" ? "OTHER" : "UNK"),
  }));

  const locked = slots.filter((s) => s.locked);
  const unlocked = slots.filter((s) => !s.locked);

  let lockSum = sumShares(locked);
  if (unlocked.length === 0) {
    if (lockSum <= 1e-12) return slots;
    const f = 1 / lockSum;
    for (const s of locked) s.share = clamp01(s.share * f);
    return slots;
  }

  if (lockSum > LOCK_CAP) {
    const f = LOCK_CAP / lockSum;
    for (const s of locked) s.share = clamp01(s.share * f);
    lockSum = LOCK_CAP;
  }

  const remain = 1 - lockSum;
  const unlockedSum = sumShares(unlocked);
  const cut = unlockedSum - remain;

  if (Math.abs(cut) <= 1e-9) {
    // Already matches; tiny float fix
    if (unlockedSum > 1e-12 && Math.abs(unlockedSum - remain) > 1e-9) {
      const f = remain / unlockedSum;
      for (const s of unlocked) s.share = clamp01(s.share * f);
    }
    return slots;
  }

  if (cut < 0) {
    // Locks released room — scale all unlocked up proportionally
    if (unlockedSum > 1e-12) {
      const f = remain / unlockedSum;
      for (const s of unlocked) s.share = clamp01(s.share * f);
    } else {
      const each = remain / unlocked.length;
      for (const s of unlocked) s.share = each;
    }
    return slots;
  }

  // cut > 0: take from unlocked in hybrid order
  const lockedPositions = new Set(
    locked.filter((s) => s.kind === "player").map((s) => s.position),
  );

  const samePos = new Set(
    unlocked
      .filter((s) => s.kind === "player" && lockedPositions.has(s.position))
      .map((s) => s.id),
  );
  const other = new Set(
    unlocked.filter((s) => s.kind === "other").map((s) => s.id),
  );
  const rest = new Set(
    unlocked
      .filter((s) => !samePos.has(s.id) && !other.has(s.id))
      .map((s) => s.id),
  );

  let remainingCut = cut;
  for (const tier of [samePos, other, rest]) {
    remainingCut -= takeFromGroup(slots, tier, remainingCut);
    if (remainingCut <= 1e-12) break;
  }

  // Exact remain on unlocked
  const uSum = sumShares(slots.filter((s) => !s.locked));
  if (uSum > 1e-12 && Math.abs(uSum - remain) > 1e-8) {
    const f = remain / uSum;
    for (const s of slots) {
      if (!s.locked) s.share = clamp01(s.share * f);
    }
  }

  return slots;
}

/** Sum of slot shares (for tests / assertions). */
export function pieSum(slots: PieSlot[]): number {
  return sumShares(slots);
}
