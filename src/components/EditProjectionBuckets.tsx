"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import {
  BRAND_CONTRIBUTE_CHOOSER_SUB,
  BRAND_CONTRIBUTE_CHOOSER_TITLE,
  BRAND_CONTRIBUTE_CTA,
  BRAND_CONTRIBUTE_PIECES,
  BRAND_CONTRIBUTE_SUCCESS,
  BRAND_CONTRIBUTE_SUCCESS_LIVE,
  BRAND_PLAYER_CONTRIBUTE_LOOP,
} from "@/lib/brand";
import type { ClaimableField } from "@/lib/types";
import { displayClaimValue, fmt, fmtInt } from "@/lib/format";
import {
  TeamShareContributeSheet,
  type ShareClaimantRow,
} from "./TeamShareContributeSheet";

export type BucketRow = {
  field: ClaimableField;
  official: number | null;
  /** Override label for Expected language (optional). */
  displayLabel?: string;
};

type BucketKind = "offense" | "share" | "efficiency";

type SnapshotStat = {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
};

type ShareBand = {
  group: string;
  downside: string;
  expected: string;
  upside: string;
};

type EffGroup = {
  group: string;
  stats: SnapshotStat[];
};

/** Hist + scenario context for Option 1 offense sheet. */
export type OffenseBoard = {
  staffLine: string;
  winTotal: number | null;
  ppgRk: number | null;
  years: number[];
  histBySeason: Record<
    number,
    {
      ppg: number | null;
      plays_pg: number | null;
      pass_rate: number | null;
      pass_yards: number | null;
      rush_yards: number | null;
    }
  >;
  projYards: {
    pass_yards: number | null;
    rush_yards: number | null;
  };
  scenario: {
    vol_up: number | null;
    vol_dn: number | null;
    eff_up: number | null;
    eff_dn: number | null;
  };
};

export type ShareBoard = {
  years: number[];
  gamesBySeason: Record<number, number | null>;
  teamBySeason: Record<number, string | null>;
  currentTeam: string;
  showRush: boolean;
  showTgt: boolean;
  histBySeason: Record<
    number,
    {
      rush_share: number | null;
      target_share: number | null;
    }
  >;
};

export type EfficiencyBoard = {
  years: number[];
  gamesBySeason: Record<number, number | null>;
  showRush: boolean;
  showTgt: boolean;
  showPass: boolean;
  histBySeason: Record<
    number,
    {
      ypc: number | null;
      rush_td_rate: number | null;
      catch_pct: number | null;
      ypt: number | null;
      rec_td_rate: number | null;
      pass_ypa: number | null;
      pass_td_rate: number | null;
      int_rate: number | null;
    }
  >;
};

type Props = {
  playerId: string;
  playerName: string;
  team: string;
  position: string;
  offenseRows: BucketRow[];
  shareRows: BucketRow[];
  efficiencyRows: BucketRow[];
  offenseSnapshot: SnapshotStat[];
  shareBands: ShareBand[];
  efficiencyGroups: EffGroup[];
  offenseBoard: OffenseBoard;
  shareBoard: ShareBoard;
  efficiencyBoard: EfficiencyBoard;
  pieHref: string;
  /** Link to classic inventory UI for revert. */
  classicHref: string;
  /**
   * `always` (default) — three sheets visible on the page.
   * `gated` — math-first cards: one CTA → piece chooser → sheet modal.
   */
  entry?: "always" | "gated";
  /**
   * When set (gated flow), "Player share" opens the team target pie sheet
   * instead of this player's share bands alone.
   */
  targetPie?: {
    years: number[];
    rows: ShareClaimantRow[];
  };
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

function toInputDisplay(field: ClaimableField, official: number | null): string {
  if (official === null || Number.isNaN(official)) return "";
  if (isShareField(field)) {
    const pct = Math.abs(official) <= 1.5 ? official * 100 : official;
    return (Math.round(pct * 10) / 10).toFixed(1);
  }
  if (field.unit === "mult") return (Math.round(official * 1000) / 1000).toFixed(3);
  if (field.unit === "ppp") return (Math.round(official * 1000) / 1000).toFixed(3);
  if (field.unit === "yp") return (Math.round(official * 100) / 100).toFixed(2);
  return (Math.round(official * 10) / 10).toFixed(1);
}

function parseInput(field: ClaimableField, raw: string): number | null {
  let value = Number(raw);
  if (Number.isNaN(value)) return null;
  if (isShareField(field) && value > 1.5) value = value / 100;
  return value;
}

function valuesDiffer(
  field: ClaimableField,
  official: number | null,
  raw: string,
): boolean {
  const next = parseInput(field, raw);
  if (next === null) return false;
  if (official === null) return true;
  const tol =
    isShareField(field) || field.unit === "mult" || field.unit === "ppp"
      ? 0.0005
      : 0.05;
  return Math.abs(next - official) > tol;
}

/** Hist shares/rates may be stored as 0–1 or already as percent. */
function histPct(v: number | null | undefined, digits = 0): string {
  if (v == null || Number.isNaN(v)) return "—";
  const pct = Math.abs(v) <= 1.5 ? v * 100 : v;
  return `${pct.toFixed(digits)}%`;
}

function YearHeaders({
  years,
  gamesBySeason,
  teamBySeason,
  currentTeam,
}: {
  years: number[];
  gamesBySeason: Record<number, number | null>;
  teamBySeason?: Record<number, string | null>;
  currentTeam?: string;
}) {
  return (
    <>
      {years.map((y) => {
        const gp = gamesBySeason[y];
        const tm = teamBySeason?.[y];
        const other = tm && currentTeam && tm !== currentTeam;
        const thin = gp != null && gp < 8;
        return (
          <th
            key={y}
            className={`right${thin ? " edit-hist-table__thin-year" : ""}`}
          >
            {y}
            <span className="edit-hist-table__proj-sub">
              {gp != null
                ? `${Number.isInteger(gp) ? gp : gp.toFixed(1)} GP`
                : null}
              {other ? ` · ${tm}` : null}
              {thin ? " · small sample" : null}
            </span>
          </th>
        );
      })}
    </>
  );
}

type FormMeta = {
  confidence: "low" | "med" | "high";
  setConfidence: (c: "low" | "med" | "high") => void;
  rationale: string;
  setRationale: (s: string) => void;
  author: string;
  setAuthor: (s: string) => void;
  doctrineOk: boolean;
  setDoctrineOk: (b: boolean) => void;
  error: string | null;
  ok: string | null;
  busy: boolean;
  changedCount: number;
  idPrefix: string;
};

function BucketFormFooter({
  meta,
  onClose,
}: {
  meta: FormMeta;
  onClose: () => void;
}) {
  return (
    <div className="edit-sheet-form">
      <div className="field">
        <label htmlFor={`${meta.idPrefix}-confidence`}>Confidence</label>
        <select
          id={`${meta.idPrefix}-confidence`}
          value={meta.confidence}
          onChange={(e) =>
            meta.setConfidence(e.target.value as "low" | "med" | "high")
          }
        >
          <option value="low">Low</option>
          <option value="med">Med</option>
          <option value="high">High</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor={`${meta.idPrefix}-rationale`}>Rationale</label>
        <textarea
          id={`${meta.idPrefix}-rationale`}
          value={meta.rationale}
          onChange={(e) => meta.setRationale(e.target.value)}
          placeholder="Why should these inputs change for the collective model?"
        />
      </div>
      <div className="field">
        <label htmlFor={`${meta.idPrefix}-author`}>Name / handle</label>
        <input
          id={`${meta.idPrefix}-author`}
          value={meta.author}
          onChange={(e) => meta.setAuthor(e.target.value)}
        />
      </div>
      <label className="doctrine-check">
        <input
          type="checkbox"
          checked={meta.doctrineOk}
          onChange={(e) => meta.setDoctrineOk(e.target.checked)}
        />
        <span>
          I read the descriptions — I'm contributing full-season inputs with the
          depth chart mostly healthy (not a short injury spike).
        </span>
      </label>
      {meta.error ? <p className="err">{meta.error}</p> : null}
      {meta.ok ? <p className="ok">{meta.ok}</p> : null}
      <div className="edit-sheet-actions">
        <button type="submit" className="btn primary" disabled={meta.busy}>
          {meta.busy
            ? "Saving…"
            : meta.changedCount > 1
              ? `Submit ${meta.changedCount} contributions`
              : "Submit contribution"}
        </button>
        <button type="button" className="btn" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function useEditDrafts(rows: BucketRow[]) {
  const initials = useMemo(() => {
    const m: Record<string, string> = {};
    for (const r of rows) {
      m[r.field.field] = toInputDisplay(r.field, r.official);
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

  const changed = rows.filter((r) =>
    valuesDiffer(r.field, r.official, drafts[r.field.field] ?? ""),
  );

  function setDraft(field: string, value: string) {
    setDrafts((d) => ({ ...d, [field]: value }));
  }

  async function submitEdits(
    e: React.FormEvent,
    grain: "team" | "player",
    subjectId: string,
    subjectLabel: string,
    onClose: () => void,
  ) {
    e.preventDefault();
    setError(null);
    setOk(null);

    if (changed.length === 0) {
      setError("Change at least one value before submitting.");
      return;
    }
    if (!rationale.trim() || rationale.trim().length < 8) {
      setError("Add a short rationale (at least a sentence).");
      return;
    }
    if (!doctrineOk) {
      setError("Confirm you’ve read the descriptions.");
      return;
    }

    for (const r of changed) {
      const value = parseInput(r.field, drafts[r.field.field] ?? "");
      if (value === null) {
        setError(`Enter a number for ${r.displayLabel ?? r.field.label}.`);
        return;
      }
      if (value < r.field.min || value > r.field.max) {
        setError(
          isShareField(r.field)
            ? `${r.displayLabel ?? r.field.label} must be between ${(r.field.min * 100).toFixed(0)}% and ${(r.field.max * 100).toFixed(0)}%.`
            : `${r.displayLabel ?? r.field.label} must be between ${r.field.min} and ${r.field.max}.`,
        );
        return;
      }
    }

    setBusy(true);
    try {
      let lastBoardMessage: string | null = null;
      for (const r of changed) {
        const value = parseInput(r.field, drafts[r.field.field] ?? "")!;
        const res = await fetch("/api/edits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grain,
            subject_id: subjectId,
            subject_label: subjectLabel,
            field: r.field.field,
            field_label: r.displayLabel ?? r.field.label,
            official_value: r.official,
            value,
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
          (changed.length === 1
            ? BRAND_CONTRIBUTE_SUCCESS
            : `${changed.length} inputs in — ${BRAND_CONTRIBUTE_SUCCESS_LIVE}`),
      );
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("ff-edits-updated", {
            detail: { grain, subjectId },
          }),
        );
      }
      setTimeout(onClose, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setBusy(false);
    }
  }

  return {
    drafts,
    setDraft,
    changed,
    confidence,
    setConfidence,
    rationale,
    setRationale,
    author,
    setAuthor,
    doctrineOk,
    setDoctrineOk,
    error,
    ok,
    busy,
    submitEdits,
  };
}

export function EditProjectionBuckets(props: Props) {
  const gated = props.entry === "gated";
  const [phase, setPhase] = useState<"closed" | "chooser">(
    gated ? "closed" : "chooser",
  );
  const [sheet, setSheet] = useState<BucketKind | null>(null);

  const sheets = (
    <>
      {sheet === "offense" ? (
        <TeamOffenseContributeSheet
          team={props.team}
          rows={props.offenseRows}
          board={props.offenseBoard}
          onClose={() => setSheet(null)}
        />
      ) : null}
      {sheet === "share" ? (
        props.targetPie ? (
          <TeamShareContributeSheet
            team={props.team}
            pieKind="target"
            years={props.targetPie.years}
            rows={props.targetPie.rows}
            onClose={() => setSheet(null)}
          />
        ) : (
          <ShareBucketSheet
            playerId={props.playerId}
            playerName={props.playerName}
            team={props.team}
            rows={props.shareRows}
            board={props.shareBoard}
            pieHref={props.pieHref}
            onClose={() => setSheet(null)}
          />
        )
      ) : null}
      {sheet === "efficiency" ? (
        <EfficiencyBucketSheet
          playerId={props.playerId}
          playerName={props.playerName}
          rows={props.efficiencyRows}
          board={props.efficiencyBoard}
          onClose={() => setSheet(null)}
        />
      ) : null}
    </>
  );

  if (gated && phase === "closed") {
    return (
      <div id="suggest" className="contribute-entry">
        <button
          type="button"
          className="btn primary contribute-entry__cta"
          onClick={() => setPhase("chooser")}
        >
          {BRAND_CONTRIBUTE_CTA}
        </button>
        {sheets}
      </div>
    );
  }

  if (gated) {
    return (
      <div id="suggest" className="contribute-entry contribute-entry--open">
        <div className="contribute-chooser">
          <div className="contribute-chooser__head">
            <h2 className="contribute-chooser__title">
              {BRAND_CONTRIBUTE_CHOOSER_TITLE}
            </h2>
            <p className="contribute-chooser__sub">
              {BRAND_CONTRIBUTE_CHOOSER_SUB}
            </p>
          </div>
          <div className="contribute-chooser__pieces">
            {BRAND_CONTRIBUTE_PIECES.map((piece) => (
              <button
                key={piece.id}
                type="button"
                className="contribute-chooser__piece"
                onClick={() => setSheet(piece.id)}
              >
                <span className="contribute-chooser__piece-title">
                  {piece.id === "offense"
                    ? `${piece.title} (${props.team})`
                    : piece.title}
                </span>
                <span className="contribute-chooser__piece-body">
                  {piece.body}
                </span>
              </button>
            ))}
          </div>
          <p className="contribute-chooser__back">
            <button
              type="button"
              className="text-link"
              onClick={() => {
                setSheet(null);
                setPhase("closed");
              }}
            >
              Back to player math
            </button>
            <span className="faint"> · </span>
            <Link href={props.classicHref} className="text-link">
              Classic field list
            </Link>
          </p>
        </div>
        {sheets}
      </div>
    );
  }

  return (
    <div id="suggest">
      <h2>Contribute to this projection</h2>
      <p className="muted" style={{ fontSize: "0.9rem", maxWidth: "36rem" }}>
        Three pieces behind the projection. Open a sheet, contribute only what you
        disagree with, and leave a short reason. After 3 contributions on a
        field, the board uses the crowd median; we audit for spam.
      </p>
      <ol className="contribute-loop">
        {BRAND_PLAYER_CONTRIBUTE_LOOP.map((step) => (
          <li key={step.title}>
            <strong>{step.title}</strong> — {step.body}
          </li>
        ))}
      </ol>

      <div className="share-stack" style={{ marginTop: "1rem" }}>
        <div className="panel edit-bucket-card">
          <div className="edit-bucket-card__head">
            <h3 style={{ margin: 0 }}>Team offense ({props.team})</h3>
            <p className="muted" style={{ margin: "0.25rem 0 0", fontSize: "0.85rem" }}>
              How strong the offense is
            </p>
          </div>
          <div className="stat-grid edit-bucket-stats">
            {props.offenseSnapshot.map((s) => (
              <div className="stat" key={s.label}>
                <div className="label">{s.label}</div>
                <div className={`value num${s.accent ? " accent" : ""}`}>
                  {s.value}
                </div>
                {s.sub ? <div className="sub">{s.sub}</div> : null}
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn primary"
            onClick={() => setSheet("offense")}
          >
            Contribute to team offense
          </button>
        </div>

        <div className="panel edit-bucket-card">
          <div className="edit-bucket-card__head">
            <h3 style={{ margin: 0 }}>Player share</h3>
            <p className="muted" style={{ margin: "0.25rem 0 0", fontSize: "0.85rem" }}>
              Downside / expected / upside of the ball
            </p>
          </div>
          {props.shareBands.map((band) => (
            <div key={band.group} className="edit-bucket-band">
              <div className="edit-bucket-band__title">{band.group}</div>
              <div className="stat-grid edit-bucket-stats edit-bucket-stats--3">
                <div className="stat">
                  <div className="label">Downside</div>
                  <div className="value num warn">{band.downside}</div>
                </div>
                <div className="stat">
                  <div className="label">Expected</div>
                  <div className="value num accent">{band.expected}</div>
                </div>
                <div className="stat">
                  <div className="label">Upside</div>
                  <div className="value num">{band.upside}</div>
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="btn primary"
            onClick={() => setSheet("share")}
          >
            Contribute to player share
          </button>
          <p style={{ margin: "0.65rem 0 0", fontSize: "0.85rem" }}>
            <Link href={props.pieHref} className="text-link">
              Also contribute on {props.team} pie
            </Link>
            <span className="faint"> — keeps named + Other near 100%</span>
          </p>
        </div>

        <div className="panel edit-bucket-card">
          <div className="edit-bucket-card__head">
            <h3 style={{ margin: 0 }}>Player efficiency</h3>
            <p className="muted" style={{ margin: "0.25rem 0 0", fontSize: "0.85rem" }}>
              Production when he gets the ball
            </p>
          </div>
          {props.efficiencyGroups.map((g) => (
            <div key={g.group} className="edit-bucket-band">
              <div className="edit-bucket-band__title">{g.group}</div>
              <div className="stat-grid edit-bucket-stats">
                {g.stats.map((s) => (
                  <div className="stat" key={s.label}>
                    <div className="label">{s.label}</div>
                    <div className="value num">{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button
            type="button"
            className="btn primary"
            onClick={() => setSheet("efficiency")}
          >
            Contribute to player efficiency
          </button>
        </div>
      </div>

      <p className="faint" style={{ marginTop: "1rem", fontSize: "0.85rem" }}>
        Prefer the old field-by-field list?{" "}
        <Link href={props.classicHref} className="text-link">
          Classic field list
        </Link>
      </p>

      {sheets}
    </div>
  );
}

/** Team-page + player-bucket offense contribute sheet (hist + 2026 edits). */
export function TeamOffenseContributeSheet({
  team,
  rows,
  board,
  onClose,
}: {
  team: string;
  rows: BucketRow[];
  board: OffenseBoard;
  onClose: () => void;
}) {
  const byField = useMemo(() => {
    const m: Record<string, BucketRow> = {};
    for (const r of rows) m[r.field.field] = r;
    return m;
  }, [rows]);

  const coreFields = [
    "implied_ppg",
    "points_per_play",
    "plays_pg",
    "pass_rate",
  ] as const;
  const boostFields = ["vol_up", "eff_up"] as const;
  const editableKeys = [...coreFields, ...boostFields];

  const initials = useMemo(() => {
    const m: Record<string, string> = {};
    for (const key of editableKeys) {
      const r = byField[key];
      if (r) m[r.field.field] = toInputDisplay(r.field, r.official);
    }
    return m;
  }, [byField]);

  const editableRows = editableKeys
    .map((f) => byField[f])
    .filter((r): r is BucketRow => Boolean(r));

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

  const changed = editableRows.filter((r) =>
    valuesDiffer(r.field, r.official, drafts[r.field.field] ?? ""),
  );

  const expectedPpg = Number(drafts.implied_ppg);
  const volUp = Number(drafts.vol_up);
  const effUp = Number(drafts.eff_up);
  const volDn = board.scenario.vol_dn ?? 1;
  const effDn = board.scenario.eff_dn ?? 1;
  const bandOk = !Number.isNaN(expectedPpg);
  const downsidePpg =
    bandOk && !Number.isNaN(volDn) && !Number.isNaN(effDn)
      ? expectedPpg * volDn * effDn
      : null;
  const upsidePpg =
    bandOk && !Number.isNaN(volUp) && !Number.isNaN(effUp)
      ? expectedPpg * volUp * effUp
      : null;

  function setDraft(field: string, value: string) {
    setDrafts((d) => ({ ...d, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);

    if (changed.length === 0) {
      setError("Change at least one value before submitting.");
      return;
    }
    if (!rationale.trim() || rationale.trim().length < 8) {
      setError("Add a short rationale (at least a sentence).");
      return;
    }
    if (!doctrineOk) {
      setError("Confirm you’ve read the descriptions.");
      return;
    }

    for (const r of changed) {
      const value = parseInput(r.field, drafts[r.field.field] ?? "");
      if (value === null) {
        setError(`Enter a number for ${r.displayLabel ?? r.field.label}.`);
        return;
      }
      if (value < r.field.min || value > r.field.max) {
        setError(
          isShareField(r.field)
            ? `${r.displayLabel ?? r.field.label} must be between ${(r.field.min * 100).toFixed(0)}% and ${(r.field.max * 100).toFixed(0)}%.`
            : `${r.displayLabel ?? r.field.label} must be between ${r.field.min} and ${r.field.max}.`,
        );
        return;
      }
    }

    setBusy(true);
    try {
      let lastBoardMessage: string | null = null;
      for (const r of changed) {
        const value = parseInput(r.field, drafts[r.field.field] ?? "")!;
        const res = await fetch("/api/edits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grain: "team",
            subject_id: team,
            subject_label: team,
            field: r.field.field,
            field_label: r.displayLabel ?? r.field.label,
            official_value: r.official,
            value,
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
          (changed.length === 1
            ? BRAND_CONTRIBUTE_SUCCESS
            : `${changed.length} inputs in — ${BRAND_CONTRIBUTE_SUCCESS_LIVE}`),
      );
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("ff-edits-updated", {
            detail: { grain: "team", subjectId: team },
          }),
        );
      }
      setTimeout(onClose, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setBusy(false);
    }
  }

  function histPassRate(v: number | null | undefined): string {
    if (v == null || Number.isNaN(v)) return "—";
    const pct = Math.abs(v) <= 1.5 ? v * 100 : v;
    return `${Math.round(pct)}%`;
  }

  const tableRows: {
    key: string;
    label: string;
    kind: "edit" | "ctx";
    field?: (typeof coreFields)[number];
    hist: (season: number) => string;
    projDisplay?: string;
    suffix?: string;
  }[] = [
    {
      key: "ppg",
      label: "PPG",
      kind: "edit",
      field: "implied_ppg",
      hist: (s) => fmt(board.histBySeason[s]?.ppg, 1),
    },
    {
      key: "ppp",
      label: "Points / play",
      kind: "edit",
      field: "points_per_play",
      hist: (s) => {
        const row = board.histBySeason[s];
        const ppp =
          row?.ppg != null && row?.plays_pg != null && row.plays_pg > 0
            ? row.ppg / row.plays_pg
            : null;
        return fmt(ppp, 3);
      },
    },
    {
      key: "plays",
      label: "Plays / G",
      kind: "edit",
      field: "plays_pg",
      hist: (s) => fmt(board.histBySeason[s]?.plays_pg, 1),
    },
    {
      key: "pass",
      label: "Pass rate",
      kind: "edit",
      field: "pass_rate",
      hist: (s) => histPassRate(board.histBySeason[s]?.pass_rate),
      suffix: "%",
    },
    {
      key: "pass_yds",
      label: "Pass yards",
      kind: "ctx",
      hist: (s) => fmtInt(board.histBySeason[s]?.pass_yards),
      projDisplay: fmtInt(board.projYards.pass_yards),
    },
    {
      key: "rush_yds",
      label: "Rush yards",
      kind: "ctx",
      hist: (s) => fmtInt(board.histBySeason[s]?.rush_yards),
      projDisplay: fmtInt(board.projYards.rush_yards),
    },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal outlook-modal modal--wide"
        style={{
          width: "min(920px, 100%)",
          maxHeight: "90vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bucket-edit-title"
      >
        <h2 id="bucket-edit-title">Contribute to team offense · {team}</h2>
        <p className="modal-meta">
          Change only what you disagree with · {changed.length} field
          {changed.length === 1 ? "" : "s"} changed
        </p>

        <p className="edit-sheet-lead">
          Hist on the left. Edit the boxed values in <strong>2026 Expected</strong>
          {" "}(PPG → points/play → pace → pass rate). PPG band below shows
          Downside / Expected / Upside.
        </p>
        <p className="edit-sheet-meta">
          {board.staffLine}
          {board.winTotal != null ? ` · Win total ${fmt(board.winTotal, 1)}` : ""}
          {" · "}
          Raising offense lifts all skill players on this roster.
        </p>

        <form onSubmit={submit}>
          <div className="table-wrap edit-hist-wrap edit-sheet-block">
            <table className="data edit-hist-table">
              <thead>
                <tr>
                  <th>Category</th>
                  {board.years.map((y) => (
                    <th key={y} className="right">
                      {y}
                    </th>
                  ))}
                  <th className="right edit-hist-table__proj">
                    2026
                    <span className="edit-hist-table__proj-sub">Editable</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => (
                  <tr key={row.key}>
                    <td className="edit-hist-table__label">{row.label}</td>
                    {board.years.map((y) => (
                      <td key={y} className="right num">
                        {row.hist(y)}
                      </td>
                    ))}
                    <td
                      className={`right edit-hist-table__proj${row.kind === "ctx" ? " edit-hist-table__proj--ctx" : ""}`}
                    >
                      {row.kind === "edit" && row.field ? (
                        <>
                          <div className="edit-hist-table__input-wrap">
                            <input
                              className="num edit-hist-table__input"
                              value={drafts[row.field] ?? ""}
                              onChange={(e) =>
                                setDraft(row.field!, e.target.value)
                              }
                              aria-label={`${row.label} 2026 Expected`}
                            />
                            {row.suffix ? (
                              <span className="edit-hist-table__suffix">
                                {row.suffix}
                              </span>
                            ) : null}
                          </div>
                          {row.field === "implied_ppg" && board.ppgRk != null ? (
                            <div className="edit-hist-table__hint">
                              #{board.ppgRk} market
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <span className="num">{row.projDisplay}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="edit-ppg-band">
            <div className="edit-ppg-band__head">
              <div className="edit-bucket-band__title">
                2026 offense band (PPG)
              </div>
              <p className="edit-sheet-meta">
                Expected follows the PPG row. Downside / Upside widen or tighten
                when you change Advanced boosts.
              </p>
            </div>
            <div className="stat-grid edit-bucket-stats edit-bucket-stats--3">
              <div className="stat">
                <div className="label">Downside</div>
                <div className="value num warn">
                  {downsidePpg != null ? fmt(downsidePpg, 1) : "—"}
                </div>
                <div className="sub">Cold year, continuity intact</div>
              </div>
              <div className="stat">
                <div className="label">Expected</div>
                <div className="value num">
                  {bandOk ? fmt(expectedPpg, 1) : "—"}
                </div>
                <div className="sub">From PPG row above</div>
              </div>
              <div className="stat">
                <div className="label">Upside</div>
                <div className="value num accent">
                  {upsidePpg != null ? fmt(upsidePpg, 1) : "—"}
                </div>
                <div className="sub">Strong year destination</div>
              </div>
            </div>
          </div>

          <details className="edit-advanced">
            <summary>
              Advanced · how Upside / Downside width is set
            </summary>
            <div className="edit-advanced__body">
              <p className="edit-sheet-meta" style={{ marginBottom: "0.75rem" }}>
                These multipliers shape the band around Expected PPG. Most edits
                only need the table above.
              </p>
              {boostFields.map((f) => {
                const r = byField[f];
                if (!r) return null;
                return (
                  <div key={f} className="field">
                    <label htmlFor={`offense-${f}`}>
                      {r.displayLabel ?? r.field.label}
                    </label>
                    <p className="hint" style={{ marginTop: 0 }}>
                      Current{" "}
                      <strong className="num">
                        {displayClaimValue(r.field.field, r.official, r.field.unit)}
                      </strong>
                      {" · "}
                      {r.field.doctrine}
                    </p>
                    <input
                      id={`offense-${f}`}
                      className="num"
                      value={drafts[f] ?? ""}
                      onChange={(e) => setDraft(f, e.target.value)}
                    />
                  </div>
                );
              })}
            </div>
          </details>

          <div className="edit-sheet-form">
            <div className="field">
              <label htmlFor="offense-confidence">Confidence</label>
              <select
                id="offense-confidence"
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
              <label htmlFor="offense-rationale">Rationale</label>
              <textarea
                id="offense-rationale"
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                placeholder="Why should these inputs change for the collective model?"
              />
            </div>
            <div className="field">
              <label htmlFor="offense-author">Name / handle</label>
              <input
                id="offense-author"
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
                I read the descriptions — I'm contributing full-season inputs with
                the depth chart mostly healthy (not a short injury spike).
              </span>
            </label>
            {error ? <p className="err">{error}</p> : null}
            {ok ? <p className="ok">{ok}</p> : null}
            <div className="edit-sheet-actions">
              <button type="submit" className="btn primary" disabled={busy}>
                {busy
                  ? "Saving…"
                  : changed.length > 1
                    ? `Submit ${changed.length} contributions`
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

function ShareBucketSheet({
  playerId,
  playerName,
  team,
  rows,
  board,
  pieHref,
  onClose,
}: {
  playerId: string;
  playerName: string;
  team: string;
  rows: BucketRow[];
  board: ShareBoard;
  pieHref: string;
  onClose: () => void;
}) {
  const form = useEditDrafts(rows);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const tableRows: {
    key: string;
    label: string;
    expectedField: string;
    hist: (season: number) => string;
  }[] = [
    ...(board.showRush
      ? [
          {
            key: "rush",
            label: "Rush share",
            expectedField: "rush_share",
            hist: (s: number) => histPct(board.histBySeason[s]?.rush_share, 1),
          },
        ]
      : []),
    ...(board.showTgt
      ? [
          {
            key: "tgt",
            label: "Target share",
            expectedField: "target_share",
            hist: (s: number) => histPct(board.histBySeason[s]?.target_share, 1),
          },
        ]
      : []),
  ];

  const bands: {
    title: string;
    dn: string;
    exp: string;
    up: string;
  }[] = [
    ...(board.showRush
      ? [
          {
            title: "Rush share band",
            dn: "rush_share_dn",
            exp: "rush_share",
            up: "rush_share_ceil",
          },
        ]
      : []),
    ...(board.showTgt
      ? [
          {
            title: "Target share band",
            dn: "target_share_dn",
            exp: "target_share",
            up: "target_share_ceil",
          },
        ]
      : []),
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal outlook-modal modal--wide"
        style={{
          width: "min(920px, 100%)",
          maxHeight: "90vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-edit-title"
      >
        <h2 id="share-edit-title">Contribute to player share · {playerName}</h2>
        <p className="modal-meta">
          Change only what you disagree with · {form.changed.length} field
          {form.changed.length === 1 ? "" : "s"} changed
        </p>

        <p className="edit-sheet-lead">
          Hist on the left. Edit the boxed values in <strong>2026 Expected</strong>.
          Bands below are Downside / Expected / Upside.
        </p>
        <p className="edit-sheet-meta">
          Expected + Other on the {team} pie should sum near 100%. Upside bands
          do not.{" "}
          <Link href={pieHref} className="text-link">
            Contribute on {team} pie
          </Link>
        </p>

        <form
          onSubmit={(e) =>
            form.submitEdits(e, "player", playerId, playerName, onClose)
          }
        >
          <div className="table-wrap edit-hist-wrap edit-sheet-block">
            <table className="data edit-hist-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <YearHeaders
                    years={board.years}
                    gamesBySeason={board.gamesBySeason}
                    teamBySeason={board.teamBySeason}
                    currentTeam={board.currentTeam}
                  />
                  <th className="right edit-hist-table__proj">
                    2026
                    <span className="edit-hist-table__proj-sub">Editable</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => (
                  <tr key={row.key}>
                    <td className="edit-hist-table__label">{row.label}</td>
                    {board.years.map((y) => {
                      const gp = board.gamesBySeason[y];
                      const thin = gp != null && gp < 8;
                      return (
                        <td
                          key={y}
                          className={`right num${thin ? " edit-hist-table__thin-year" : ""}`}
                        >
                          {row.hist(y)}
                        </td>
                      );
                    })}
                    <td className="right edit-hist-table__proj">
                      <div className="edit-hist-table__input-wrap">
                        <input
                          className="num edit-hist-table__input"
                          value={form.drafts[row.expectedField] ?? ""}
                          onChange={(e) =>
                            form.setDraft(row.expectedField, e.target.value)
                          }
                          aria-label={`${row.label} 2026 Expected`}
                        />
                        <span className="edit-hist-table__suffix">%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {bands.map((band) => {
            const expN = Number(form.drafts[band.exp]);
            return (
              <div key={band.title} className="edit-ppg-band">
                <div className="edit-ppg-band__head">
                  <div className="edit-bucket-band__title">{band.title}</div>
                  <p className="edit-sheet-meta">
                    Edit Expected in the table. Downside / Upside are separate
                    pins.
                  </p>
                </div>
                <div className="stat-grid edit-bucket-stats edit-bucket-stats--3">
                  <div className="stat">
                    <div className="label">Downside</div>
                    <div className="edit-hist-table__input-wrap edit-ppg-band__control">
                      <input
                        className="num edit-hist-table__input"
                        value={form.drafts[band.dn] ?? ""}
                        onChange={(e) => form.setDraft(band.dn, e.target.value)}
                        aria-label={`${band.title} downside`}
                      />
                      <span className="edit-hist-table__suffix">%</span>
                    </div>
                    <div className="sub">Soft healthy floor</div>
                  </div>
                  <div className="stat">
                    <div className="label">Expected</div>
                    <div className="edit-ppg-band__readonly num">
                      {Number.isNaN(expN) ? "—" : `${expN.toFixed(1)}%`}
                    </div>
                    <div className="sub">From table above</div>
                  </div>
                  <div className="stat">
                    <div className="label">Upside</div>
                    <div className="edit-hist-table__input-wrap edit-ppg-band__control">
                      <input
                        className="num edit-hist-table__input"
                        value={form.drafts[band.up] ?? ""}
                        onChange={(e) => form.setDraft(band.up, e.target.value)}
                        aria-label={`${band.title} upside`}
                      />
                      <span className="edit-hist-table__suffix">%</span>
                    </div>
                    <div className="sub">Healthy ceiling</div>
                  </div>
                </div>
              </div>
            );
          })}

          <BucketFormFooter
            onClose={onClose}
            meta={{
              confidence: form.confidence,
              setConfidence: form.setConfidence,
              rationale: form.rationale,
              setRationale: form.setRationale,
              author: form.author,
              setAuthor: form.setAuthor,
              doctrineOk: form.doctrineOk,
              setDoctrineOk: form.setDoctrineOk,
              error: form.error,
              ok: form.ok,
              busy: form.busy,
              changedCount: form.changed.length,
              idPrefix: "share",
            }}
          />
        </form>
      </div>
    </div>
  );
}

const EFF_TABLE_FIELDS = new Set([
  "ypc",
  "rush_td_rate",
  "catch_pct",
  "ypt",
  "rec_td_rate",
  "pass_ypa",
  "pass_td_rate",
  "int_rate",
]);

function EfficiencyBucketSheet({
  playerId,
  playerName,
  rows,
  board,
  onClose,
}: {
  playerId: string;
  playerName: string;
  rows: BucketRow[];
  board: EfficiencyBoard;
  onClose: () => void;
}) {
  const form = useEditDrafts(rows);
  const byField = useMemo(() => {
    const m: Record<string, BucketRow> = {};
    for (const r of rows) m[r.field.field] = r;
    return m;
  }, [rows]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  type EffRow = {
    key: string;
    label: string;
    field: string;
    suffix?: string;
    hist: (season: number) => string;
  };

  const groups: { title: string; rows: EffRow[] }[] = [];
  if (board.showRush) {
    const rushRows: EffRow[] = [
      {
        key: "ypc",
        label: "Yards / carry",
        field: "ypc",
        hist: (s: number) => fmt(board.histBySeason[s]?.ypc, 2),
      },
      {
        key: "rush_td",
        label: "Rush TD rate",
        field: "rush_td_rate",
        suffix: "%",
        hist: (s: number) => histPct(board.histBySeason[s]?.rush_td_rate, 1),
      },
    ].filter((r) => byField[r.field]);
    if (rushRows.length) groups.push({ title: "Rush", rows: rushRows });
  }
  if (board.showTgt) {
    const recRows: EffRow[] = [
      {
        key: "catch",
        label: "Catch %",
        field: "catch_pct",
        suffix: "%",
        hist: (s: number) => histPct(board.histBySeason[s]?.catch_pct, 1),
      },
      {
        key: "ypt",
        label: "Yards / target",
        field: "ypt",
        hist: (s: number) => fmt(board.histBySeason[s]?.ypt, 2),
      },
      {
        key: "rec_td",
        label: "Rec TD rate",
        field: "rec_td_rate",
        suffix: "%",
        hist: (s: number) => histPct(board.histBySeason[s]?.rec_td_rate, 1),
      },
    ].filter((r) => byField[r.field]);
    if (recRows.length) groups.push({ title: "Receiving", rows: recRows });
  }
  if (board.showPass) {
    const passRows: EffRow[] = [
      {
        key: "ypa",
        label: "Pass YPA",
        field: "pass_ypa",
        hist: (s: number) => fmt(board.histBySeason[s]?.pass_ypa, 2),
      },
      {
        key: "pass_td",
        label: "Pass TD rate",
        field: "pass_td_rate",
        suffix: "%",
        hist: (s: number) => histPct(board.histBySeason[s]?.pass_td_rate, 1),
      },
      {
        key: "int",
        label: "INT rate",
        field: "int_rate",
        suffix: "%",
        hist: (s: number) => histPct(board.histBySeason[s]?.int_rate, 1),
      },
    ].filter((r) => byField[r.field]);
    if (passRows.length) groups.push({ title: "Passing", rows: passRows });
  }

  const advancedRows = rows.filter((r) => !EFF_TABLE_FIELDS.has(r.field.field));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal outlook-modal modal--wide"
        style={{
          width: "min(920px, 100%)",
          maxHeight: "90vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="eff-edit-title"
      >
        <h2 id="eff-edit-title">Contribute to player efficiency · {playerName}</h2>
        <p className="modal-meta">
          Change only what you disagree with · {form.changed.length} field
          {form.changed.length === 1 ? "" : "s"} changed
        </p>

        <p className="edit-sheet-lead">
          Hist on the left. Edit the boxed values in <strong>2026 Expected</strong>.
          Rates are Expected pins — no downside/upside fields yet.
        </p>

        <form
          onSubmit={(e) =>
            form.submitEdits(e, "player", playerId, playerName, onClose)
          }
        >
          <div className="table-wrap edit-hist-wrap edit-sheet-block">
            <table className="data edit-hist-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <YearHeaders
                    years={board.years}
                    gamesBySeason={board.gamesBySeason}
                  />
                  <th className="right edit-hist-table__proj">
                    2026
                    <span className="edit-hist-table__proj-sub">Editable</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <Fragment key={g.title}>
                    <tr className="edit-hist-table__group-row">
                      <td colSpan={board.years.length + 2}>{g.title}</td>
                    </tr>
                    {g.rows.map((row) => (
                      <tr key={row.key}>
                        <td className="edit-hist-table__label">{row.label}</td>
                        {board.years.map((y) => {
                          const gp = board.gamesBySeason[y];
                          const thin = gp != null && gp < 8;
                          return (
                            <td
                              key={y}
                              className={`right num${thin ? " edit-hist-table__thin-year" : ""}`}
                            >
                              {row.hist(y)}
                            </td>
                          );
                        })}
                        <td className="right edit-hist-table__proj">
                          <div className="edit-hist-table__input-wrap">
                            <input
                              className="num edit-hist-table__input"
                              value={form.drafts[row.field] ?? ""}
                              onChange={(e) =>
                                form.setDraft(row.field, e.target.value)
                              }
                              aria-label={`${row.label} 2026 Expected`}
                            />
                            {row.suffix ? (
                              <span className="edit-hist-table__suffix">
                                {row.suffix}
                              </span>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {advancedRows.length > 0 ? (
            <details className="edit-advanced">
              <summary>Advanced · extra rate fields</summary>
              <div className="edit-advanced__body">
                {advancedRows.map((r) => (
                  <div key={r.field.field} className="field">
                    <label htmlFor={`eff-${r.field.field}`}>
                      {r.displayLabel ?? r.field.label}
                      {isShareField(r.field) ? " (%)" : ""}
                    </label>
                    <p className="hint" style={{ marginTop: 0 }}>
                      Current{" "}
                      <strong className="num">
                        {displayClaimValue(
                          r.field.field,
                          r.official,
                          r.field.unit,
                        )}
                      </strong>
                      {" · "}
                      {r.field.doctrine}
                    </p>
                    <input
                      id={`eff-${r.field.field}`}
                      className="num"
                      value={form.drafts[r.field.field] ?? ""}
                      onChange={(e) =>
                        form.setDraft(r.field.field, e.target.value)
                      }
                    />
                  </div>
                ))}
              </div>
            </details>
          ) : null}

          <BucketFormFooter
            onClose={onClose}
            meta={{
              confidence: form.confidence,
              setConfidence: form.setConfidence,
              rationale: form.rationale,
              setRationale: form.setRationale,
              author: form.author,
              setAuthor: form.setAuthor,
              doctrineOk: form.doctrineOk,
              setDoctrineOk: form.setDoctrineOk,
              error: form.error,
              ok: form.ok,
              busy: form.busy,
              changedCount: form.changed.length,
              idPrefix: "eff",
            }}
          />
        </form>
      </div>
    </div>
  );
}

function BucketSheet({
  title,
  context,
  rows,
  grain,
  subjectId,
  subjectLabel,
  groupShareRows,
  onClose,
}: {
  title: string;
  context: string[];
  rows: BucketRow[];
  grain: "team" | "player";
  subjectId: string;
  subjectLabel: string;
  groupShareRows?: boolean;
  onClose: () => void;
}) {
  const initials = useMemo(() => {
    const m: Record<string, string> = {};
    for (const r of rows) {
      m[r.field.field] = toInputDisplay(r.field, r.official);
    }
    return m;
  }, [rows]);

  const rowGroups = useMemo(() => {
    if (!groupShareRows) return [{ title: null as string | null, rows }];
    const rush = rows.filter((r) => r.field.field.startsWith("rush_"));
    const tgt = rows.filter((r) => r.field.field.startsWith("target_"));
    const out: { title: string | null; rows: BucketRow[] }[] = [];
    if (rush.length) out.push({ title: "Rush share", rows: rush });
    if (tgt.length) out.push({ title: "Target share", rows: tgt });
    if (!out.length) out.push({ title: null, rows });
    return out;
  }, [groupShareRows, rows]);

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

  const changed = rows.filter((r) =>
    valuesDiffer(r.field, r.official, drafts[r.field.field] ?? ""),
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);

    if (changed.length === 0) {
      setError("Change at least one value before submitting.");
      return;
    }
    if (!rationale.trim() || rationale.trim().length < 8) {
      setError("Add a short rationale (at least a sentence).");
      return;
    }
    if (!doctrineOk) {
      setError("Confirm you’ve read the descriptions.");
      return;
    }

    for (const r of changed) {
      const value = parseInput(r.field, drafts[r.field.field] ?? "");
      if (value === null) {
        setError(`Enter a number for ${r.displayLabel ?? r.field.label}.`);
        return;
      }
      if (value < r.field.min || value > r.field.max) {
        setError(
          isShareField(r.field)
            ? `${r.displayLabel ?? r.field.label} must be between ${(r.field.min * 100).toFixed(0)}% and ${(r.field.max * 100).toFixed(0)}%.`
            : `${r.displayLabel ?? r.field.label} must be between ${r.field.min} and ${r.field.max}.`,
        );
        return;
      }
    }

    setBusy(true);
    try {
      let lastBoardMessage: string | null = null;
      for (const r of changed) {
        const value = parseInput(r.field, drafts[r.field.field] ?? "")!;
        const res = await fetch("/api/edits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grain,
            subject_id: subjectId,
            subject_label: subjectLabel,
            field: r.field.field,
            field_label: r.displayLabel ?? r.field.label,
            official_value: r.official,
            value,
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
          (changed.length === 1
            ? BRAND_CONTRIBUTE_SUCCESS
            : `${changed.length} inputs in — ${BRAND_CONTRIBUTE_SUCCESS_LIVE}`),
      );
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("ff-edits-updated", {
            detail: { grain, subjectId },
          }),
        );
      }
      setTimeout(onClose, 700);
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
        style={{ width: "min(640px, 100%)", maxHeight: "90vh", overflow: "auto" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bucket-edit-title"
      >
        <h2 id="bucket-edit-title">{title}</h2>
        <p className="modal-meta">
          Change only what you disagree with · {changed.length} field
          {changed.length === 1 ? "" : "s"} changed
        </p>

        {context.length > 0 ? (
          <div
            className="panel soft"
            style={{ margin: "0.75rem 0", padding: "0.75rem 0.85rem" }}
          >
            <div
              className="faint"
              style={{
                fontSize: "0.72rem",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: "0.35rem",
              }}
            >
              Context
            </div>
            <ul className="guide-list" style={{ margin: 0, fontSize: "0.88rem" }}>
              {context.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <form onSubmit={submit}>
          {rowGroups.map((group) => (
            <div key={group.title ?? "all"} style={{ marginBottom: "0.75rem" }}>
              {group.title ? (
                <p
                  className="muted"
                  style={{
                    fontSize: "0.8rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    marginBottom: "0.5rem",
                  }}
                >
                  {group.title}
                </p>
              ) : null}
              {group.rows.map((r) => {
                const label = r.displayLabel ?? r.field.label;
                const share = isShareField(r.field);
                return (
                  <div key={r.field.field} className="field">
                    <label htmlFor={`bucket-${r.field.field}`}>
                      {label}
                      {share ? " (%)" : ""}
                    </label>
                    <p className="hint" style={{ marginTop: 0 }}>
                      Current{" "}
                      <strong className="num">
                        {displayClaimValue(
                          r.field.field,
                          r.official,
                          r.field.unit,
                        )}
                      </strong>
                      {" · "}
                      {r.field.doctrine}
                    </p>
                    <input
                      id={`bucket-${r.field.field}`}
                      className="num"
                      value={drafts[r.field.field] ?? ""}
                      onChange={(e) =>
                        setDrafts((d) => ({
                          ...d,
                          [r.field.field]: e.target.value,
                        }))
                      }
                    />
                  </div>
                );
              })}
            </div>
          ))}

          <div className="field">
            <label htmlFor="bucket-confidence">Confidence</label>
            <select
              id="bucket-confidence"
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
            <label htmlFor="bucket-rationale">Rationale</label>
            <textarea
              id="bucket-rationale"
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Why should these inputs change for the collective model?"
            />
          </div>
          <div className="field">
            <label htmlFor="bucket-author">Name / handle</label>
            <input
              id="bucket-author"
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
              I read the descriptions — these are full-season projections with
              the depth chart mostly healthy (not a short injury spike).
            </span>
          </label>
          {error ? <p className="err">{error}</p> : null}
          {ok ? <p className="ok">{ok}</p> : null}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="submit" className="btn primary" disabled={busy}>
              {busy
                ? "Saving…"
                : changed.length > 1
                  ? `Submit ${changed.length} contributions`
                  : "Submit contribution"}
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
