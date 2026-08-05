import { fmt } from "@/lib/format";
import { BRAND_RANK_EXPECTED_SHORT, BRAND_RANK_HIST_SHORT } from "@/lib/brand";

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

/** Compact FP + positional rank for Downside / Expected / Upside cells. */
export function ScenarioFpCell({
  kind,
  position,
  fp,
  rank,
  digits = 1,
  fpClassName,
}: Props) {
  const method =
    kind === "expected" ? BRAND_RANK_EXPECTED_SHORT : BRAND_RANK_HIST_SHORT;
  return (
    <>
      <span className={fpClassName ? `num ${fpClassName}` : "num"}>
        {fmt(fp, digits)}
      </span>
      {rank != null ? (
        <div className="faint" style={{ fontSize: "0.8rem", fontWeight: 400 }}>
          {position}
          {rank}
          <div style={{ fontSize: "0.65rem", marginTop: 2, lineHeight: 1.2 }}>
            {method}
          </div>
        </div>
      ) : null}
    </>
  );
}
