"use client";

import { useCallback, useEffect, useState } from "react";
import type { ClaimableField } from "@/lib/types";
import { displayClaimValue } from "@/lib/format";
import { ProposeButton } from "./ProposeButton";

type Community = Record<
  string,
  { median: number; n: number; unlocked?: boolean }
>;

type Row = {
  field: ClaimableField;
  official: number | null;
};

/** Live collective: unlocked consensus (n≥min) is the board value. */
export function ClaimableTable({
  grain,
  subjectId,
  subjectLabel,
  rows,
}: {
  grain: "team" | "player";
  subjectId: string;
  subjectLabel: string;
  rows: Row[];
}) {
  const [community, setCommunity] = useState<Community>({});

  const refresh = useCallback(async () => {
    const q = new URLSearchParams({
      grain,
      subject_id: subjectId,
    });
    const res = await fetch(`/api/edits?${q}`);
    if (!res.ok) return;
    const data = await res.json();
    setCommunity(data.community ?? {});
  }, [grain, subjectId]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void refresh();
    }, 0);
    const onUp = () => void refresh();
    window.addEventListener("ff-edits-updated", onUp);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("ff-edits-updated", onUp);
    };
  }, [refresh]);

  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>
            <th>Field</th>
            <th className="right">Value</th>
            <th className="right">Contribute</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ field, official }) => {
            const c = community[field.field];
            const display =
              c?.unlocked && c.median != null ? c.median : official;
            const proposeFrom =
              c?.unlocked && c.median != null
                ? c.median
                : (c?.median ?? official);
            return (
              <tr key={field.field}>
                <td className="field-cell">
                  {field.label}
                  <span className="field-note">{field.doctrine}</span>
                </td>
                <td className="right num">
                  {displayClaimValue(field.field, display, field.unit)}
                  {c && c.n > 0 ? (
                    <span className="faint" style={{ marginLeft: 4 }}>
                      {c.unlocked
                        ? `· live (${c.n})`
                        : `· ${c.n} of 3`}
                    </span>
                  ) : null}
                </td>
                <td className="right">
                  <ProposeButton
                    grain={grain}
                    subjectId={subjectId}
                    subjectLabel={subjectLabel}
                    field={field}
                    officialValue={proposeFrom}
                    buttonLabel="Contribute"
                    onSubmitted={refresh}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
