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

  // Shares are proposed on the team pie; player card claimables = rates / TD inputs.
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

  return (
    <>
      <p className="faint" style={{ marginTop: "1.25rem" }}>
        <Link href="/players">Players</Link> / {p.name}
      </p>
      <h1>{p.name}</h1>
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
        <span className="badge accent">{p.position}</span>
        <span className="badge">
          <Link href={`/teams/${p.team}`}>{p.team}</Link> · DR{p.depth_rank}
        </span>
        {p.draft.pos_rank ? (
          <span className="badge">Pos FP #{p.draft.pos_rank}</span>
        ) : null}
      </div>

      <CommunityOutlook
        grain="player"
        subjectId={p.player_id}
        subjectLabel={p.name}
        communityNote={p.community_note}
      />

      <h2>0 · Recent history</h2>
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

      <div className="panel soft">
        <h3 style={{ marginTop: 0 }}>Team context</h3>
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
          {`Coach change: ${p.team_pack.coach_change_kind ?? "—"} · upside vol ×${fmt(p.team_pack.vol_up, 3)} · upside eff ×${fmt(p.team_pack.eff_up, 3)} · `}
          <Link href={`/teams/${p.team}`}>Full {p.team} card</Link>
        </p>
      </div>

      <h2>1 · Share band (edit on team pie)</h2>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          flexWrap: "wrap",
          marginBottom: "0.75rem",
        }}
      >
        <Link href={`/teams/${p.team}#share-pies`} className="btn primary">
          Adjust shares on {p.team} pie
        </Link>
        <span className="muted" style={{ fontSize: "0.9rem" }}>
          Dn / base / ceil are proposed next to teammates so the pie can sum ≈
          100%.
        </span>
      </div>
      <div className="stat-grid">
        {["WR", "TE", "RB"].includes(p.position) ? (
          <>
            <div className="stat">
              <div className="label">Target downside</div>
              <div className="value num">{fmt(p.usage.target_share_floor, 1)}%</div>
            </div>
            <div className="stat">
              <div className="label">Target base</div>
              <div className="value num accent">
                {fmt(p.usage.target_share, 1)}%
              </div>
            </div>
            <div className="stat">
              <div className="label">Target ceiling</div>
              <div className="value num">
                {fmt(p.usage.target_share_ceil, 1)}%
              </div>
            </div>
          </>
        ) : null}
        {["RB", "QB"].includes(p.position) ? (
          <>
            <div className="stat">
              <div className="label">Rush downside</div>
              <div className="value num">{fmt(p.usage.rush_share_floor, 1)}%</div>
            </div>
            <div className="stat">
              <div className="label">Rush base</div>
              <div className="value num accent">
                {fmt(p.usage.rush_share, 1)}%
              </div>
            </div>
            <div className="stat">
              <div className="label">Rush ceiling</div>
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
      <p className="muted" style={{ fontSize: "0.9rem" }}>
        Context vs teammates below. Edit via the button above.
      </p>
      {piePeers.length > 0 && ["WR", "TE", "RB"].includes(p.position) ? (
        <div className="table-wrap">
          <table className="data tight">
            <thead>
              <tr>
                <th>{p.team} target pie</th>
                <th className="right">Dn</th>
                <th className="right">Base</th>
                <th className="right">Ceil</th>
              </tr>
            </thead>
            <tbody>
              {piePeers.map((s) => (
                <tr
                  key={s.player_id ?? s.name}
                  className={s.player_id === p.player_id ? "proj" : undefined}
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
      ) : null}
      {rushPeers.length > 0 && ["RB", "QB"].includes(p.position) ? (
        <div className="table-wrap">
          <table className="data tight">
            <thead>
              <tr>
                <th>{p.team} rush pie</th>
                <th className="right">Dn</th>
                <th className="right">Base</th>
                <th className="right">Ceil</th>
              </tr>
            </thead>
            <tbody>
              {rushPeers.map((s) => (
                <tr
                  key={s.player_id ?? s.name}
                  className={s.player_id === p.player_id ? "proj" : undefined}
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
      ) : null}

      <h2>2 · Efficiency & TD rates (propose)</h2>
      <ClaimableTable
        grain="player"
        subjectId={p.player_id}
        subjectLabel={p.name}
        rows={claimRows}
      />

      <h2>3 · Roll-up: volume → season FP</h2>
      <p className="muted" style={{ fontSize: "0.9rem" }}>
        Counting stats from shares × team pack × the rates above. Season FP is
        the end of the tree.
      </p>

      <h3 style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>Volume</h3>
      <div className="stat-grid">
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

      <h3 style={{ fontSize: "0.95rem", margin: "1.25rem 0 0.5rem" }}>
        Season fantasy points
      </h3>
      <div className="stat-grid">
        <div className="stat">
          <div className="label">Downside</div>
          <div className="value num warn">{fmt(p.draft.downside_fp, 1)}</div>
        </div>
        <div className="stat">
          <div className="label">Base</div>
          <div className="value num">{fmt(p.fp.season_fp, 1)}</div>
        </div>
        <div className="stat">
          <div className="label">Upside</div>
          <div className="value num accent">{fmt(p.draft.scenario_fp, 1)}</div>
        </div>
        <div className="stat">
          <div className="label">FP / G · games</div>
          <div className="value num" style={{ fontSize: "1rem" }}>
            {fmt(p.fp.fp_per_game, 2)} · {fmt(p.fp.games_played_proj, 1)}
          </div>
        </div>
      </div>
      <p className="faint" style={{ fontSize: "0.85rem" }}>
        Last year: {fmt(p.fp.ly_fp, 1)} FP · Mechanical floor–ceil{" "}
        {fmt(p.fp.floor_fp, 0)}–{fmt(p.fp.ceiling_fp, 0)} (rate×GP haircut, not
        the judgment band). Propose on rates / team pie — not these
        locked FP totals.
        {p.draft.no_pos1 ? ` · note: ${p.draft.no_pos1}` : ""}
      </p>
    </>
  );
}
