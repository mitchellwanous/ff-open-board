import { fmt } from "@/lib/format";

type ScenarioKind = "downside" | "expected" | "upside";

type Props = {
  kind: ScenarioKind;
  position: string;
  fp: number | null | undefined;
  rank: number | null | undefined;
  /** Digits after decimal for FP. Default 1. */
  digits?: number;
  /** Optional extra class on the FP number (e.g. warn / accent). */
  fpClassName?: string;
};

/**
 * Compact FP + positional rank badge.
 * Rank method labels live once in the table/column header — not per row.
 */
export function ScenarioFpCell({
  position,
  fp,
  rank,
  digits = 1,
  fpClassName,
}: Props) {
  return (
    <>
      <span className={fpClassName ? `num ${fpClassName}` : "num"}>
        {fmt(fp, digits)}
      </span>
      {rank != null ? (
        <div style={{ marginTop: 4 }}>
          <span className="badge" style={{ fontSize: "0.72rem" }}>
            {position}
            {rank}
          </span>
        </div>
      ) : null}
    </>
  );
}
