"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ClaimableField, PieSegment } from "@/lib/types";
import { displayClaimValue, fmt } from "@/lib/format";
import { ProposeButton } from "./ProposeButton";

type Community = Record<string, { median: number; n: number }>;

const DEPTH_FIELD: Record<"target" | "rush", string> = {
  target: "target_share_other",
  rush: "rush_share_other",
};

function toShare(pctOrShare: number | null | undefined): number | null {
  if (pctOrShare == null || Number.isNaN(pctOrShare)) return null;
  return Math.abs(pctOrShare) > 1.5 ? pctOrShare / 100 : pctOrShare;
}

export function SharePieEditor({
  team,
  pieKind,
  title,
  segs,
  claimable,
}: {
  team: string;
  pieKind: "target" | "rush";
  title: string;
  segs: PieSegment[];
  claimable: ClaimableField[];
}) {
  const baseField = pieKind === "target" ? "target_share" : "rush_share";
  const dnField = pieKind === "target" ? "target_share_dn" : "rush_share_dn";
  const ceilField =
    pieKind === "target" ? "target_share_ceil" : "rush_share_ceil";

  const baseDef = claimable.find((c) => c.field === baseField);
  const dnDef = claimable.find((c) => c.field === dnField);
  const ceilDef = claimable.find((c) => c.field === ceilField);

  const [communityBySubject, setCommunityBySubject] = useState<
    Record<string, Community>
  >({});

  const refresh = useCallback(async () => {
    const next: Record<string, Community> = {};
    await Promise.all(
      segs.map(async (s) => {
        if (s.kind === "player" && s.player_id) {
          const q = new URLSearchParams({
            grain: "player",
            subject_id: s.player_id,
          });
          const res = await fetch(`/api/edits?${q}`);
          if (!res.ok) return;
          const data = await res.json();
          next[s.player_id] = data.community ?? {};
        } else if (s.kind === "depth") {
          const field = DEPTH_FIELD[pieKind];
          const q = new URLSearchParams({
            grain: "team",
            subject_id: team,
          });
          const res = await fetch(`/api/edits?${q}`);
          if (!res.ok) return;
          const data = await res.json();
          next[`depth:OTHER`] = data.community ?? {};
        }
      }),
    );
    setCommunityBySubject(next);
  }, [segs, pieKind, team]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const baseSumPct = useMemo(
    () => segs.reduce((acc, s) => acc + (s.share ?? 0), 0),
    [segs],
  );
  const ceilSumPct = useMemo(
    () =>
      segs.reduce((acc, s) => {
        if (s.kind !== "player") return acc;
        return acc + (s.share_ceil ?? s.share ?? 0);
      }, 0),
    [segs],
  );
  const baseOk = Math.abs(baseSumPct - 100) <= 3;

  return (
    <div className="panel">
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p className="muted" style={{ fontSize: "0.85rem", marginTop: 0 }}>
        Propose downside / base / ceiling on named players
        {pieKind === "rush" ? " (QB always listed)" : ""}. Everyone else rolls
        into <strong>Other</strong>. <strong>Base</strong> (named + Other)
        should sum ≈ 100%. Ceilings do not — they can’t all hit together.
      </p>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Claimant</th>
              <th className="right">Downside</th>
              <th className="right">Base</th>
              <th className="right">Ceiling</th>
              <th className="right">Propose</th>
            </tr>
          </thead>
          <tbody>
            {segs.map((s) => {
              const key =
                s.kind === "player" ? s.player_id! : "depth:OTHER";
              const community = communityBySubject[key] ?? {};
              const depthField =
                s.kind === "depth" ? DEPTH_FIELD[pieKind] : null;
              const depthDef = depthField
                ? claimable.find((c) => c.field === depthField)
                : null;

              return (
                <tr key={key}>
                  <td>
                    {s.kind === "player" && s.player_id ? (
                      <Link href={`/players/${s.player_id}`}>{s.name}</Link>
                    ) : (
                      <strong>{s.name}</strong>
                    )}
                    {s.kind === "player" ? (
                      <span className="faint"> · {s.position}</span>
                    ) : (
                      <span className="faint"> · rest of roster</span>
                    )}
                  </td>
                  <td className="right num">
                    {s.kind === "player" ? (
                      <>
                        {fmt(s.share_dn, 1)}%
                        {community[dnField!] ? (
                          <div className="faint" style={{ fontSize: "0.75rem" }}>
                            {displayClaimValue(
                              dnField!,
                              community[dnField!].median,
                              "share",
                            )}{" "}
                            ({community[dnField!].n})
                          </div>
                        ) : null}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="right num">
                    {fmt(s.share, 1)}%
                    {s.kind === "player" && community[baseField] ? (
                      <div className="faint" style={{ fontSize: "0.75rem" }}>
                        {displayClaimValue(
                          baseField,
                          community[baseField].median,
                          "share",
                        )}{" "}
                        ({community[baseField].n})
                      </div>
                    ) : null}
                    {s.kind === "depth" &&
                    depthField &&
                    community[depthField] ? (
                      <div className="faint" style={{ fontSize: "0.75rem" }}>
                        {displayClaimValue(
                          depthField,
                          community[depthField].median,
                          "share",
                        )}{" "}
                        ({community[depthField].n})
                      </div>
                    ) : null}
                  </td>
                  <td className="right num">
                    {s.kind === "player" ? (
                      <>
                        {fmt(s.share_ceil, 1)}%
                        {community[ceilField!] ? (
                          <div className="faint" style={{ fontSize: "0.75rem" }}>
                            {displayClaimValue(
                              ceilField!,
                              community[ceilField!].median,
                              "share",
                            )}{" "}
                            ({community[ceilField!].n})
                          </div>
                        ) : null}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="right">
                    <div
                      style={{
                        display: "flex",
                        gap: "0.25rem",
                        justifyContent: "flex-end",
                        flexWrap: "wrap",
                      }}
                    >
                      {s.kind === "player" && s.player_id && dnDef ? (
                        <ProposeButton
                          grain="player"
                          subjectId={s.player_id}
                          subjectLabel={s.name}
                          field={dnDef}
                          officialValue={toShare(s.share_dn)}
                          buttonLabel="Dn"
                          onSubmitted={refresh}
                        />
                      ) : null}
                      {s.kind === "player" && s.player_id && baseDef ? (
                        <ProposeButton
                          grain="player"
                          subjectId={s.player_id}
                          subjectLabel={s.name}
                          field={baseDef}
                          officialValue={toShare(s.share)}
                          buttonLabel="Base"
                          onSubmitted={refresh}
                        />
                      ) : null}
                      {s.kind === "player" && s.player_id && ceilDef ? (
                        <ProposeButton
                          grain="player"
                          subjectId={s.player_id}
                          subjectLabel={s.name}
                          field={ceilDef}
                          officialValue={toShare(s.share_ceil)}
                          buttonLabel="Ceil"
                          onSubmitted={refresh}
                        />
                      ) : null}
                      {s.kind === "depth" && depthDef ? (
                        <ProposeButton
                          grain="team"
                          subjectId={team}
                          subjectLabel={`${team} ${s.name}`}
                          field={depthDef}
                          officialValue={toShare(s.share)}
                          buttonLabel="Base"
                          onSubmitted={refresh}
                        />
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p
        className={baseOk ? "muted" : "err"}
        style={{ fontSize: "0.85rem", marginBottom: 0 }}
      >
        Base sum: {fmt(baseSumPct, 1)}%{" "}
        {baseOk ? "(≈ 100% ✓)" : "(should be near 100%)"} · Named ceilings sum:{" "}
        {fmt(ceilSumPct, 1)}% (not required to sum — joint constraint)
      </p>
    </div>
  );
}
