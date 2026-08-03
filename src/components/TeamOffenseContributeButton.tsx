"use client";

import { useState } from "react";
import {
  TeamOffenseContributeSheet,
  type BucketRow,
  type OffenseBoard,
} from "@/components/EditProjectionBuckets";

/** Opens the team-offense hist sheet (same sheet as player-card offense bucket). */
export function TeamOffenseContributeButton({
  team,
  rows,
  board,
}: {
  team: string;
  rows: BucketRow[];
  board: OffenseBoard;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="btn primary"
        onClick={() => setOpen(true)}
      >
        Contribute to team offense
      </button>
      {open ? (
        <TeamOffenseContributeSheet
          team={team}
          rows={rows}
          board={board}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
