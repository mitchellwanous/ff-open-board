"use client";

import { useEffect, useMemo, useState } from "react";
import type { ClaimableField } from "@/lib/types";
import { BRAND_CONTRIBUTE_SUCCESS } from "@/lib/brand";
import { displayClaimValue } from "@/lib/format";

type Props = {
  grain: "team" | "player";
  subjectId: string;
  subjectLabel: string;
  field: ClaimableField;
  officialValue: number | null;
  onSubmitted?: () => void;
  buttonLabel?: string;
  buttonClassName?: string;
};

function isShareField(field: ClaimableField) {
  return (
    field.unit === "share" ||
    field.field.includes("share") ||
    field.field === "pass_rate" ||
    field.field.endsWith("_rate") ||
    field.field === "catch_pct" ||
    field.field === "int_rate"
  );
}

/** Prefer clean percent entry for shares (17.4), otherwise rounded absolute. */
function defaultInputValue(
  field: ClaimableField,
  officialValue: number | null,
): string {
  if (officialValue === null || Number.isNaN(officialValue)) return "";
  if (isShareField(field)) {
    const pct = Math.abs(officialValue) <= 1.5 ? officialValue * 100 : officialValue;
    return (Math.round(pct * 10) / 10).toFixed(1);
  }
  if (field.unit === "rank") return String(Math.round(officialValue));
  if (field.unit === "mult") return (Math.round(officialValue * 1000) / 1000).toFixed(3);
  if (field.unit === "yp") return (Math.round(officialValue * 100) / 100).toFixed(2);
  return (Math.round(officialValue * 10) / 10).toFixed(1);
}

export function ProposeButton(props: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={props.buttonClassName ?? "btn primary"}
        onClick={() => setOpen(true)}
      >
        {props.buttonLabel ?? "Contribute"}
      </button>
      {open ? (
        <ProposeModal {...props} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}

function ProposeModal({
  grain,
  subjectId,
  subjectLabel,
  field,
  officialValue,
  onClose,
  onSubmitted,
}: Props & { onClose: () => void }) {
  const defaultDisplay = useMemo(
    () => defaultInputValue(field, officialValue),
    [officialValue, field],
  );

  const [raw, setRaw] = useState(defaultDisplay);
  const [confidence, setConfidence] = useState<"low" | "med" | "high">("med");
  const [rationale, setRationale] = useState("");
  const [author, setAuthor] = useState("anonymous");
  const [doctrineOk, setDoctrineOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    let value = Number(raw);
    if (Number.isNaN(value)) {
      setError("Enter a numeric value.");
      return;
    }
    // Allow percent entry for shares (e.g. 18.5 → 0.185)
    if (isShareField(field) && value > 1.5) {
      value = value / 100;
    }
    if (value < field.min || value > field.max) {
      setError(
        isShareField(field)
          ? `Value must be between ${(field.min * 100).toFixed(0)}% and ${(field.max * 100).toFixed(0)}% (or 0–1 share).`
          : `Value must be between ${field.min} and ${field.max}.`,
      );
      return;
    }
    if (!rationale.trim() || rationale.trim().length < 8) {
      setError("Add a short rationale (at least a sentence).");
      return;
    }
    if (!doctrineOk) {
      setError("Confirm you've read the field description.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/edits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grain,
          subject_id: subjectId,
          subject_label: subjectLabel,
          field: field.field,
          field_label: field.label,
          official_value: officialValue,
          value,
          confidence,
          rationale: rationale.trim(),
          doctrine_ok: true,
          author: author.trim() || "anonymous",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submit failed");
      setOk(
        typeof data.board_message === "string"
          ? data.board_message
          : BRAND_CONTRIBUTE_SUCCESS,
      );
      onSubmitted?.();
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("ff-edits-updated", {
            detail: { grain, subjectId },
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

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="propose-title"
      >
        <h2 id="propose-title">Contribute an input</h2>
        <p className="modal-meta">
          {subjectLabel} · {field.label}
        </p>
        <div className="modal-official">
          <div className="official-value">
            Current{" "}
            <span className="num">
              {displayClaimValue(field.field, officialValue, field.unit)}
            </span>
          </div>
          <div className="official-doctrine">{field.doctrine}</div>
        </div>
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="propose-value">
              Your value {isShareField(field) ? "(percent)" : "(absolute)"}
            </label>
            <input
              id="propose-value"
              className="num"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder={isShareField(field) ? "17.4" : String(field.min)}
              autoFocus
            />
            {isShareField(field) ? (
              <p className="hint">Enter like 17.4 for 17.4% (or 0.174 as share).</p>
            ) : null}
          </div>
          <div className="field">
            <label htmlFor="propose-confidence">Confidence</label>
            <select
              id="propose-confidence"
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
            <label htmlFor="propose-rationale">Rationale</label>
            <textarea
              id="propose-rationale"
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Why should this input change for the collective model?"
            />
          </div>
          <div className="field">
            <label htmlFor="propose-author">Name / handle</label>
            <input
              id="propose-author"
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
              I read the description — I&apos;m contributing a full-season input
              with the depth chart mostly healthy (not a short injury spike).
            </span>
          </label>
          {error ? <p className="err">{error}</p> : null}
          {ok ? <p className="ok">{ok}</p> : null}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="submit" className="btn primary" disabled={busy}>
              {busy ? "Saving…" : "Submit contribution"}
            </button>
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
