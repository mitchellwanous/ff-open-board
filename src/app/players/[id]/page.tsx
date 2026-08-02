import Link from "next/link";
import { notFound } from "next/navigation";
import { ClaimableTable } from "@/components/ClaimableTable";
import { CommunityOutlook } from "@/components/CommunityOutlook";
import { getClaimableFields, getOfficialValue, getPlayer, getTeam } from "@/lib/data";
import { fmt, fmtInt } from "@/lib/format";

const SHARE_FIELDS = new Set([
  "target_share_dn",
  "target_share",
  "target_share_ceil",
  "rush_share_dn",
  "rush_share",
  "rush_share_ceil",
]);

export default async function PlayerCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = getPlayer(id);
  if (!p) notFound();
  const team = getTeam(p.team);

  const allClaimable = getClaimableFields();

  const claimable = allClaimable.filter((c) => {
    if (c.grain !== "player") return false;
    if (SHARE_FIELDS.has(c.field)) return false;
    if (c.positions && !c.positions.includes(p.position)) return false;
    return true;
  });
  const claimRows = claimable.map((field) => ({
    field,
    official: getOfficialValue("player", p.player_id, field.field),
  }));

  const fpVals = p.hist.map((h) => h.season_fp ?? 0);
  const maxFp = Math.max(...fpVals, 1);
  const piePeers =
    team?.tgt_segs.filter((s) => s.kind === "player").slice(0, 6) ?? [];
  const rushPeers =
    team?.rush_segs.filter((s) => s.kind === "player").slice(0, 5) ?? [];
  const showTgt = ["WR", "TE", "RB"].includes(p.position);
  const showRush = ["RB", "QB"].includes(p.position);

  return (
    <>
      <p className="faint" style={{ marginTop: "1.25rem" }}>
        <Link href="/players">Players</Link> / {p.name}
      </p>
      <h1>{p.name}</h1>
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
        <span className="badge accent">{p.position}</span>
        <span className="badge">
          <Link href={`/teams/${p.team}`}>{p.team}</Link> · depth{" "}
          {p.depth_rank}
        </span>
        {p.draft.pos_rank ? (
          <span className="badge">
            {p.position}
            {p.draft.pos_rank}
          </span>
        ) : null}
        <Link
          href={`/compare?ids=${encodeURIComponent(p.player_id)}`}
          className="badge"
        >
          Compare
        </Link>
      </div>

      <h2>Season outlook</h2>
      <p className="muted" style={{ fontSize: "0.9rem" }}>
        Fantasy points from team offense × his share × efficiency. Totals are
        locked — change inputs below if you disagree.
      </p>
      <div className="stat-grid">
        <div className="stat">
          <div className="label">Downside</div>
          <div className="value num warn">{fmt(p.draft.downside_fp, 1)}</div>
          {p.draft.pos_downside_rank != null ? (
            <div className="sub">
              {p.position}
              {p.draft.pos_downside_rank}
            </div>
          ) : null}
        </div>
        <div className="stat">
          <div className="label">Base</div>
          <div className="value num">{fmt(p.fp.season_fp, 1)}</div>
          {p.draft.pos_rank != null ? (
            <div className="sub">
              {p.position}
              {p.draft.pos_rank}
            </div>
          ) : null}
        </div>
        <div className="stat">
          <div className="label">Upside</div>
          <div className="value num accent">{fmt(p.draft.scenario_fp, 1)}</div>
          {p.draft.pos_upside_rank != null ? (
            <div className="sub">
              {p.position}
              {p.draft.pos_upside_rank}
            </div>
          ) : null}
        </div>
        <div className="stat">
          <div className="label">FP / G · games</div>
          <div className="value num" style={{ fontSize: "1rem" }}>
            {fmt(p.fp.fp_per_game, 2)} · {fmt(p.fp.games_played_proj, 1)}
          </div>
        </div>
      </div>
      {(p.draft.downside_blurb ||
        p.draft.base_blurb ||
        p.draft.upside_blurb) && (
        <div className="scenario-blurbs">
          {p.draft.downside_blurb ? (
            <p>
              <span className="scenario-blurbs__tag warn">Dn</span>
              {p.draft.downside_blurb}
            </p>
          ) : null}
          {p.draft.base_blurb ? (
            <p>
              <span className="scenario-blurbs__tag">Base</span>
              {p.draft.base_blurb}
            </p>
          ) : null}
          {p.draft.upside_blurb ? (
            <p>
              <span className="scenario-blurbs__tag accent">Upside</span>
              {p.draft.upside_blurb}
            </p>
          ) : null}
        </div>
      )}

      <h2>Share band</h2>
      <div className="stat-grid">
        {showTgt ? (
          <>
            <div className="stat">
              <div className="label">Low target share</div>
              <div className="value num">
                {fmt(p.usage.target_share_floor, 1)}%
              </div>
            </div>
            <div className="stat">
              <div className="label">Expected targets</div>
              <div className="value num accent">
                {fmt(p.usage.target_share, 1)}%
              </div>
            </div>
            <div className="stat">
              <div className="label">High target share</div>
              <div className="value num">
                {fmt(p.usage.target_share_ceil, 1)}%
              </div>
            </div>
          </>
        ) : null}
        {showRush ? (
          <>
            <div className="stat">
              <div className="label">Low rush share</div>
              <div className="value num">
                {fmt(p.usage.rush_share_floor, 1)}%
              </div>
            </div>
            <div className="stat">
              <div className="label">Expected rushes</div>
              <div className="value num accent">
                {fmt(p.usage.rush_share, 1)}%
              </div>
            </div>
            <div className="stat">
              <div className="label">High rush share</div>
              <div className="value num">
                {fmt(p.usage.rush_share_ceil, 1)}%
              </div>
            </div>
          </>
        ) : null}
        <div className="stat">
          <div className="label">Age / years in NFL</div>
          <div className="value num">
            {fmt(p.age, 1)} / {p.years_exp ?? "—"}
          </div>
        </div>
      </div>

      <div className="panel soft">
        <h3 style={{ marginTop: 0 }}>Team offense</h3>
        <div className="stat-grid">
          <div className="stat">
            <div className="label">Team points / game</div>
            <div className="value num">{fmt(p.team_pack.implied_ppg, 1)}</div>
          </div>
          <div className="stat">
            <div className="label">Plays / game</div>
            <div className="value num">{fmt(p.team_pack.plays_pg, 1)}</div>
          </div>
          <div className="stat">
            <div className="label">Pass rate</div>
            <div className="value num">{fmt(p.team_pack.pass_rate, 0)}%</div>
          </div>
          <div className="stat">
            <div className="label">Team targets</div>
            <div className="value num">{fmtInt(p.team_pack.team_targets)}</div>
          </div>
        </div>
        <p className="faint" style={{ marginBottom: 0, fontSize: "0.85rem" }}>
          <Link href={`/teams/${p.team}`}>Full {p.team} card</Link>
          {p.team_pack.coach_change_kind
            ? ` · coaching: ${p.team_pack.coach_change_kind}`
            : ""}
        </p>
      </div>

      <h2>Recent history</h2>
      <div className="spark" aria-hidden>
        {p.hist.map((h) => (
          <span
            key={`${h.season}-${h.kind}`}
            className={h.kind === "proj" ? "proj" : "actual"}
            style={{
              height: `${Math.max(8, ((h.season_fp ?? 0) / maxFp) * 100)}%`,
            }}
            title={`${h.season}: ${h.season_fp}`}
          />
        ))}
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Season</th>
              <th>Tm</th>
              <th className="right">GP</th>
              <th className="right">Tgt</th>
              <th className="right">Rec</th>
              <th className="right">Yds</th>
              <th className="right">Tgt%</th>
              <th className="right">Rush%</th>
              <th className="right">FP</th>
            </tr>
          </thead>
          <tbody>
            {p.hist.map((h) => (
              <tr
                key={`${h.season}-${h.kind}`}
                className={h.kind === "proj" ? "proj" : undefined}
              >
                <td>
                  {h.season}
                  {h.kind === "proj" ? (
                    <span className="badge proj" style={{ marginLeft: 6 }}>
                      proj
                    </span>
                  ) : null}
                </td>
                <td>{h.team ?? "—"}</td>
                <td className="right num">{fmt(h.games, 1)}</td>
                <td className="right num">{fmtInt(h.targets)}</td>
                <td className="right num">{fmtInt(h.receptions)}</td>
                <td className="right num">{fmtInt(h.rec_yards)}</td>
                <td className="right num">{fmt(h.target_share, 1)}%</td>
                <td className="right num">{fmt(h.rush_share, 1)}%</td>
                <td className="right num">{fmt(h.season_fp, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {p.win_weeks_hist ? (
        <p className="muted" style={{ fontSize: "0.9rem" }}>
          {`Hist win weeks: ${fmtInt(p.win_weeks_hist.win_weeks)}/${fmtInt(p.win_weeks_hist.win_week_games)} (${fmt(p.win_weeks_hist.win_week_rate, 1)}%) · max weekly ${fmt(p.win_weeks_hist.max_weekly_fp, 1)}`}
        </p>
      ) : null}

      <details className="details-block">
        <summary>Volume &amp; counting stats</summary>
        <div className="stat-grid" style={{ marginTop: "0.75rem" }}>
          {p.position === "QB" ? (
            <>
              <div className="stat">
                <div className="label">Pass attempts</div>
                <div className="value num">{fmtInt(p.volume.pass_attempts)}</div>
              </div>
              <div className="stat">
                <div className="label">Pass yards</div>
                <div className="value num">{fmtInt(p.volume.pass_yards)}</div>
              </div>
              <div className="stat">
                <div className="label">Pass TDs</div>
                <div className="value num">{fmt(p.volume.pass_tds, 1)}</div>
              </div>
              <div className="stat">
                <div className="label">INTs</div>
                <div className="value num">{fmt(p.volume.interceptions, 1)}</div>
              </div>
              <div className="stat">
                <div className="label">Rush attempts</div>
                <div className="value num">{fmtInt(p.volume.rush_att)}</div>
              </div>
              <div className="stat">
                <div className="label">Rush yards</div>
                <div className="value num">{fmtInt(p.volume.rush_yards)}</div>
              </div>
              <div className="stat">
                <div className="label">Rush TDs</div>
                <div className="value num">{fmt(p.volume.rush_tds, 1)}</div>
              </div>
            </>
          ) : null}
          {["WR", "TE"].includes(p.position) ? (
            <>
              <div className="stat">
                <div className="label">Targets</div>
                <div className="value num">{fmtInt(p.volume.targets)}</div>
              </div>
              <div className="stat">
                <div className="label">Receptions</div>
                <div className="value num">{fmtInt(p.volume.receptions)}</div>
              </div>
              <div className="stat">
                <div className="label">Receiving yards</div>
                <div className="value num">{fmtInt(p.volume.rec_yards)}</div>
              </div>
              <div className="stat">
                <div className="label">Rec TDs</div>
                <div className="value num">{fmt(p.volume.rec_tds, 1)}</div>
              </div>
            </>
          ) : null}
          {p.position === "RB" ? (
            <>
              <div className="stat">
                <div className="label">Rush attempts</div>
                <div className="value num">{fmtInt(p.volume.rush_att)}</div>
              </div>
              <div className="stat">
                <div className="label">Rush yards</div>
                <div className="value num">{fmtInt(p.volume.rush_yards)}</div>
              </div>
              <div className="stat">
                <div className="label">Rush TDs</div>
                <div className="value num">{fmt(p.volume.rush_tds, 1)}</div>
              </div>
              <div className="stat">
                <div className="label">Targets</div>
                <div className="value num">{fmtInt(p.volume.targets)}</div>
              </div>
              <div className="stat">
                <div className="label">Receptions</div>
                <div className="value num">{fmtInt(p.volume.receptions)}</div>
              </div>
              <div className="stat">
                <div className="label">Receiving yards</div>
                <div className="value num">{fmtInt(p.volume.rec_yards)}</div>
              </div>
              <div className="stat">
                <div className="label">Rec TDs</div>
                <div className="value num">{fmt(p.volume.rec_tds, 1)}</div>
              </div>
            </>
          ) : null}
        </div>
        <p className="faint" style={{ fontSize: "0.85rem" }}>
          Last year: {fmt(p.fp.ly_fp, 1)} FP · Mechanical floor–ceil{" "}
          {fmt(p.fp.floor_fp, 0)}–{fmt(p.fp.ceiling_fp, 0)} (rate×GP haircut,
          not the judgment band).
          {p.draft.no_pos1 ? ` · note: ${p.draft.no_pos1}` : ""}
        </p>
      </details>

      {piePeers.length > 0 && showTgt ? (
        <details className="details-block">
          <summary>{p.team} target pie (teammates)</summary>
          <div className="table-wrap" style={{ marginTop: "0.75rem" }}>
            <table className="data tight">
              <thead>
                <tr>
                  <th>Player</th>
                  <th className="right">Low</th>
                  <th className="right">Expected</th>
                  <th className="right">High</th>
                </tr>
              </thead>
              <tbody>
                {piePeers.map((s) => (
                  <tr
                    key={s.player_id ?? s.name}
                    className={
                      s.player_id === p.player_id ? "proj" : undefined
                    }
                  >
                    <td>
                      {s.player_id === p.player_id ? (
                        <strong>{s.name}</strong>
                      ) : s.player_id ? (
                        <Link href={`/players/${s.player_id}`}>{s.name}</Link>
                      ) : (
                        s.name
                      )}
                      <span className="faint"> · {s.position}</span>
                    </td>
                    <td className="right num">{fmt(s.share_dn, 1)}%</td>
                    <td className="right num">{fmt(s.share, 1)}%</td>
                    <td className="right num">{fmt(s.share_ceil, 1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}
      {rushPeers.length > 0 && showRush ? (
        <details className="details-block">
          <summary>{p.team} rush pie (teammates)</summary>
          <div className="table-wrap" style={{ marginTop: "0.75rem" }}>
            <table className="data tight">
              <thead>
                <tr>
                  <th>Player</th>
                  <th className="right">Low</th>
                  <th className="right">Expected</th>
                  <th className="right">High</th>
                </tr>
              </thead>
              <tbody>
                {rushPeers.map((s) => (
                  <tr
                    key={s.player_id ?? s.name}
                    className={
                      s.player_id === p.player_id ? "proj" : undefined
                    }
                  >
                    <td>
                      {s.player_id === p.player_id ? (
                        <strong>{s.name}</strong>
                      ) : s.player_id ? (
                        <Link href={`/players/${s.player_id}`}>{s.name}</Link>
                      ) : (
                        s.name
                      )}
                      <span className="faint"> · {s.position}</span>
                    </td>
                    <td className="right num">{fmt(s.share_dn, 1)}%</td>
                    <td className="right num">{fmt(s.share, 1)}%</td>
                    <td className="right num">{fmt(s.share_ceil, 1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}

      <h2>Disagree?</h2>
      <p className="muted" style={{ fontSize: "0.9rem" }}>
        Challenge inputs — not locked fantasy-point totals. Accepted edits and
        outlook notes update the board on daily republish.
      </p>

      <CommunityOutlook
        grain="player"
        subjectId={p.player_id}
        subjectLabel={p.name}
        communityNote={p.community_note}
      />

      <h3 style={{ fontSize: "0.95rem", margin: "1.25rem 0 0.5rem" }}>
        Adjust his share (team pie)
      </h3>
      <p style={{ marginBottom: "0.75rem" }}>
        <Link href={`/teams/${p.team}#share-pies`} className="btn primary">
          Edit shares on {p.team} pie
        </Link>
      </p>
      <p className="muted" style={{ fontSize: "0.85rem" }}>
        Low / expected / high are proposed next to teammates so the pie can sum
        near 100%.
      </p>

      <h3 style={{ fontSize: "0.95rem", margin: "1.25rem 0 0.5rem" }}>
        Efficiency &amp; TD rates
      </h3>
      <ClaimableTable
        grain="player"
        subjectId={p.player_id}
        subjectLabel={p.name}
        rows={claimRows}
      />
    </>
  );
}
