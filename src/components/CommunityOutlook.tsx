"use client";

import { useEffect, useState } from "react";
import {
  GENERAL_FEEDBACK_FIELD,
  GENERAL_FEEDBACK_MAX,
  GENERAL_FEEDBACK_MIN,
} from "@/lib/feedback";

export const EDITS_UPDATED_EVENT = "ff-edits-updated";

type Props = {
  grain: "team" | "player";
  subjectId: string;
  subjectLabel: string;
  /** Published distilled why from the freeze export. */
  communityNote?: string | null;
  /**
   * When set, primary CTA goes here (e.g. `#suggest`) to contribute projection
   * inputs. Written season-take feedback stays available as a secondary action.
   */
  editHref?: string;
};

export function CommunityOutlook({
  grain,
  subjectId,
  subjectLabel,
  communityNote,
  editHref,
}: Props) {
  const [open, setOpen] = useState(false);
  const note = (communityNote ?? "").trim();
  const isTeam = grain === "team";
  const editLabel = isTeam ? "Contribute to team projection" : "Contribute to projection";
  const outlookLabel = isTeam ? "Add team outlook" : "Add player outlook";

  return (
    <section className="outlook" aria-labelledby="community-outlook-heading">
      <div className="outlook-head">
        <div>
          <h2 id="community-outlook-heading" className="outlook-title">
            Community outlook
          </h2>
          <p className="outlook-sub">
            What to expect in 2026 and why — updated when the board republishes.
            {editHref
              ? ` Use ${editLabel} for numbers, or ${outlookLabel} for a plain-language take.`
              : ` Use ${outlookLabel} for open-source input.`}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            gap: "0.4rem",
          }}
        >
          {editHref ? (
            <a href={editHref} className="btn primary">
              {editLabel}
            </a>
          ) : (
            <button
              type="button"
              className="btn primary"
              onClick={() => setOpen(true)}
            >
              {outlookLabel}
            </button>
          )}
          {editHref ? (
            <button
              type="button"
              className="btn"
              onClick={() => setOpen(true)}
            >
              {outlookLabel}
            </button>
          ) : null}
        </div>
      </div>

      {note ? (
        <p className="outlook-body">{note}</p>
      ) : (
        <p className="outlook-empty">
          No community outlook published yet for 2026.{" "}
          {editHref
            ? "Contribute to the projection below or add a season take"
            : "Contribute numbers below or add a season take"}{" "}
          — we review contributions and republish daily with a plain-language
          why for this {isTeam ? "team" : "player"}.
        </p>
      )}

      {open ? (
        <FeedbackModal
          grain={grain}
          subjectId={subjectId}
          subjectLabel={subjectLabel}
          onClose={() => setOpen(false)}
          onSaved={() => setOpen(false)}
        />
      ) : null}
    </section>
  );
}

function FeedbackModal({
  grain,
  subjectId,
  subjectLabel,
  onClose,
  onSaved,
}: {
  grain: "team" | "player";
  subjectId: string;
  subjectLabel: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("anonymous");
  const [doctrineOk, setDoctrineOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isTeam = grain === "team";

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
    const trimmed = text.trim();
    if (
      trimmed.length < GENERAL_FEEDBACK_MIN ||
      trimmed.length > GENERAL_FEEDBACK_MAX
    ) {
      setError(
        `Use ${GENERAL_FEEDBACK_MIN}–${GENERAL_FEEDBACK_MAX} characters (now ${trimmed.length}).`,
      );
      return;
    }
    if (!doctrineOk) {
      setError("Confirm the guide below.");
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
          field: GENERAL_FEEDBACK_FIELD,
          text: trimmed,
          doctrine_ok: true,
          author: author.trim() || "anonymous",
          confidence: "med",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Could not save.");
        return;
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent(EDITS_UPDATED_EVENT, {
            detail: { grain, subjectId },
          }),
        );
      }
      onSaved();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal outlook-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
      >
        <h2 id="feedback-modal-title">
          {isTeam ? "Add team outlook" : "Add player outlook"}
        </h2>
        <p className="modal-meta">{subjectLabel} · 2026</p>
        <div className="modal-official">
          <div className="official-doctrine">
            Broader take on this {isTeam ? "team’s offense" : "player"} — what
            you expect this season and why. Not a single-stat contribution (use
            Contribute for those).
          </div>
        </div>
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="feedback-text">Your note</label>
            <textarea
              id="feedback-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder="In plain words: what should people expect in 2026, and why?"
              autoFocus
            />
            <p className="hint">
              {text.trim().length} characters · aim for {GENERAL_FEEDBACK_MIN}–
              {GENERAL_FEEDBACK_MAX}
            </p>
          </div>
          <div className="field">
            <label htmlFor="feedback-author">Name / handle</label>
            <input
              id="feedback-author"
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
              This is a clear, season-long take — not a one-week spike or rumor
              dump.
            </span>
          </label>
          {error ? <p className="err">{error}</p> : null}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="submit" className="btn primary" disabled={busy}>
              {busy ? "Saving…" : "Submit"}
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
