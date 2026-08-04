"use client";

import { useEffect, useMemo, useState } from "react";
import { BRAND_CONTRIBUTE_SUCCESS, BRAND_CONTRIBUTE_SUCCESS_LIVE } from "@/lib/brand";
import type { ClaimableField } from "@/lib/types";
import { fmt } from "@/lib/format";
import {
  buildShareHistForSeg,
  type ShareHistCell,
} from "@/lib/sharePie";

export type { ShareHistCell };
export { buildShareHistForSeg };

export type ShareClaimantRow = {
  key: string;
  kind: "player" | "depth";
  playerId: string | null;
  name: string;
  position: string;
  /** Season → hist share on this team (pct 0–100). */
  histBySeason: Record<number, ShareHistCell>;
  shareDn: number | null;
  share: number | null;
  shareCeil: number | null;
  dnField: ClaimableField | null;
  baseField: ClaimableField | null;
  ceilField: ClaimableField | null;
};

type DraftTriple = { dn: string; exp: string; up: string };

function pctDisplay(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return "";
  const pct = Math.abs(v) <= 1.5 ? v * 100 : v;
  return (Math.round(pct * 10) / 10).toFixed(1);
}

function parsePct(raw: string): number | null {
  const n = Number(raw);
  if (Number.isNaN(n)) return null;
  return n > 1.5 ? n / 100 : n;
}

function differs(official: number | null, raw: string): boolean {
  const next = parsePct(raw);
  if (next === null || raw.trim() === "") return false;
  if (official === null) return true;
  const off = Math.abs(official) <= 1.5 ? official : official / 100;
  return Math.abs(next - off) > 0.0005;
}

/**
 * Team pie contribute sheet — hist years per claimant + editable 2026 Dn/Exp/Up.
 * Mirrors player share bucket sheets; submits one edit per changed band.
 */
export function TeamShareContributeSheet({
  team,
  pieKind,
  years,
  rows,
  onClose,
  onSubmitted,
}: {
  team: string;
  pieKind: "target" | "rush";
  years: number[];
  rows: ShareClaimantRow[];
  onClose: () => void;
  onSubmitted?: () => void;
}) {
  const initials = useMemo(() => {
    const m: Record<string, DraftTriple> = {};
    for (const r of rows) {
      m[r.key] = {
        dn: pctDisplay(r.shareDn),
        exp: pctDisplay(r.share),
        up: pctDisplay(r.shareCeil),
      };
    }
    return m;
  }, [rows]);

  const [drafts, setDrafts] = useState(initials);
  const [confidence, setConfidence] = useState<"low" | "med" | "high">("med");
  const [rationale, setRationale] = useState("");
  const [author, setAuthor] = useState("anonymous");
  const [doctrineOk, setDoctrineOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDrafts(initials);
  }, [initials]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const title =
    pieKind === "target"
      ? `Contribute to target share · ${team}`
      : `Contribute to rush share · ${team}`;

  const changedCount = useMemo(() => {
    let n = 0;
    for (const r of rows) {
      const d = drafts[r.key];
      if (!d) continue;
      if (r.dnField && r.shareDn != null && differs(toShare(r.shareDn), d.dn))
        n += 1;
      if (r.baseField && differs(toShare(r.share), d.exp)) n += 1;
      if (r.ceilField && r.shareCeil != null && differs(toShare(r.shareCeil), d.up))
        n += 1;
    }
    return n;
  }, [rows, drafts]);

  function setCell(key: string, band: keyof DraftTriple, value: string) {
    setDrafts((prev) => ({
      ...prev,
      [key]: { ...prev[key], [band]: value },
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    if (changedCount === 0) {
      setError("Change at least one value before submitting.");
      return;
    }
    if (!rationale.trim() || rationale.trim().length < 8) {
      setError("Add a short rationale (at least a sentence).");
      return;
    }
    if (!doctrineOk) {
      setError("Confirm you've read the descriptions.");
      return;
    }

    type Job = {
      grain: "team" | "player";
      subjectId: string;
      subjectLabel: string;
      field: ClaimableField;
      official: number | null;
      value: number;
    };
    const jobs: Job[] = [];
    for (const r of rows) {
      const d = drafts[r.key];
      if (!d) continue;
      if (r.dnField && r.shareDn != null && differs(toShare(r.shareDn), d.dn)) {
        const value = parsePct(d.dn);
        if (value == null) {
          setError(`Invalid downside for ${r.name}.`);
          return;
        }
        if (value < r.dnField.min || value > r.dnField.max) {
          setError(`${r.name} downside out of range.`);
          return;
        }
        jobs.push({
          grain: "player",
          subjectId: r.playerId!,
          subjectLabel: r.name,
          field: r.dnField,
          official: toShare(r.shareDn),
          value,
        });
      }
      if (r.baseField && differs(toShare(r.share), d.exp)) {
        const value = parsePct(d.exp);
        if (value == null) {
          setError(`Invalid expected for ${r.name}.`);
          return;
        }
        if (value < r.baseField.min || value > r.baseField.max) {
          setError(`${r.name} expected out of range.`);
          return;
        }
        jobs.push({
          grain: r.kind === "depth" ? "team" : "player",
          subjectId: r.kind === "depth" ? team : r.playerId!,
          subjectLabel: r.kind === "depth" ? `${team} Other` : r.name,
          field: r.baseField,
          official: toShare(r.share),
          value,
        });
      }
      if (r.ceilField && r.shareCeil != null && differs(toShare(r.shareCeil), d.up)) {
        const value = parsePct(d.up);
        if (value == null) {
          setError(`Invalid upside for ${r.name}.`);
          return;
        }
        if (value < r.ceilField.min || value > r.ceilField.max) {
          setError(`${r.name} upside out of range.`);
          return;
        }
        jobs.push({
          grain: "player",
          subjectId: r.playerId!,
          subjectLabel: r.name,
          field: r.ceilField,
          official: toShare(r.shareCeil),
          value,
        });
      }
    }

    setBusy(true);
    try {
      let lastBoardMessage: string | null = null;
      for (const job of jobs) {
        const res = await fetch("/api/edits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grain: job.grain,
            subject_id: job.subjectId,
            subject_label: job.subjectLabel,
            field: job.field.field,
            field_label: job.field.label,
            official_value: job.official,
            value: job.value,
            confidence,
            rationale: rationale.trim(),
            doctrine_ok: true,
            author: author.trim() || "anonymous",
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Submit failed");
        if (typeof data.board_message === "string") {
          lastBoardMessage = data.board_message;
        }
      }
      setOk(
        lastBoardMessage ??
          (jobs.length === 1
            ? BRAND_CONTRIBUTE_SUCCESS
            : `${jobs.length} inputs in — ${BRAND_CONTRIBUTE_SUCCESS_LIVE}`),
      );
      onSubmitted?.();
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("ff-edits-updated", {
            detail: { grain: "team", subjectId: team },
          }),
        );
      }
      setTimeout(onClose, 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setBusy(false);
    }
  }

  const expSum = rows.reduce((acc, r) => {
    const d = drafts[r.key]?.exp;
    const n = Number(d);
    return acc + (Number.isNaN(n) ? 0 : n);
  }, 0);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal outlook-modal modal--wide"
        style={{
          width: "min(960px, 100%)",
          maxHeight: "90vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-share-sheet-title"
      >
        <h2 id="team-share-sheet-title">{title}</h2>
        <p className="modal-meta">
          Change only what you disagree with · {changedCount} field
          {changedCount === 1 ? "" : "s"} changed
        </p>
        <p className="edit-sheet-lead">
          Hist years on the left. Edit 2026{" "}
          <strong>Downside / Expected / Upside</strong>. Expected + Other ≈
          100%. Upside bands are not a joint 100%.
        </p>
        <p className="edit-sheet-meta edit-hist-legend">
          <span className="edit-hist-legend__home">Default</span> = share while
          on {team}.{" "}
          <span className="edit-hist-legend__away">Amber + team tag</span> =
          same season on another club (context only).
        </p>

        <form onSubmit={submit}>
          <div className="table-wrap edit-hist-wrap edit-sheet-block">
            <table className="data edit-hist-table">
              <thead>
                <tr>
                  <th>Claimant</th>
                  {years.map((y) => (
                    <th key={y} className="right">
                      {y}
                    </th>
                  ))}
                  <th className="right edit-hist-table__proj">
                    Downside
                    <span className="edit-hist-table__proj-sub">2026</span>
                  </th>
                  <th className="right edit-hist-table__proj">
                    Expected
                    <span className="edit-hist-table__proj-sub">2026</span>
                  </th>
                  <th className="right edit-hist-table__proj">
                    Upside
                    <span className="edit-hist-table__proj-sub">2026</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const d = drafts[r.key] ?? { dn: "", exp: "", up: "" };
                  return (
                    <tr key={r.key}>
                      <td className="edit-hist-table__label">
                        {r.name}
                        <div className="faint" style={{ fontSize: "0.75rem" }}>
                          {r.kind === "depth" ? "rest of roster" : r.position}
                        </div>
                      </td>
                      {years.map((y) => {
                        const cell = r.histBySeason[y];
                        const away =
                          cell?.pct != null &&
                          cell.team != null &&
                          cell.team !== team;
                        return (
                          <td
                            key={y}
                            className={`right num${away ? " edit-hist-table__away" : ""}`}
                            title={
                              away
                                ? `${fmt(cell.pct, 1)}% on ${cell.team}`
                                : undefined
                            }
                          >
                            {cell?.pct == null ? (
                              "—"
                            ) : (
                              <>
                                {fmt(cell.pct, 1)}%
                                {away ? (
                                  <div className="edit-hist-table__away-tag">
                                    {cell.team}
                                  </div>
                                ) : null}
                              </>
                            )}
                          </td>
                        );
                      })}
                      <td className="right edit-hist-table__proj">
                        {r.dnField && r.shareDn != null ? (
                          <div className="edit-hist-table__input-wrap">
                            <input
                              className="num edit-hist-table__input"
                              value={d.dn}
                              onChange={(e) =>
                                setCell(r.key, "dn", e.target.value)
                              }
                              aria-label={`${r.name} downside`}
                            />
                            <span className="edit-hist-table__suffix">%</span>
                          </div>
                        ) : (
                          <span className="faint">—</span>
                        )}
                      </td>
                      <td className="right edit-hist-table__proj">
                        {r.baseField ? (
                          <div className="edit-hist-table__input-wrap">
                            <input
                              className="num edit-hist-table__input"
                              value={d.exp}
                              onChange={(e) =>
                                setCell(r.key, "exp", e.target.value)
                              }
                              aria-label={`${r.name} expected`}
                            />
                            <span className="edit-hist-table__suffix">%</span>
                          </div>
                        ) : (
                          <span className="faint">—</span>
                        )}
                      </td>
                      <td className="right edit-hist-table__proj">
                        {r.ceilField && r.shareCeil != null ? (
                          <div className="edit-hist-table__input-wrap">
                            <input
                              className="num edit-hist-table__input"
                              value={d.up}
                              onChange={(e) =>
                                setCell(r.key, "up", e.target.value)
                              }
                              aria-label={`${r.name} upside`}
                            />
                            <span className="edit-hist-table__suffix">%</span>
                          </div>
                        ) : (
                          <span className="faint">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p
            className={Math.abs(expSum - 100) <= 3 ? "muted" : "err"}
            style={{ fontSize: "0.85rem" }}
          >
            Expected sum (draft): {fmt(expSum, 1)}%{" "}
            {Math.abs(expSum - 100) <= 3
              ? "(≈ 100% ✓)"
              : "(should be near 100%)"}
          </p>

          <div className="edit-sheet-form">
            <div className="field">
              <label htmlFor={`share-${pieKind}-confidence`}>Confidence</label>
              <select
                id={`share-${pieKind}-confidence`}
                value={confidence}
                onChange={(e) =>
                  setConfidence(e.target.value as "low" | "med" | "high")
                }
              >
                <option value="low">Low</option>
                <option value="med">Med</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor={`share-${pieKind}-rationale`}>Rationale</label>
              <textarea
                id={`share-${pieKind}-rationale`}
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                placeholder="Why should these shares change for the collective model?"
              />
            </div>
            <div className="field">
              <label htmlFor={`share-${pieKind}-author`}>Name / handle</label>
              <input
                id={`share-${pieKind}-author`}
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </div>
            <label className="doctrine-check">
              <input
                type="checkbox"
                checked={doctrineOk}
                onChange={(e) => setDoctrineOk(e.target.checked)}
              />
              <span>
                I read the descriptions — I&apos;m contributing full-season
                inputs with the depth chart mostly healthy (not a short injury
                spike).
              </span>
            </label>
            {error ? <p className="err">{error}</p> : null}
            {ok ? <p className="ok">{ok}</p> : null}
            <div className="edit-sheet-actions">
              <button type="submit" className="btn primary" disabled={busy}>
                {busy
                  ? "Saving…"
                  : changedCount > 1
                    ? `Submit ${changedCount} contributions`
                    : "Submit contribution"}
              </button>
              <button type="button" className="btn" onClick={onClose}>
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function toShare(pctOrShare: number | null | undefined): number | null {
  if (pctOrShare == null || Number.isNaN(pctOrShare)) return null;
  return Math.abs(pctOrShare) > 1.5 ? pctOrShare / 100 : pctOrShare;
}
