import { getSubjectChangeLog } from "@/lib/subjectChangeLog";

/** Bottom-of-card change log for one player or team. */
export async function SubjectChangeLog({
  grain,
  subjectId,
  subjectLabel,
}: {
  grain: "team" | "player";
  subjectId: string;
  subjectLabel: string;
}) {
  const rows = await getSubjectChangeLog(grain, subjectId);
  const who = grain === "team" ? subjectLabel : subjectLabel;

  return (
    <section
      className="home-section"
      aria-labelledby="change-log-heading"
      style={{ marginTop: "2rem" }}
    >
      <h2 id="change-log-heading">Change log</h2>
      <p className="muted" style={{ fontSize: "0.9rem", maxWidth: "36rem" }}>
        What changed for {who} — board updates and recent contributions.
      </p>
      {rows.length === 0 ? (
        <p className="outlook-empty" style={{ marginTop: "0.75rem" }}>
          No changes yet. When people contribute inputs here, they show up in
          this list.
        </p>
      ) : (
        <ul className="guide-list" style={{ marginTop: "0.75rem" }}>
          {rows.map((r, i) => (
            <li key={`${r.kind}-${r.field}-${r.at}-${i}`}>
              <span className="faint">{r.at}</span>
              {" · "}
              {r.kind === "board" ? (
                <span>Board updated — </span>
              ) : (
                <span>Contribution — </span>
              )}
              {r.summary}
              {r.detail ? (
                <span className="faint"> — {r.detail}</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
