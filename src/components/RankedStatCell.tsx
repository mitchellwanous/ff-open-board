import { fmt, fmtInt } from "@/lib/format";

type Props = {
  value: number | null | undefined;
  rank: number | null | undefined;
  /** Digits after decimal. Use null for integer formatting via fmtInt. */
  digits?: number | null;
};

/** Value with muted league rank underneath (e.g. 19.1 over #29). */
export function RankedStatCell({ value, rank, digits = 1 }: Props) {
  return (
    <>
      <span className="num">
        {digits == null ? fmtInt(value) : fmt(value, digits)}
      </span>
      {rank != null ? (
        <div className="faint" style={{ fontSize: "0.8rem", fontWeight: 400 }}>
          #{rank}
        </div>
      ) : null}
    </>
  );
}
