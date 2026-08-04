"use client";

import type { ReactNode } from "react";
import type { PlayerMathPayload } from "@/lib/types";

/**
 * Story-card player math: Summary → Base|Upside → Limits.
 * Hero + badge own FP → rank (from live outlook); verdicts are prose only.
 */
export type PlayerMathOutlook = {
  position: string;
  expectedFp: number;
  expectedRank: number | null;
  upsideFp: number;
  upsideRank: number | null;
};

/** Strip leading FP→rank punch so hero isn't duplicated. */
export function stripVerdictPunch(verdict: string | null | undefined): string | null {
  if (!verdict) return null;
  let s = verdict.trim();
  s = s.replace(
    /^(?:This is|That lands about)\s+[\d.,]+\s*half-PPR\s*→\s*[^.]+?\.\s*/i,
    "",
  );
  s = s.trim();
  return s.length > 0 ? s : null;
}

function posRank(position: string, rank: number | null): string {
  if (rank == null) return position;
  return `${position}${rank}`;
}

function wholeFp(fp: number): number {
  return Math.round(fp);
}

function boldNumbers(text: string): ReactNode {
  // Light emphasis on %-like / PPG-like tokens without over-decorating.
  const parts = text.split(/(\b\d+\.?\d*%(?:\s+of\s+(?:targets|rushes))?|\b\d+\.?\d*\s*PPG\b)/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part,
  );
}

export function PlayerMathSummary({ summary }: { summary: string[] }) {
  return (
    <div className="pm2-summary pm2-box">
      <span className="pm2-eyebrow">Summary</span>
      <ul className="pm2-summary-list">
        {summary.map((line) => (
          <li key={line}>{boldNumbers(line)}</li>
        ))}
      </ul>
    </div>
  );
}

export function PlayerMathCases({
  content,
  outlook,
}: {
  content: PlayerMathPayload;
  outlook: PlayerMathOutlook;
}) {
  const baseRank = posRank(outlook.position, outlook.expectedRank);
  const upsideRank = posRank(outlook.position, outlook.upsideRank);
  const baseVerdict = stripVerdictPunch(content.base.verdict);
  const upsideVerdict = stripVerdictPunch(content.upside.verdict);
  const path = content.upside.path ?? [];

  return (
    <div className="pm2-cases">
      <article className="pm2-card" aria-label="Base case">
        <div className="pm2-card-top">
          <span className="pm2-eyebrow">Base case</span>
          <span className="badge">{baseRank}</span>
        </div>
        <p className="pm2-fp num">
          {wholeFp(outlook.expectedFp)}
          <span className="pm2-fp-unit"> half-PPR</span>
        </p>
        {baseVerdict ? <p className="pm2-verdict">{baseVerdict}</p> : null}
        <ul className="pm2-points">
          {(content.base.paras ?? []).map((para) => (
            <li key={para}>{boldNumbers(para)}</li>
          ))}
        </ul>
      </article>

      <article className="pm2-card pm2-card--up" aria-label="Upside case">
        <div className="pm2-card-top">
          <span className="pm2-eyebrow">Upside case</span>
          <span className="badge accent">{upsideRank}</span>
        </div>
        <p className="pm2-fp num accent">
          {wholeFp(outlook.upsideFp)}
          <span className="pm2-fp-unit"> half-PPR</span>
        </p>
        {path.length > 0 ? (
          <>
            <p className="pm2-path-lead">The path is:</p>
            <ol className="pm2-path">
              {path.map((step) => (
                <li key={step}>{boldNumbers(step)}</li>
              ))}
            </ol>
          </>
        ) : null}
        {upsideVerdict ? (
          <p
            className={
              path.length > 0
                ? "pm2-verdict pm2-verdict--after"
                : "pm2-verdict"
            }
          >
            {upsideVerdict}
          </p>
        ) : null}
      </article>
    </div>
  );
}

export function PlayerMathLimits({ limits }: { limits: string[] }) {
  return (
    <div className="pm2-limits">
      <span className="pm2-eyebrow">Where upside is limited</span>
      <ul className="pm2-limits-list">
        {limits.map((line) => (
          <li key={line}>{boldNumbers(line)}</li>
        ))}
      </ul>
    </div>
  );
}

type Props = {
  content: PlayerMathPayload;
  outlook: PlayerMathOutlook;
};

/** Full story block without Contribute (page owns Summary|Contribute row). */
export function PlayerMathStory({ content, outlook }: Props) {
  return (
    <section className="pm2" aria-label="Projection writeup">
      <PlayerMathSummary summary={content.summary} />
      <PlayerMathCases content={content} outlook={outlook} />
      <PlayerMathLimits limits={content.limits} />
    </section>
  );
}
