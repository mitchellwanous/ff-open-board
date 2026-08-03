"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ClaimableField, PieSegment } from "@/lib/types";
import { displayClaimValue, fmt } from "@/lib/format";
import {
  TeamShareContributeSheet,
  buildShareHistForSeg,
  type ShareClaimantRow,
} from "./TeamShareContributeSheet";

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

/**
 * Team pie read table (Dn / Expected / Upside) + one Contribute sheet button.
 * Per-row Propose buttons removed — sheet matches player-card guided pattern.
 */
export function SharePieEditor({
  team,
  pieKind,
  title,
  segs,
  claimable,
  playerHrefPrefix = "/players",
  histYears,
  playerHist,
}: {
  team: string;
  pieKind: "target" | "rush";
  title: string;
  segs: PieSegment[];
  claimable: ClaimableField[];
  playerHrefPrefix?: string;
  /** Recent seasons for the contribute sheet hist columns. */
  histYears: number[];
  playerHist: Record<
    string,
    Array<{
      season: number;
      kind: string;
      team: string | null;
      target_share: number | null;
      rush_share: number | null;
    }>
  >;
}) {
  const baseField = pieKind === "target" ? "target_share" : "rush_share";
  const dnField = pieKind === "target" ? "target_share_dn" : "rush_share_dn";
  const ceilField =
    pieKind === "target" ? "target_share_ceil" : "rush_share_ceil";
  const depthFieldName = DEPTH_FIELD[pieKind];

  const baseDef = claimable.find((c) => c.field === baseField) ?? null;
  const dnDef = claimable.find((c) => c.field === dnField) ?? null;
  const ceilDef = claimable.find((c) => c.field === ceilField) ?? null;
  const depthDef = claimable.find((c) => c.field === depthFieldName) ?? null;

  const orderedSegs = useMemo(() => sortSegs(segs, pieKind), [segs, pieKind]);

  const [communityBySubject, setCommunityBySubject] = useState<
    Record<string, Community>
  >({});
  const [sheetOpen, setSheetOpen] = useState(false);

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

  const sheetRows: ShareClaimantRow[] = useMemo(
    () =>
      orderedSegs.map((s) => {
        const key = s.kind === "player" ? s.player_id! : "depth:OTHER";
        return {
          key,
          kind: s.kind,
          playerId: s.player_id,
          name: s.name,
          position: s.position,
          histBySeason: buildShareHistForSeg(
            s,
            pieKind,
            team,
            playerHist,
            histYears,
          ),
          shareDn: s.share_dn,
          share: s.share,
          shareCeil: s.share_ceil,
          dnField: s.kind === "player" ? dnDef : null,
          baseField: s.kind === "player" ? baseDef : depthDef,
          ceilField: s.kind === "player" ? ceilDef : null,
        };
      }),
    [
      orderedSegs,
      pieKind,
      team,
      playerHist,
      histYears,
      dnDef,
      baseDef,
      ceilDef,
      depthDef,
    ],
  );

  const contributeLabel =
    pieKind === "target"
      ? "Contribute to target share"
      : "Contribute to rush share";

  return (
    <div className="panel">
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p className="muted" style={{ fontSize: "0.85rem", marginTop: 0 }}>
        {pieKind === "rush" ? "QB always listed. " : null}
        Expected (named + Other) should sum ≈ 100%. Upside shares do not — they
        can&apos;t all hit together.
      </p>
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
            {orderedSegs.map((s) => {
              const key =
                s.kind === "player" ? s.player_id! : "depth:OTHER";
              const community = communityBySubject[key] ?? {};

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
                    depthFieldName &&
                    community[depthFieldName] ? (
                      <div className="faint" style={{ fontSize: "0.75rem" }}>
                        {displayClaimValue(
                          depthFieldName,
                          community[depthFieldName].median,
                          "share",
                        )}{" "}
                        ({community[depthFieldName].n})
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p
        className={baseOk ? "muted" : "err"}
        style={{ fontSize: "0.85rem" }}
      >
        Expected sum: {fmt(baseSumPct, 1)}%{" "}
        {baseOk ? "(≈ 100% ✓)" : "(should be near 100%)"} · Named upside sum:{" "}
        {fmt(ceilSumPct, 1)}% (not required to sum — joint constraint)
      </p>
      <button
        type="button"
        className="btn primary"
        style={{ marginTop: "0.35rem" }}
        onClick={() => setSheetOpen(true)}
      >
        {contributeLabel}
      </button>

      {sheetOpen ? (
        <TeamShareContributeSheet
          team={team}
          pieKind={pieKind}
          years={histYears}
          rows={sheetRows}
          onClose={() => setSheetOpen(false)}
          onSubmitted={refresh}
        />
      ) : null}
    </div>
  );
}
