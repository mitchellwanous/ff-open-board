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

/** Keep position groups together so WR/RB rows aren’t interleaved. */
const POS_ORDER: Record<"target" | "rush", Record<string, number>> = {
  target: { WR: 0, TE: 1, RB: 2, QB: 3 },
  rush: { RB: 0, QB: 1, WR: 2, TE: 3 },
};

function toShare(pctOrShare: number | null | undefined): number | null {
  if (pctOrShare == null || Number.isNaN(pctOrShare)) return null;
  return Math.abs(pctOrShare) > 1.5 ? pctOrShare / 100 : pctOrShare;
}

function sortSegs(
  segs: PieSegment[],
  pieKind: "target" | "rush",
): PieSegment[] {
  const order = POS_ORDER[pieKind];
  return [...segs].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "depth" ? 1 : -1;
    if (a.kind === "player" && b.kind === "player") {
      const pa = order[a.position] ?? 50;
      const pb = order[b.position] ?? 50;
      if (pa !== pb) return pa - pb;
    }
    return (b.share ?? 0) - (a.share ?? 0);
  });
}

export function SharePieEditor({
  team,
  pieKind,
  title,
  segs,
  claimable,
  playerHrefPrefix = "/players",
}: {
  team: string;
  pieKind: "target" | "rush";
  title: string;
  segs: PieSegment[];
  claimable: ClaimableField[];
  /** Base path for player links, e.g. `/players`. */
  playerHrefPrefix?: string;
}) {
  const baseField = pieKind === "target" ? "target_share" : "rush_share";
  const dnField = pieKind === "target" ? "target_share_dn" : "rush_share_dn";
  const ceilField =
    pieKind === "target" ? "target_share_ceil" : "rush_share_ceil";

  const baseDef = claimable.find((c) => c.field === baseField);
  const dnDef = claimable.find((c) => c.field === dnField);
  const ceilDef = claimable.find((c) => c.field === ceilField);

  const orderedSegs = useMemo(() => sortSegs(segs, pieKind), [segs, pieKind]);

  const [communityBySubject, setCommunityBySubject] = useState<
    Record<string, Community>
  >({});

  const refresh = useCallback(async () => {
    const next: Record<string, Community> = {};
    await Promise.all(
      orderedSegs.map(async (s) => {
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
  }, [orderedSegs, team]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const baseSumPct = useMemo(
    () => orderedSegs.reduce((acc, s) => acc + (s.share ?? 0), 0),
    [orderedSegs],
  );
  const ceilSumPct = useMemo(
    () =>
      orderedSegs.reduce((acc, s) => {
        if (s.kind !== "player") return acc;
        return acc + (s.share_ceil ?? s.share ?? 0);
      }, 0),
    [orderedSegs],
  );
  const baseOk = Math.abs(baseSumPct - 100) <= 3;

  return (
    <div className="panel">
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p className="muted" style={{ fontSize: "0.85rem", marginTop: 0 }}>
        These named shares are collective inputs
        {pieKind === "rush" ? " (QB always listed)" : ""}. Contribute downside /
        expected / upside; everyone else rolls into <strong>Other</strong>.{" "}
        <strong>Expected</strong> (named + Other) should sum ≈ 100%. Upside
        shares do not — they can&apos;t all hit together.
      </p>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Claimant</th>
              <th className="right">Downside</th>
              <th className="right">Expected</th>
              <th className="right">Upside</th>
              <th className="right">Contribute</th>
            </tr>
          </thead>
          <tbody>
            {orderedSegs.map((s) => {
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
                      <Link href={`${playerHrefPrefix}/${s.player_id}`}>
                        {s.name}
                      </Link>
                    ) : (
                      <strong>{s.name}</strong>
                    )}
                    <div className="faint" style={{ fontSize: "0.8rem" }}>
                      {s.kind === "player" ? s.position : "rest of roster"}
                    </div>
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
                    <div className="pie-edit-actions">
                      {s.kind === "player" && s.player_id && dnDef ? (
                        <ProposeButton
                          grain="player"
                          subjectId={s.player_id}
                          subjectLabel={s.name}
                          field={dnDef}
                          officialValue={toShare(s.share_dn)}
                          buttonLabel="Downside"
                          buttonClassName="btn primary pie-edit-btn"
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
                          buttonLabel="Expected"
                          buttonClassName="btn primary pie-edit-btn"
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
                          buttonLabel="Upside"
                          buttonClassName="btn primary pie-edit-btn"
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
                          buttonLabel="Expected"
                          buttonClassName="btn primary pie-edit-btn"
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
        Expected sum: {fmt(baseSumPct, 1)}%{" "}
        {baseOk ? "(≈ 100% ✓)" : "(should be near 100%)"} · Named upside sum:{" "}
        {fmt(ceilSumPct, 1)}% (not required to sum — joint constraint)
      </p>
    </div>
  );
}
