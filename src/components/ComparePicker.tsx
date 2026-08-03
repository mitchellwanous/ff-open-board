"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Option = { id: string; name: string; position: string; team: string };

const MAX = 4;

export function ComparePicker({
  allPlayers,
  selectedIds,
  basePath = "/compare",
}: {
  allPlayers: Option[];
  selectedIds: string[];
  /** Compare route prefix, e.g. `/compare`. */
  basePath?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");

  const selected = useMemo(
    () =>
      selectedIds
        .map((id) => allPlayers.find((p) => p.id === id))
        .filter(Boolean) as Option[],
    [allPlayers, selectedIds],
  );

  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (needle.length < 1) return [];
    return allPlayers
      .filter(
        (p) =>
          !selectedIds.includes(p.id) &&
          (p.name.toLowerCase().includes(needle) ||
            p.team.toLowerCase().includes(needle) ||
            p.position.toLowerCase() === needle),
      )
      .slice(0, 8);
  }, [allPlayers, q, selectedIds]);

  function setIds(ids: string[]) {
    const qs = ids.length ? `?ids=${ids.map(encodeURIComponent).join(",")}` : "";
    router.push(`${basePath}${qs}`);
  }

  function add(id: string) {
    if (selectedIds.includes(id) || selectedIds.length >= MAX) return;
    setIds([...selectedIds, id]);
    setQ("");
  }

  function remove(id: string) {
    setIds(selectedIds.filter((x) => x !== id));
  }

  return (
    <div className="compare-picker">
      <div className="compare-chips">
        {selected.map((p) => (
          <button
            key={p.id}
            type="button"
            className="badge accent"
            onClick={() => remove(p.id)}
            title="Remove"
          >
            {p.name} ×
          </button>
        ))}
        {selected.length === 0 ? (
          <span className="muted" style={{ fontSize: "0.9rem" }}>
            No players yet — search below (max {MAX}).
          </span>
        ) : null}
      </div>
      {selectedIds.length < MAX ? (
        <div className="compare-search">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search player, team, or pos…"
            aria-label="Search players to compare"
          />
          {matches.length > 0 ? (
            <ul className="compare-suggest">
              {matches.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => add(p.id)}>
                    <strong>{p.name}</strong>
                    <span className="faint">
                      {" "}
                      {p.position} · {p.team}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <p className="muted" style={{ fontSize: "0.85rem" }}>
          Max {MAX} players. Remove one to add another.
        </p>
      )}
    </div>
  );
}
