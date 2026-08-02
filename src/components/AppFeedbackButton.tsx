"use client";

import { useEffect, useState } from "react";
import {
  APP_FEEDBACK_FIELD,
  APP_GRAIN,
  APP_SUBJECT_ID,
  APP_SUBJECT_LABEL,
  GENERAL_FEEDBACK_MAX,
  GENERAL_FEEDBACK_MIN,
} from "@/lib/feedback";

export function AppFeedbackButton({
  buttonLabel = "Site feedback",
}: {
  buttonLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btn primary" onClick={() => setOpen(true)}>
        {buttonLabel}
      </button>
      {open ? <AppFeedbackModal onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function AppFeedbackModal({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState("");
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
          grain: APP_GRAIN,
          subject_id: APP_SUBJECT_ID,
          subject_label: APP_SUBJECT_LABEL,
          field: APP_FEEDBACK_FIELD,
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
      setOk("Feedback submitted.");
      setText("");
      setTimeout(() => onClose(), 700);
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
        aria-labelledby="app-feedback-title"
      >
        <h2 id="app-feedback-title">Site feedback</h2>
        <p className="modal-meta">Open Board · product &amp; experience</p>
        <div className="modal-official">
          <div className="official-doctrine">
            Bugs, UX friction, missing docs, or ideas for the site itself — not
            a player/team projection (use Propose / Add feedback on those
            cards).
          </div>
        </div>
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="app-feedback-text">Your note</label>
            <textarea
              id="app-feedback-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder="What’s confusing, broken, or missing on Open Board?"
              autoFocus
            />
            <p className="hint">
              {text.trim().length} characters · aim for {GENERAL_FEEDBACK_MIN}–
              {GENERAL_FEEDBACK_MAX}
            </p>
          </div>
          <div className="field">
            <label htmlFor="app-feedback-author">Name / handle</label>
            <input
              id="app-feedback-author"
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
              This is about the Open Board product/experience — not a
              projection pin for a player or team.
            </span>
          </label>
          {error ? <p className="err">{error}</p> : null}
          {ok ? <p className="ok">{ok}</p> : null}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="submit" className="btn primary" disabled={busy}>
              {busy ? "Saving…" : "Submit feedback"}
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
