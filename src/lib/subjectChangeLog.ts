/**
 * Per-subject change log: published board moves + recent contributions.
 */

import { CONSENSUS_MIN_N } from "./consensusConstants";
import { latestVotesPerAuthor } from "./consensus";
import { getBoardChangeLog, getClaimableFields } from "./data";
import { listEdits } from "./edits";
import { displayClaimValue } from "./format";
import type { OpenSourceEdit } from "./types";

export type SubjectChangeRow = {
  at: string;
  kind: "board" | "contribution";
  field: string;
  field_label: string;
  /** Plain one-line summary for the list. */
  summary: string;
  detail?: string | null;
};

function fieldMeta(field: string): { label: string; unit: string } {
  const def = getClaimableFields().find((f) => f.field === field);
  return {
    label: def?.label ?? field.replace(/_/g, " "),
    unit: def?.unit ?? "yp",
  };
}

function asNumber(v: number | string | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function fmtWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatVal(field: string, value: number | null): string {
  if (value == null) return "—";
  const { unit } = fieldMeta(field);
  return displayClaimValue(field, value, unit);
}

/**
 * Build newest-first change rows for one player or team card.
 */
export async function getSubjectChangeLog(
  grain: "team" | "player",
  subjectId: string,
): Promise<SubjectChangeRow[]> {
  const rows: SubjectChangeRow[] = [];
  const id =
    grain === "team" ? subjectId.toUpperCase() : subjectId;

  for (const e of getBoardChangeLog()) {
    if (e.grain !== grain) continue;
    if (String(e.subject_id) !== id && String(e.subject_id) !== subjectId)
      continue;
    if (!e.field || e.field === "general_feedback" || e.field === "app_feedback")
      continue;
    const { label } = fieldMeta(e.field);
    const oldV = asNumber(e.old_value);
    const newV = asNumber(e.new_value);
    rows.push({
      at: e.logged_at,
      kind: "board",
      field: e.field,
      field_label: label,
      summary: `${label} ${formatVal(e.field, oldV)} → ${formatVal(e.field, newV)}`,
      detail: null,
    });
  }

  const edits = (
    await listEdits({
      grain,
      subject_id: id,
      status: ["pending", "reviewed"],
    })
  ).filter(
    (e) =>
      e.value != null &&
      e.field !== "general_feedback" &&
      e.field !== "app_feedback",
  );

  // Group by field for n-of-3 context; list latest vote per author as events
  const byField = new Map<string, OpenSourceEdit[]>();
  for (const e of edits) {
    const list = byField.get(e.field) ?? [];
    list.push(e);
    byField.set(e.field, list);
  }

  for (const [field, fieldEdits] of byField) {
    const votes = latestVotesPerAuthor(fieldEdits, field);
    const n = votes.length;
    const { label } = fieldMeta(field);
    for (const e of votes) {
      rows.push({
        at: e.created_at,
        kind: "contribution",
        field,
        field_label: label,
        summary: `${label} → ${formatVal(field, e.value)}`,
        detail:
          n >= CONSENSUS_MIN_N
            ? "Counts toward the live board (middle number)."
            : `${n} of ${CONSENSUS_MIN_N} takes on this input so far.`,
      });
    }
  }

  return rows
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 20)
    .map((r) => ({ ...r, at: fmtWhen(r.at) }));
}
