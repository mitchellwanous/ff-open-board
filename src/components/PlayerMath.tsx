import Link from "next/link";
import {
  BRAND_PLAYER_MATH_CTA,
  BRAND_PLAYER_MATH_SUB,
  BRAND_PLAYER_MATH_TITLE,
} from "@/lib/brand";

export type PlayerMathPieRow = {
  name: string;
  share: string;
  /** Emphasize the subject player in the pie strip. */
  highlight?: boolean;
};

export type PlayerMathContent = {
  summary: string[];
  base: {
    paras: string[];
    /** Teammate target/rush pie — previews the contribute sheet. */
    pie?: PlayerMathPieRow[];
    pieNote?: string;
    verdict: string;
  };
  upside: {
    path: string[];
    verdict: string;
  };
  limits: string[];
};

type Props = {
  content: PlayerMathContent;
  /** Jump target for contribute CTA (e.g. `#suggest` or live player URL). */
  contributeHref?: string;
  /** When false, omit the footer CTA (parent owns the contribute button). */
  showCta?: boolean;
};

export function PlayerMath({
  content,
  contributeHref = "#suggest",
  showCta = true,
}: Props) {
  return (
    <section className="player-math" aria-labelledby="player-math-heading">
      <div className="player-math-head">
        <div>
          <h2 id="player-math-heading" className="player-math-title">
            {BRAND_PLAYER_MATH_TITLE}
          </h2>
          <p className="player-math-sub">{BRAND_PLAYER_MATH_SUB}</p>
        </div>
      </div>

      <div className="player-math-block">
        <h3 className="player-math-h">
          <span className="player-math-eyebrow">Summary</span>
        </h3>
        <ul className="player-math-list">
          {content.summary.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <div className="player-math-block">
        <h3 className="player-math-h">
          <span className="player-math-eyebrow">Base case</span>
        </h3>
        {content.base.paras.map((para) => (
          <p key={para} className="player-math-p">
            {para}
          </p>
        ))}
        {content.base.pie && content.base.pie.length > 0 ? (
          <div className="player-math-pie">
            {content.base.pieNote ? (
              <p className="player-math-pie-note">{content.base.pieNote}</p>
            ) : null}
            <div className="table-wrap">
              <table className="data player-math-pie-table">
                <thead>
                  <tr>
                    <th>Claimant</th>
                    <th className="right">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {content.base.pie.map((row) => (
                    <tr
                      key={row.name}
                      className={
                        row.highlight ? "player-math-pie-row--hl" : undefined
                      }
                    >
                      <td>
                        {row.highlight ? <strong>{row.name}</strong> : row.name}
                      </td>
                      <td className="right num">{row.share}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
        <p className="player-math-verdict" aria-label="Base projection">
          <span className="player-math-verdict-value num">
            {content.base.verdict}
          </span>
        </p>
      </div>

      <div className="player-math-block">
        <h3 className="player-math-h">
          <span className="player-math-eyebrow">Upside case</span>
        </h3>
        <p className="player-math-p player-math-p--lead">The path is:</p>
        <ol className="player-math-ol">
          {content.upside.path.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
        <p
          className="player-math-verdict player-math-verdict--up"
          aria-label="Upside projection"
        >
          <span className="player-math-verdict-value num accent">
            {content.upside.verdict}
          </span>
        </p>
      </div>

      <div className="player-math-block player-math-block--limits">
        <h3 className="player-math-h">
          <span className="player-math-eyebrow">Where upside is limited</span>
        </h3>
        <ul className="player-math-list player-math-list--muted">
          {content.limits.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      {showCta ? (
        <p className="player-math-cta">
          {BRAND_PLAYER_MATH_CTA}{" "}
          <Link href={contributeHref} className="text-link">
            Contribute to this projection
          </Link>
          .
        </p>
      ) : null}
    </section>
  );
}
