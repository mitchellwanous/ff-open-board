import Link from "next/link";
import { ComparePicker } from "@/components/ComparePicker";
import { getPlayer, getPlayers } from "@/lib/data";
import { fmt, fmtInt } from "@/lib/format";
import type { Player } from "@/lib/types";

const SHORTCUTS = [
  {
    label: "Achane vs Saquon vs Jeanty",
    ids: ["00-0039040", "00-0034844", "00-0040122"],
  },
  {
    label: "Ladd vs Quentin Johnston",
    ids: ["00-0039915", "00-0038544"],
  },
];

function parseIds(raw: string | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const id = part.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= 4) break;
  }
  return out;
}

function Cell({ children }: { children: React.ReactNode }) {
  return <td className="right num">{children}</td>;
}

function MetricRow({
  label,
  players,
  render,
}: {
  label: string;
  players: Player[];
  render: (p: Player) => React.ReactNode;
}) {
  return (
    <tr>
      <th scope="row">{label}</th>
      {players.map((p) => (
        <Cell key={p.player_id}>{render(p)}</Cell>
      ))}
    </tr>
  );
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const sp = await searchParams;
  const ids = parseIds(sp.ids);
  const players = ids
    .map((id) => getPlayer(id))
    .filter((p): p is Player => Boolean(p));

  const allPlayers = getPlayers().map((p) => ({
    id: p.player_id,
    name: p.name,
    position: p.position,
    team: p.team,
  }));

  const shortcuts = SHORTCUTS;

  return (
    <>
      <h1>Compare players</h1>
      <p className="lede">
        Side-by-side season outlook for draft and start/sit. Pick 2–4 players.
        Link stays shareable in the URL.
      </p>

      <ComparePicker
        allPlayers={allPlayers}
        selectedIds={players.map((p) => p.player_id)}
      />

      <p className="muted" style={{ fontSize: "0.9rem", marginTop: "0.75rem" }}>
        Shortcuts:{" "}
        {shortcuts.map((s, i) => (
          <span key={s.label}>
            {i > 0 ? " · " : null}
            <Link href={`/compare?ids=${s.ids.join(",")}`}>{s.label}</Link>
          </span>
        ))}
      </p>

      {players.length < 2 ? (
        <div className="callout" style={{ marginTop: "1.25rem" }}>
          Add at least two players to see the comparison table.
        </div>
      ) : (
        <div className="table-wrap compare-table-wrap" style={{ marginTop: "1.25rem" }}>
          <table className="data compare-table">
            <thead>
              <tr>
                <th>Metric</th>
                {players.map((p) => (
                  <th key={p.player_id} className="right">
                    <Link href={`/players/${p.player_id}`}>
                      <strong>{p.name}</strong>
                    </Link>
                    <div className="faint" style={{ fontWeight: 400 }}>
                      {p.position} · {p.team}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <MetricRow
                label="Pos rank (base)"
                players={players}
                render={(p) =>
                  p.draft.pos_rank != null
                    ? `${p.position}${p.draft.pos_rank}`
                    : "—"
                }
              />
              <MetricRow
                label="Downside FP"
                players={players}
                render={(p) => (
                  <>
                    {fmt(p.draft.downside_fp, 1)}
                    {p.draft.pos_downside_rank != null ? (
                      <div className="faint">
                        {p.position}
                        {p.draft.pos_downside_rank}
                      </div>
                    ) : null}
                  </>
                )}
              />
              <MetricRow
                label="Base FP"
                players={players}
                render={(p) => fmt(p.fp.season_fp, 1)}
              />
              <MetricRow
                label="Upside FP"
                players={players}
                render={(p) => (
                  <>
                    {fmt(p.draft.scenario_fp, 1)}
                    {p.draft.pos_upside_rank != null ? (
                      <div className="faint">
                        {p.position}
                        {p.draft.pos_upside_rank}
                      </div>
                    ) : null}
                  </>
                )}
              />
              <MetricRow
                label="Team PPG"
                players={players}
                render={(p) => fmt(p.team_pack.implied_ppg, 1)}
              />
              <MetricRow
                label="Rush share (low–exp–high)"
                players={players}
                render={(p) =>
                  p.usage.rush_share != null && p.usage.rush_share > 0
                    ? `${fmt(p.usage.rush_share_floor, 0)}–${fmt(p.usage.rush_share, 0)}–${fmt(p.usage.rush_share_ceil, 0)}%`
                    : "—"
                }
              />
              <MetricRow
                label="Target share (low–exp–high)"
                players={players}
                render={(p) =>
                  p.usage.target_share != null && p.usage.target_share > 0
                    ? `${fmt(p.usage.target_share_floor, 0)}–${fmt(p.usage.target_share, 0)}–${fmt(p.usage.target_share_ceil, 0)}%`
                    : "—"
                }
              />
              <MetricRow
                label="Rush attempts"
                players={players}
                render={(p) => fmtInt(p.volume.rush_att)}
              />
              <MetricRow
                label="Targets"
                players={players}
                render={(p) => fmtInt(p.volume.targets)}
              />
              <MetricRow
                label="Receptions"
                players={players}
                render={(p) => fmtInt(p.volume.receptions)}
              />
              <MetricRow
                label="YPC"
                players={players}
                render={(p) => fmt(p.rates.ypc, 2)}
              />
              <MetricRow
                label="YPT"
                players={players}
                render={(p) => fmt(p.rates.ypt, 2)}
              />
              <MetricRow
                label="Rush TD rate"
                players={players}
                render={(p) =>
                  p.rates.rush_td_rate != null
                    ? `${fmt(p.rates.rush_td_rate, 1)}%`
                    : "—"
                }
              />
              <MetricRow
                label="Rec TD rate"
                players={players}
                render={(p) =>
                  p.rates.rec_td_rate != null
                    ? `${fmt(p.rates.rec_td_rate, 1)}%`
                    : "—"
                }
              />
              <tr>
                <th scope="row">Outlook notes</th>
                {players.map((p) => (
                  <td key={p.player_id} style={{ fontSize: "0.8rem" }}>
                    <div className="faint">
                      {p.draft.downside_blurb
                        ? `Dn: ${p.draft.downside_blurb}`
                        : null}
                    </div>
                    <div className="faint" style={{ marginTop: 4 }}>
                      {p.draft.upside_blurb
                        ? `Up: ${p.draft.upside_blurb}`
                        : null}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
