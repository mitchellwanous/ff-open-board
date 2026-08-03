"use client";

import { useState } from "react";
import Link from "next/link";

type Sheet = null | "target" | "rush" | "offense";

const YEARS = [2023, 2024, 2025] as const;

const TGT_ROWS = [
  {
    name: "Khalil Shakir",
    pos: "WR",
    hist: { 2023: 14.2, 2024: 18.1, 2025: 17.0 },
    dn: 15.2,
    exp: 17.4,
    up: 19.5,
  },
  {
    name: "Keon Coleman",
    pos: "WR",
    hist: { 2023: null, 2024: 12.5, 2025: 13.8 },
    dn: 12.0,
    exp: 14.1,
    up: 17.0,
  },
  {
    name: "Dalton Kincaid",
    pos: "TE",
    hist: { 2023: 11.0, 2024: 14.2, 2025: 13.5 },
    dn: 11.5,
    exp: 13.2,
    up: 15.5,
  },
  {
    name: "James Cook",
    pos: "RB",
    hist: { 2023: 8.5, 2024: 9.0, 2025: 9.2 },
    dn: 8.0,
    exp: 9.1,
    up: 10.5,
  },
  {
    name: "Joshua Palmer",
    pos: "WR",
    hist: { 2023: null, 2024: null, 2025: 10.1 },
    dn: 7.5,
    exp: 8.8,
    up: 11.0,
  },
  {
    name: "Other",
    pos: "rest",
    hist: { 2023: 48.0, 2024: 36.0, 2025: 36.4 },
    dn: null,
    exp: 37.4,
    up: null,
  },
];

const RUSH_ROWS = [
  {
    name: "James Cook",
    pos: "RB",
    hist: { 2023: 55.0, 2024: 57.0, 2025: 59.0 },
    dn: 52.0,
    exp: 58.0,
    up: 64.0,
  },
  {
    name: "Ray Davis",
    pos: "RB",
    hist: { 2023: null, 2024: 18.0, 2025: 15.0 },
    dn: 14.0,
    exp: 16.0,
    up: 18.0,
  },
  {
    name: "Josh Allen",
    pos: "QB",
    hist: { 2023: 14.0, 2024: 13.5, 2025: 14.2 },
    dn: 12.0,
    exp: 14.0,
    up: 16.0,
  },
  {
    name: "Other",
    pos: "rest",
    hist: { 2023: 17.0, 2024: 11.5, 2025: 11.8 },
    dn: null,
    exp: 12.0,
    up: null,
  },
];

/**
 * Team card mock v3:
 * Page keeps the Dn / Expected / Upside table (read).
 * One Contribute button under each table opens the hist+edit sheet.
 */
export default function TeamCardMockupPage() {
  const [sheet, setSheet] = useState<Sheet>(null);

  return (
    <>
      <p className="faint" style={{ marginTop: "1.25rem" }}>
        <Link href="/">Home</Link> /{" "}
        <Link href="/preview/mockups/edit-flows">mockups</Link> / team card
      </p>
      <h1>Team card — table + sheet mock</h1>
      <p className="lede">
        Page = share table (dn / expected / up) + one button. Sheet = hist by
        year + editable 2026 bands. Live:{" "}
        <Link href="/teams/BUF" className="text-link">
          /teams/BUF
        </Link>
        . Nothing saves.
      </p>

      <div className="callout">
        <strong>Locked direction:</strong> keep today&apos;s pie tables on the
        page (they&apos;re useful). Drop the per-row Contribute buttons and the
        3 snapshot boxes. One <em>Contribute to target share</em> (or rush /
        offense) under the table opens the guided sheet.
      </div>

      <div style={{ marginTop: "1.25rem" }}>
        <h2 style={{ marginBottom: "0.25rem" }}>BUF</h2>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          <span className="badge accent">25.7 PPG · #6</span>
          <span className="badge warn">New OC</span>
        </div>

        <h2>Team offense</h2>
        <div className="stat-grid">
          <div className="stat">
            <div className="label">Points / game</div>
            <div className="value num accent">25.7</div>
            <div className="sub">#6</div>
          </div>
          <div className="stat">
            <div className="label">Pass yards</div>
            <div className="value num">4,072</div>
          </div>
          <div className="stat">
            <div className="label">Rush yards</div>
            <div className="value num">2,489</div>
          </div>
          <div className="stat">
            <div className="label">Pass rate</div>
            <div className="value num">54%</div>
          </div>
        </div>
        <div id="suggest" style={{ marginTop: "0.85rem" }}>
          <button
            type="button"
            className="btn primary"
            onClick={() => setSheet("offense")}
          >
            Contribute to team offense
          </button>
        </div>

        <h2 id="share-pies">Who gets the ball</h2>
        <p className="muted" style={{ fontSize: "0.9rem", maxWidth: "40rem" }}>
          Named shares are collective inputs. Expected (named + Other) ≈ 100%.
          Upside bands can&apos;t all hit together.
        </p>

        <ShareTableBlock
          title="Target share"
          rows={TGT_ROWS}
          buttonLabel="Contribute to target share"
          onContribute={() => setSheet("target")}
        />

        <ShareTableBlock
          title="Rush share"
          rows={RUSH_ROWS}
          buttonLabel="Contribute to rush share"
          onContribute={() => setSheet("rush")}
          rushNote
        />

        <h2 style={{ marginTop: "1.75rem" }}>Roster</h2>
        <p className="faint">
          (roster unchanged — links to player cards for efficiency)
        </p>
      </div>

      {sheet === "target" ? (
        <ShareSheet
          title="Contribute to target share · BUF"
          rows={TGT_ROWS}
          onClose={() => setSheet(null)}
        />
      ) : null}
      {sheet === "rush" ? (
        <ShareSheet
          title="Contribute to rush share · BUF"
          rows={RUSH_ROWS}
          onClose={() => setSheet(null)}
        />
      ) : null}
      {sheet === "offense" ? (
        <OffenseSheet onClose={() => setSheet(null)} />
      ) : null}
    </>
  );
}

function ShareTableBlock({
  title,
  rows,
  buttonLabel,
  onContribute,
  rushNote,
}: {
  title: string;
  rows: typeof TGT_ROWS;
  buttonLabel: string;
  onContribute: () => void;
  rushNote?: boolean;
}) {
  const sum = rows.reduce((a, r) => a + r.exp, 0);
  return (
    <div className="panel" style={{ marginTop: "1rem" }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {rushNote ? (
        <p className="faint" style={{ fontSize: "0.8rem", marginTop: 0 }}>
          QB always listed.
        </p>
      ) : null}
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Claimant</th>
              <th className="right">Downside</th>
              <th className="right">Expected</th>
              <th className="right">Upside</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name}>
                <td>
                  <strong>{r.name}</strong>
                  <div className="faint" style={{ fontSize: "0.8rem" }}>
                    {r.pos === "rest" ? "rest of roster" : r.pos}
                  </div>
                </td>
                <td className="right num">{r.dn == null ? "—" : `${r.dn}%`}</td>
                <td className="right num accent">{r.exp}%</td>
                <td className="right num">{r.up == null ? "—" : `${r.up}%`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted" style={{ fontSize: "0.85rem" }}>
        Expected sum: {sum.toFixed(1)}% (≈ 100% ✓)
      </p>
      <button type="button" className="btn primary" onClick={onContribute}>
        {buttonLabel}
      </button>
    </div>
  );
}

function ShareSheet({
  title,
  rows,
  onClose,
}: {
  title: string;
  rows: typeof TGT_ROWS;
  onClose: () => void;
}) {
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
      >
        <h2>{title}</h2>
        <p className="modal-meta">Mock · nothing saves</p>
        <p className="edit-sheet-lead">
          Hist years on the left. Edit 2026 Downside / Expected / Upside. Expected
          + Other ≈ 100%.
        </p>
        <div className="table-wrap edit-hist-wrap edit-sheet-block">
          <table className="data edit-hist-table">
            <thead>
              <tr>
                <th>Claimant</th>
                {YEARS.map((y) => (
                  <th key={y} className="right">
                    {y}
                  </th>
                ))}
                <th className="right warn">Downside</th>
                <th className="right edit-hist-table__proj">
                  Expected
                  <span className="edit-hist-table__proj-sub">2026</span>
                </th>
                <th className="right">Upside</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name}>
                  <td className="edit-hist-table__label">
                    {r.name}
                    <div className="faint" style={{ fontSize: "0.75rem" }}>
                      {r.pos === "rest" ? "rest of roster" : r.pos}
                    </div>
                  </td>
                  {YEARS.map((y) => {
                    const pct = r.hist[y];
                    const awayTeam =
                      pct != null && r.name === "Keon Coleman" && y === 2024
                        ? "CHI"
                        : null;
                    return (
                      <td
                        key={y}
                        className={`right num${awayTeam ? " edit-hist-table__away" : ""}`}
                      >
                        {pct == null ? (
                          "—"
                        ) : (
                          <>
                            {pct}%
                            {awayTeam ? (
                              <div className="edit-hist-table__away-tag">
                                {awayTeam}
                              </div>
                            ) : null}
                          </>
                        )}
                      </td>
                    );
                  })}
                  <td className="right edit-hist-table__proj">
                    {r.dn == null ? (
                      "—"
                    ) : (
                      <div className="edit-hist-table__input-wrap">
                        <input
                          className="num edit-hist-table__input"
                          defaultValue={r.dn}
                        />
                        <span className="edit-hist-table__suffix">%</span>
                      </div>
                    )}
                  </td>
                  <td className="right edit-hist-table__proj">
                    <div className="edit-hist-table__input-wrap">
                      <input
                        className="num edit-hist-table__input"
                        defaultValue={r.exp}
                      />
                      <span className="edit-hist-table__suffix">%</span>
                    </div>
                  </td>
                  <td className="right edit-hist-table__proj">
                    {r.up == null ? (
                      "—"
                    ) : (
                      <div className="edit-hist-table__input-wrap">
                        <input
                          className="num edit-hist-table__input"
                          defaultValue={r.up}
                        />
                        <span className="edit-hist-table__suffix">%</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="field">
          <label>Rationale</label>
          <textarea
            rows={3}
            placeholder="Why should these shares change for the collective model?"
          />
        </div>
        <div className="edit-sheet-actions">
          <button type="button" className="btn primary">
            Submit contribution (mock)
          </button>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function OffenseSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal outlook-modal modal--wide"
        style={{ width: "min(720px, 100%)", maxHeight: "90vh", overflow: "auto" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h2>Contribute to team offense · BUF</h2>
        <p className="modal-meta">Mock · nothing saves</p>
        <p className="edit-sheet-lead">
          Hist on the left. Edit PPG → points/play → pace → pass rate.
        </p>
        <div className="table-wrap edit-hist-wrap">
          <table className="data edit-hist-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th className="right">2023</th>
                <th className="right">2024</th>
                <th className="right">2025</th>
                <th className="right edit-hist-table__proj">2026</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Points / game", "26.2", "28.1", "28.4", "25.7"],
                ["Points / play", "0.415", "0.450", "0.460", "0.415"],
                ["Plays / game", "63.1", "62.4", "61.8", "62.0"],
                ["Pass rate", "55%", "54%", "53%", "54"],
              ].map(([l, a, b, c, e]) => (
                <tr key={l}>
                  <td>{l}</td>
                  <td className="right num">{a}</td>
                  <td className="right num">{b}</td>
                  <td className="right num">{c}</td>
                  <td className="right edit-hist-table__proj">
                    <div className="edit-hist-table__input-wrap">
                      <input
                        className="num edit-hist-table__input"
                        defaultValue={String(e).replace("%", "")}
                      />
                      {l === "Pass rate" ? (
                        <span className="edit-hist-table__suffix">%</span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="edit-sheet-actions">
          <button type="button" className="btn primary">
            Submit contribution (mock)
          </button>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
