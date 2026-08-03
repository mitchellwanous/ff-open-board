"use client";

import { useCallback, useEffect, useState } from "react";
import type { ClaimableField } from "@/lib/types";
import { displayClaimValue } from "@/lib/format";
import { ProposeButton } from "./ProposeButton";

type Community = Record<string, { median: number; n: number }>;

type Row = {
  field: ClaimableField;
  official: number | null;
};

/** Open-source board: community median *is* the live value when present. */
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
    void refresh();
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
            const live = c?.median ?? official;
            return (
              <tr key={field.field}>
                <td className="field-cell">
                  {field.label}
                  <span className="field-note">{field.doctrine}</span>
                </td>
                <td className="right num">
                  {displayClaimValue(field.field, live, field.unit)}
                  {c ? (
                    <span className="faint" style={{ marginLeft: 4 }}>
                      ({c.n})
                    </span>
                  ) : null}
                </td>
                <td className="right">
                  <ProposeButton
                    grain={grain}
                    subjectId={subjectId}
                    subjectLabel={subjectLabel}
                    field={field}
                    officialValue={live}
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
