# The FF Collective

**Crowdsourced fantasy football projections. The collective is stronger than one.**

Live: [https://theffcollective.vercel.app/](https://theffcollective.vercel.app/)

Half-PPR projections built in public: **team offense + player share + player efficiency = fantasy points**. Anyone can **contribute** a better input with a short reason; we review and republish so the collective model improves.

Brand / UI copy source of truth: [`src/lib/brand.ts`](src/lib/brand.ts). Agent doctrine: [`.cursor/rules/ff-collective-brand.mdc`](.cursor/rules/ff-collective-brand.mdc).

Data is a **frozen export** from the Fantasy Football lab (`scripts/export_open_board_payload.py`) that **seeds** the board. Live consensus on claimable inputs (min 3 agreeing votes, weighted median) becomes **Expected immediately**. When a base share unlocks, the team pie **hybrid-renorms to 100%** (same-position unlocked → Other/depth → other positions), then half-PPR FP and ranks recompute from identity. Lab review pins overrides into the next freeze — spam/audit + outlook, not the gate for live Expected.

Visitors contribute number inputs and outlook notes; rejected edits are excluded from consensus.


## Run locally

```bash
npm install
cp .env.example .env.local   # optional — without Supabase env, edits use .data/edits.json
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Refresh data from the lab

```bash
"/Users/mitchellwanous/Fantasy Football/.venv/bin/python" \
  "/Users/mitchellwanous/Fantasy Football/scripts/export_open_board_payload.py" \
  --out /Users/mitchellwanous/ff-open-board/public/data
```

For a production-labeled freeze:

```bash
OPEN_BOARD_EDIT_BACKEND=supabase \
  "/Users/mitchellwanous/Fantasy Football/.venv/bin/python" \
  "/Users/mitchellwanous/Fantasy Football/scripts/export_open_board_payload.py" \
  --out /Users/mitchellwanous/ff-open-board/public/data
```

## Supabase (open-source edits)

1. Create a Supabase project.
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor (creates `open_source_edits`).
3. Set in `.env.local` / Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (server only — never expose to the browser)
   - Optional: `REVIEW_API_SECRET` for `/api/edits/review`
4. With those set, `/api/edits` reads/writes Supabase. Without them, it uses `.data/edits.json`.

## Vercel deploy

1. Import the `ff-open-board` repo in Vercel.
2. Set the Supabase env vars above (+ `REVIEW_API_SECRET` recommended).
3. Deploy. Confirm `POST /api/edits` works from a player card Contribute flow.
4. After each lab republish, push updated `public/data/*` (or trigger a deploy).

Production domain: [https://theffcollective.vercel.app/](https://theffcollective.vercel.app/)

## Daily review loop (no admin UI)

In the Fantasy Football lab:

```bash
# 1. Pull pending edits (grouped + CSV)
.venv/bin/python scripts/pull_open_board_pending.py

# 2. Review output/2026/open_board_review/YYYY-MM-DD/
#    Two lanes:
#      projection  — team/player Contribute + card “Add outlook”
#                    → pins / community_notes, then mark reviewed
#      app_product — homepage “Site feedback” (grain=app)
#                    → product/UX backlog only; see pending_app_feedback.json
#                    → do NOT distill into community_notes or change pins
#                    → mark reviewed after triage

# 3. Apply accepted pins in data/context/2026/* and upside_scenarios.csv
#    (projection lane only)

# 4. Distill published community outlook (why) for touched team/player subjects
.venv/bin/python scripts/upsert_community_note.py \
  --grain player --subject-id 00-0037261 \
  --note "Plain-language season expectation and why the board numbers look like this."

# 4b. Refresh condensed Player math (Summary / Base / Upside / Limits) when
#     freeze numbers moved — source of truth:
#     data/context/2026/player_math_condensed.json
#     Upsert one polished writeup:
#       .venv/bin/python scripts/upsert_player_math.py --player-id … --from-file … --status reviewed
#     Or regenerate scaffolds for missing/draft rows:
#       .venv/bin/python scripts/generate_player_math_drafts.py --overwrite-drafts

# 5. Mark inbox rows reviewed
.venv/bin/python scripts/mark_open_board_reviewed.py \
  --grain player --subject-id 00-0037261 --status reviewed
# App/product feedback:
.venv/bin/python scripts/mark_open_board_reviewed.py \
  --grain app --subject-id open_board --status reviewed \
  --note "Triaged as product backlog"

# 6. Re-export freeze → Open Board public/data
OPEN_BOARD_EDIT_BACKEND=supabase .venv/bin/python scripts/export_open_board_payload.py \
  --out /Users/mitchellwanous/ff-open-board/public/data

# 7. Deploy Open Board (git push or vercel --prod)
```

**Site feedback schema:** if Supabase still rejects `grain=app`, run
`supabase/migrate_app_grain.sql` once in the SQL editor (allows `team|player|app`).

**Community outlook** on each card is the published `community_note` from the freeze (season expectation / why) — not a live pending-edit changelog. **Add feedback** and **Propose** feed the projection inbox. Homepage **Site feedback** is a separate `app` lane for product/UX notes.

## Tests

```bash
# with dev server already on :3000
PLAYWRIGHT_SKIP_WEBSERVER=1 npm test

# or let Playwright start the server
npm test
```

Matrix: `tests/fixtures.ts` · Spec: `tests/user-functionality.spec.ts`
