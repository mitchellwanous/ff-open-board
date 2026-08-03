"use client";

import { useState } from "react";
import Link from "next/link";

type Option = "A" | "B";
/** Visual mockups only — no API submits. CMC / SF flavored numbers. */
export default function EditFlowsMockupPage() {
  const [option, setOption] = useState<Option>("A");
  const [sheet, setSheet] = useState<null | "offense" | "share" | "eff">(null);
  const [richField, setRichField] = useState<null | string>(null);

  return (
    <>
      <p className="faint" style={{ marginTop: "1.25rem" }}>
        <Link href="/">Home</Link> / mockups / edit flows
      </p>
      <h1>Edit projection — two mockups</h1>
      <p className="lede">
        Same player (CMC · SF). Toggle A vs B. These are static mockups — nothing
        saves.
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.4rem",
          marginBottom: "1.25rem",
        }}
      >
        <button
          type="button"
          className={`badge${option === "A" ? " accent" : ""}`}
          onClick={() => {
            setOption("A");
            setSheet(null);
            setRichField(null);
          }}
        >
          A · Three guided sheets
        </button>
        <button
          type="button"
          className={`badge${option === "B" ? " accent" : ""}`}
          onClick={() => {
            setOption("B");
            setSheet(null);
            setRichField(null);
          }}
        >
          B · Per-field + rich modal
        </button>
      </div>

      <div className="callout">
        {option === "A" ? (
          <>
            <strong>Option A:</strong> open any Edit button — hist table + Expected
            column (share also has editable D/E/U bands under the table).
          </>
        ) : (
          <>
            <strong>Option B:</strong> keep today&apos;s field list, but each Edit
            opens a richer modal with hist / related numbers so you&apos;re not
            editing blind.
          </>
        )}
      </div>

      <div className="mock-player-chrome">
        <h2 style={{ marginBottom: "0.25rem" }}>Christian McCaffrey</h2>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          <span className="badge accent">RB</span>
          <span className="badge">SF</span>
          <span className="badge">RB1</span>
        </div>
        <div className="stat-grid" style={{ marginTop: "0.75rem" }}>
          <div className="stat">
            <div className="label">Downside</div>
            <div className="value num warn">271.9</div>
            <div className="sub">RB5</div>
          </div>
          <div className="stat">
            <div className="label">Expected</div>
            <div className="value num">346.2</div>
            <div className="sub">RB1</div>
          </div>
          <div className="stat">
            <div className="label">Upside</div>
            <div className="value num accent">375.5</div>
            <div className="sub">RB1</div>
          </div>
        </div>
      </div>

      {option === "A" ? (
        <OptionA onOpen={setSheet} />
      ) : (
        <OptionB onEdit={setRichField} />
      )}

      {sheet ? (
        <BucketSheet kind={sheet} onClose={() => setSheet(null)} />
      ) : null}
      {richField ? (
        <RichFieldModal field={richField} onClose={() => setRichField(null)} />
      ) : null}
    </>
  );
}

function OptionA({
  onOpen,
}: {
  onOpen: (k: "offense" | "share" | "eff") => void;
}) {
  return (
    <div className="share-stack" style={{ marginTop: "1.25rem" }}>
      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Team offense (SF)</h3>
        <p className="muted" style={{ fontSize: "0.9rem" }}>
          25.3 PPG (#7) · 4,536 pass yds · 1,920 rush yds · 62.9 plays/G · 54%
          pass
        </p>
        <button
          type="button"
          className="btn primary"
          onClick={() => onOpen("offense")}
        >
          Submit an edit to team offense
        </button>
      </div>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Player share</h3>
        <p className="muted" style={{ fontSize: "0.9rem" }}>
          Rush 55.5% → <strong>65%</strong> → 65% · Targets 17% →{" "}
          <strong>17%</strong> → 17%
        </p>
        <button
          type="button"
          className="btn primary"
          onClick={() => onOpen("share")}
        >
          Submit an edit to player share
        </button>
      </div>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Player efficiency</h3>
        <p className="muted" style={{ fontSize: "0.9rem" }}>
          4.6 YPC · 3.8% rush TD · 80% catch · 6.4 YPT · 5.0% rec TD
        </p>
        <button
          type="button"
          className="btn primary"
          onClick={() => onOpen("eff")}
        >
          Submit an edit to player efficiency
        </button>
      </div>
    </div>
  );
}

function OptionB({ onEdit }: { onEdit: (field: string) => void }) {
  const rows: { field: string; label: string; value: string; note: string }[] = [
    {
      field: "implied_ppg",
      label: "Projected points per game",
      value: "25.3",
      note: "How many points you think this offense scores per game in 2026.",
    },
    {
      field: "plays_pg",
      label: "Projected plays per game",
      value: "62.9",
      note: "How many offensive plays per game you expect (pace).",
    },
    {
      field: "pass_rate",
      label: "Projected pass rate",
      value: "54.0%",
      note: "Share of plays that are passes in 2026.",
    },
    {
      field: "rush_share",
      label: "Expected rush share",
      value: "65.0%",
      note: "Share of team rushes over a full healthy season.",
    },
    {
      field: "ypc",
      label: "Yards per carry",
      value: "4.60",
      note: "Rush yards ÷ rush attempts.",
    },
  ];

  return (
    <div style={{ marginTop: "1.25rem" }}>
      <h2>Edit projection</h2>
      <p className="muted" style={{ fontSize: "0.9rem" }}>
        Same inventory layout as today. Click Edit to see the richer modal
        mockup.
      </p>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Field</th>
              <th className="right">Value</th>
              <th className="right">Edit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.field}>
                <td className="field-cell">
                  {r.label}
                  <span className="field-note">{r.note}</span>
                </td>
                <td className="right num">{r.value}</td>
                <td className="right">
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => onEdit(r.field)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BucketSheet({
  kind,
  onClose,
}: {
  kind: "offense" | "share" | "eff";
  onClose: () => void;
}) {
  const title =
    kind === "offense"
      ? "Edit team offense · SF"
      : kind === "share"
        ? "Edit player share · McCaffrey"
        : "Edit player efficiency · McCaffrey";

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
      >
        <h2 id="propose-title">{title}</h2>
        <p className="modal-meta">
          Mockup · change only what you disagree with · 0 fields changed
        </p>

        {kind === "offense" ? <OffenseHistEditTable /> : null}
        {kind === "share" ? <ShareHistEditTable /> : null}
        {kind === "eff" ? <EffHistEditTable /> : null}

        <div className="field" style={{ marginTop: "1rem" }}>
          <label>Rationale (for changed fields)</label>
          <textarea
            rows={3}
            defaultValue=""
            placeholder="Why should these inputs change?"
            readOnly
          />
        </div>
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
          <button type="button" className="btn primary" disabled>
            Submit edits (mock)
          </button>
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/** Static SF mock — Option 1 locked: hist + Expected + PPG band. */
function OffenseHistEditTable() {
  const years = [2023, 2024, 2025] as const;

  type Cell = string | { edit: string; hint?: string };

  const rows: { label: string; cells: Cell[] }[] = [
    {
      label: "PPG",
      cells: ["28.9", "22.9", "25.7", { edit: "25.3", hint: "#7 market" }],
    },
    {
      label: "Plays / G",
      cells: ["60.2", "60.5", "63.9", { edit: "62.9" }],
    },
    {
      label: "Pass rate",
      cells: ["52%", "56%", "57%", { edit: "54.0", hint: "%" }],
    },
    {
      label: "Pass yards",
      cells: ["4,577", "4,424", "4,318", "4,536"],
    },
    {
      label: "Rush yards",
      cells: ["2,413", "2,171", "1,836", "1,920"],
    },
  ];

  return (
    <div style={{ marginTop: "0.5rem" }}>
      <p className="muted" style={{ fontSize: "0.88rem", maxWidth: "42rem" }}>
        Read left → right: what this offense actually did, then pin 2026
        Expected. PPG band below is Downside / Expected / Upside.
      </p>
      <p className="faint" style={{ fontSize: "0.8rem", marginTop: "0.35rem" }}>
        HC Kyle Shanahan · OC Klay Kubiak · continuity · Win total 10.5 · Raising
        offense lifts all SF skill players.
      </p>

      <div className="table-wrap edit-hist-wrap edit-sheet-block">
        <table className="data edit-hist-table">
          <thead>
            <tr>
              <th>Category</th>
              {years.map((y) => (
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
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="edit-hist-table__label">{row.label}</td>
                {row.cells.map((cell, i) => {
                  const isProj = i === row.cells.length - 1;
                  if (typeof cell !== "string") {
                    return (
                      <td key={i} className="right edit-hist-table__proj">
                        <input
                          className="num edit-hist-table__input"
                          defaultValue={cell.edit}
                          readOnly
                          aria-label={`${row.label} 2026`}
                        />
                        {cell.hint ? (
                          <div className="edit-hist-table__hint">{cell.hint}</div>
                        ) : null}
                      </td>
                    );
                  }
                  return (
                    <td
                      key={i}
                      className={`right num${isProj ? " edit-hist-table__proj" : ""}`}
                    >
                      {cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="edit-ppg-band">
        <div className="edit-ppg-band__head">
          <div className="edit-bucket-band__title">2026 offense band (PPG)</div>
          <p className="edit-sheet-meta">
            Expected matches the PPG row. Downside / Upside follow scenario
            volume × efficiency.
          </p>
        </div>
        <div className="stat-grid edit-bucket-stats edit-bucket-stats--3">
          <div className="stat">
            <div className="label">Downside</div>
            <div className="value num warn">23.8</div>
            <div className="sub">Cold year, continuity intact</div>
          </div>
          <div className="stat">
            <div className="label">Expected</div>
            <div className="value num">25.3</div>
            <div className="sub">From PPG row above</div>
          </div>
          <div className="stat">
            <div className="label">Upside</div>
            <div className="value num accent">28.1</div>
            <div className="sub">Strong year destination</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShareHistEditTable() {
  const years = [
    { y: 2023, gp: 16 },
    { y: 2024, gp: 4, thin: true },
    { y: 2025, gp: 17 },
  ];
  const rows = [
    {
      label: "Rush share",
      hist: ["57.3%", "11.1%", "67.3%"],
      expected: "65.0",
    },
    {
      label: "Target share",
      hist: ["17.6%", "3.7%", "23.3%"],
      expected: "17.0",
    },
  ];

  return (
    <div style={{ marginTop: "0.5rem" }}>
      <p className="edit-sheet-lead">
        Hist on the left. Edit the boxed values in <strong>2026 Expected</strong>.
        Bands below are Downside / Expected / Upside.
      </p>
      <p className="edit-sheet-meta">
        Expected + Other on the SF pie should sum near 100%. Upside bands do
        not. <span className="text-link">Edit on SF pie</span>
      </p>

      <div className="table-wrap edit-hist-wrap edit-sheet-block">
        <table className="data edit-hist-table">
          <thead>
            <tr>
              <th>Category</th>
              {years.map((c) => (
                <th
                  key={c.y}
                  className={`right${c.thin ? " edit-hist-table__thin-year" : ""}`}
                >
                  {c.y}
                  <span className="edit-hist-table__proj-sub">
                    {c.gp} GP{c.thin ? " · small sample" : ""}
                  </span>
                </th>
              ))}
              <th className="right edit-hist-table__proj">
                2026
                <span className="edit-hist-table__proj-sub">Editable</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="edit-hist-table__label">{row.label}</td>
                {row.hist.map((cell, i) => (
                  <td
                    key={cell}
                    className={`right num${years[i]?.thin ? " edit-hist-table__thin-year" : ""}`}
                  >
                    {cell}
                  </td>
                ))}
                <td className="right edit-hist-table__proj">
                  <div className="edit-hist-table__input-wrap">
                    <input
                      className="num edit-hist-table__input"
                      defaultValue={row.expected}
                      readOnly
                    />
                    <span className="edit-hist-table__suffix">%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(
        [
          ["Rush share band", "55.5", "65.0", "65.0"],
          ["Target share band", "17.0", "17.0", "17.0"],
        ] as const
      ).map(([title, dn, exp, up]) => (
        <div key={title} className="edit-ppg-band">
          <div className="edit-ppg-band__head">
            <div className="edit-bucket-band__title">{title}</div>
            <p className="edit-sheet-meta">
              Edit Expected in the table. Downside / Upside are separate pins.
            </p>
          </div>
          <div className="stat-grid edit-bucket-stats edit-bucket-stats--3">
            <div className="stat">
              <div className="label">Downside</div>
              <div className="edit-hist-table__input-wrap edit-ppg-band__control">
                <input
                  className="num edit-hist-table__input"
                  defaultValue={dn}
                  readOnly
                />
                <span className="edit-hist-table__suffix">%</span>
              </div>
              <div className="sub">Soft healthy floor</div>
            </div>
            <div className="stat">
              <div className="label">Expected</div>
              <div className="edit-ppg-band__readonly num">{exp}%</div>
              <div className="sub">From table above</div>
            </div>
            <div className="stat">
              <div className="label">Upside</div>
              <div className="edit-hist-table__input-wrap edit-ppg-band__control">
                <input
                  className="num edit-hist-table__input"
                  defaultValue={up}
                  readOnly
                />
                <span className="edit-hist-table__suffix">%</span>
              </div>
              <div className="sub">Healthy ceiling</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EffHistEditTable() {
  const years = [
    { y: 2023, gp: 16 },
    { y: 2024, gp: 4, thin: true },
    { y: 2025, gp: 17 },
  ];
  const groups: {
    title: string;
    rows: { label: string; hist: string[]; expected: string; suffix?: string }[];
  }[] = [
    {
      title: "Rush",
      rows: [
        { label: "Yards / carry", hist: ["5.36", "4.04", "3.86"], expected: "3.95" },
        {
          label: "Rush TD rate",
          hist: ["5.1%", "0.0%", "3.2%"],
          expected: "3.3",
          suffix: "%",
        },
      ],
    },
    {
      title: "Receiving",
      rows: [
        {
          label: "Catch %",
          hist: ["80.7%", "78.9%", "79.1%"],
          expected: "80.0",
          suffix: "%",
        },
        { label: "Yards / target", hist: ["6.80", "7.68", "7.01"], expected: "6.39" },
        {
          label: "Rec TD rate",
          hist: ["8.4%", "0.0%", "5.4%"],
          expected: "5.0",
          suffix: "%",
        },
      ],
    },
  ];

  const colSpan = years.length + 2;

  return (
    <div style={{ marginTop: "0.5rem" }}>
      <p className="edit-sheet-lead">
        Hist on the left. Edit the boxed values in <strong>2026 Expected</strong>.
        Rates are Expected pins — no downside/upside fields yet.
      </p>

      <div className="table-wrap edit-hist-wrap edit-sheet-block">
        <table className="data edit-hist-table">
          <thead>
            <tr>
              <th>Category</th>
              {years.map((c) => (
                <th
                  key={c.y}
                  className={`right${c.thin ? " edit-hist-table__thin-year" : ""}`}
                >
                  {c.y}
                  <span className="edit-hist-table__proj-sub">
                    {c.gp} GP{c.thin ? " · small sample" : ""}
                  </span>
                </th>
              ))}
              <th className="right edit-hist-table__proj">
                2026
                <span className="edit-hist-table__proj-sub">Editable</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {groups.flatMap((g) => [
              <tr key={`g-${g.title}`} className="edit-hist-table__group-row">
                <td colSpan={colSpan}>{g.title}</td>
              </tr>,
              ...g.rows.map((row) => (
                <tr key={`${g.title}-${row.label}`}>
                  <td className="edit-hist-table__label">{row.label}</td>
                  {row.hist.map((cell, i) => (
                    <td
                      key={i}
                      className={`right num${years[i]?.thin ? " edit-hist-table__thin-year" : ""}`}
                    >
                      {cell}
                    </td>
                  ))}
                  <td className="right edit-hist-table__proj">
                    <div className="edit-hist-table__input-wrap">
                      <input
                        className="num edit-hist-table__input"
                        defaultValue={row.expected}
                        readOnly
                      />
                      {row.suffix ? (
                        <span className="edit-hist-table__suffix">{row.suffix}</span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              )),
            ])}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RichFieldModal({
  field,
  onClose,
}: {
  field: string;
  onClose: () => void;
}) {
  const meta: Record<
    string,
    { title: string; current: string; doctrine: string; context: string[] }
  > = {
    implied_ppg: {
      title: "SF · Projected points per game",
      current: "25.3",
      doctrine: "How many points you think this offense scores per game in 2026.",
      context: [
        "League rank: #5 PPG",
        "Recent PPG: 28.4 · 27.1 · 25.9",
        "Win total ~11.5 — related but not the same as PPG",
        "Raising PPG lifts all SF skill players, not just CMC",
      ],
    },
    plays_pg: {
      title: "SF · Projected plays per game",
      current: "62.9",
      doctrine: "How many offensive plays per game you expect (pace).",
      context: [
        "Plays rank: ~#8",
        "Pair with PPG: same points + fewer plays ⇒ more efficient",
        "Hist plays/G: 64.1 · 63.0 · 61.2",
      ],
    },
    pass_rate: {
      title: "SF · Projected pass rate",
      current: "54.0%",
      doctrine: "Share of plays that are passes in 2026 (not last year’s rate).",
      context: [
        "Pass yds ~4,100 (#?) · Rush yds ~2,200",
        "Higher pass% can raise CMC targets; lower can raise rush volume",
        "Hist pass%: 56% · 55% · 53%",
      ],
    },
    rush_share: {
      title: "McCaffrey · Expected rush share",
      current: "65.0%",
      doctrine: "Share of team rushes over a full healthy season.",
      context: [
        "Band: downside 55.5% · expected 65% · upside 65%",
        "SF rush pie: CMC 65% · named others + Other = 35%",
        "Hist rush%: 58 · 62 · 55",
        "Joint constraint: expected + Other ≈ 100%",
      ],
    },
    ypc: {
      title: "McCaffrey · Yards per carry",
      current: "4.60",
      doctrine: "Rush yards ÷ rush attempts.",
      context: [
        "Hist YPC: 4.4 · 4.7 · 4.5",
        "Team rush yards ÷ designed rushes as a sanity check",
        "Elite FP can come from volume even if YPC is merely good",
      ],
    },
  };

  const m = meta[field] ?? meta.implied_ppg;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal outlook-modal"
        style={{ width: "min(560px, 100%)", maxHeight: "90vh", overflow: "auto" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <h2>Edit · richer context</h2>
        <p className="modal-meta">{m.title}</p>
        <div className="modal-official">
          <div>
            Current <strong>{m.current}</strong>
          </div>
          <div className="official-doctrine">{m.doctrine}</div>
        </div>
        <ContextBlock title="What to know before you change it" lines={m.context} />
        <div className="field">
          <label>Your value</label>
          <input defaultValue={m.current.replace("%", "")} readOnly />
        </div>
        <div className="field">
          <label>Confidence</label>
          <select defaultValue="med" disabled>
            <option value="med">Med</option>
          </select>
        </div>
        <div className="field">
          <label>Rationale</label>
          <textarea
            rows={3}
            placeholder="Why should this input change?"
            readOnly
          />
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button type="button" className="btn primary" disabled>
            Submit edit (mock)
          </button>
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function ContextBlock({ title, lines }: { title: string; lines: string[] }) {
  return (
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
        {title}
      </div>
      <ul className="guide-list" style={{ margin: 0, fontSize: "0.88rem" }}>
        {lines.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    </div>
  );
}

function FieldRow({
  label,
  current,
  suffix = "",
  accent,
}: {
  label: string;
  current: string;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 7rem",
        gap: "0.5rem",
        alignItems: "center",
        marginBottom: "0.45rem",
      }}
    >
      <label style={{ margin: 0, fontSize: "0.9rem" }}>
        {label}
        {accent ? (
          <span className="faint" style={{ marginLeft: 6 }}>
            expected
          </span>
        ) : null}
      </label>
      <input
        className="num"
        defaultValue={current}
        readOnly
        style={{ textAlign: "right" }}
        aria-label={`${label} ${suffix}`}
      />
    </div>
  );
}
