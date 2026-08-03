import Link from "next/link";
import { ComparePicker } from "@/components/ComparePicker";
import { BRAND_CONTRIBUTE_CALLOUT } from "@/lib/brand";
import { ScenarioFpCell } from "@/components/ScenarioFpCell";
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

function MetricRow({
  label,
  players,
  render,
  numeric = true,
}: {
  label: string;
  players: Player[];
  render: (p: Player) => React.ReactNode;
  numeric?: boolean;
}) {
  return (
    <tr>
      <th scope="row">{label}</th>
      {players.map((p) => (
        <td key={p.player_id} className={numeric ? "right num" : "right"}>
          {render(p)}
        </td>
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

  return (
    <>
      <h1>Compare</h1>
      <p className="lede">
        Side-by-side downside / expected / upside for draft and start/sit. Max 4
        players. Share the link once you&apos;ve picked players.
      </p>
      <div className="callout">{BRAND_CONTRIBUTE_CALLOUT}</div>

      <ComparePicker
        allPlayers={allPlayers}
        selectedIds={players.map((p) => p.player_id)}
        basePath="/compare"
      />

      <p className="muted" style={{ fontSize: "0.9rem", marginTop: "0.75rem" }}>
        Shortcuts:{" "}
        {SHORTCUTS.map((s, i) => (
          <span key={s.label}>
            {i > 0 ? " · " : null}
            <Link href={`/compare?ids=${s.ids.join(",")}`}>
              {s.label}
            </Link>
          </span>
        ))}
      </p>

      {players.length < 2 ? (
        <div className="callout" style={{ marginTop: "1.25rem" }}>
          Add at least two players to compare.
        </div>
      ) : (
        <div
          className="table-wrap compare-table-wrap"
          style={{ marginTop: "1.25rem" }}
        >
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
                    <div style={{ marginTop: "0.35rem" }}>
                      <Link
                        href={`/players/${p.player_id}#suggest`}
                        className="faint"
                        style={{ fontSize: "0.8rem", fontWeight: 400 }}
                      >
                        Contribute
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <MetricRow
                label="Downside FP"
                players={players}
                numeric={false}
                render={(p) => (
                  <ScenarioFpCell
                    kind="downside"
                    position={p.position}
                    fp={p.draft.downside_fp}
                    rank={p.draft.pos_downside_rank}
                  />
                )}
              />
              <MetricRow
                label="Expected FP"
                players={players}
                numeric={false}
                render={(p) => (
                  <ScenarioFpCell
                    kind="expected"
                    position={p.position}
                    fp={p.fp.season_fp}
                    rank={p.draft.pos_rank}
                  />
                )}
              />
              <MetricRow
                label="Upside FP"
                players={players}
                numeric={false}
                render={(p) => (
                  <ScenarioFpCell
                    kind="upside"
                    position={p.position}
                    fp={p.draft.scenario_fp}
                    rank={p.draft.pos_upside_rank}
                  />
                )}
              />
              <MetricRow
                label="Team PPG"
                players={players}
                render={(p) => fmt(p.team_pack.implied_ppg, 1)}
              />
              <MetricRow
                label="Rush % (downside–expected–upside)"
                players={players}
                render={(p) =>
                  (p.usage.rush_share ?? 0) > 0
                    ? `${fmt(p.usage.rush_share_floor, 0)}–${fmt(p.usage.rush_share, 0)}–${fmt(p.usage.rush_share_ceil, 0)}%`
                    : "—"
                }
              />
              <MetricRow
                label="Target % (downside–expected–upside)"
                players={players}
                render={(p) =>
                  (p.usage.target_share ?? 0) > 0
                    ? `${fmt(p.usage.target_share_floor, 0)}–${fmt(p.usage.target_share, 0)}–${fmt(p.usage.target_share_ceil, 0)}%`
                    : "—"
                }
              />
              <MetricRow
                label="Rush att"
                players={players}
                render={(p) => fmtInt(p.volume.rush_att)}
              />
              <MetricRow
                label="Targets"
                players={players}
                render={(p) => fmtInt(p.volume.targets)}
              />
              <MetricRow
                label="Yards / carry"
                players={players}
                render={(p) => fmt(p.rates.ypc, 2)}
              />
              <MetricRow
                label="Yards / target"
                players={players}
                render={(p) => fmt(p.rates.ypt, 2)}
              />
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
