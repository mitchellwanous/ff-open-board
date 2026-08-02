# Open Board

Public board for **team cards**, **player cards**, **stat rankings**, and **open-source edits** on claimable model inputs.

Data is a **frozen export** from the Fantasy Football lab (`scripts/export_open_board_payload.py`). The projection engine is not re-run in this app. Visitors Propose number edits and Add feedback; you review daily in the lab, update pins + distilled community outlook notes, then republish.

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
3. Deploy. Confirm `POST /api/edits` works from a player card Propose.
4. After each lab republish, push updated `public/data/*` (or trigger a deploy).

## Daily review loop (no admin UI)

In the Fantasy Football lab:

```bash
# 1. Pull pending edits (grouped + CSV)
.venv/bin/python scripts/pull_open_board_pending.py

# 2. Review output/2026/open_board_review/YYYY-MM-DD/
#    Focus on rationale / general_feedback (= the “why”)

# 3. Apply accepted pins in data/context/2026/* and upside_scenarios.csv

# 4. Distill published community outlook (why) for touched subjects
.venv/bin/python scripts/upsert_community_note.py \
  --grain player --subject-id 00-0037261 \
  --note "Plain-language season expectation and why the board numbers look like this."

# 5. Mark inbox rows reviewed
.venv/bin/python scripts/mark_open_board_reviewed.py \
  --grain player --subject-id 00-0037261 --status reviewed

# 6. Re-export freeze → Open Board public/data
OPEN_BOARD_EDIT_BACKEND=supabase .venv/bin/python scripts/export_open_board_payload.py \
  --out /Users/mitchellwanous/ff-open-board/public/data

# 7. Deploy Open Board (git push or vercel --prod)
```

**Community outlook** on each card is the published `community_note` from the freeze (season expectation / why) — not a live pending-edit changelog. **Add feedback** and **Propose** feed the next day’s inbox.

## Tests

```bash
# with dev server already on :3000
PLAYWRIGHT_SKIP_WEBSERVER=1 npm test

# or let Playwright start the server
npm test
```

Matrix: `tests/fixtures.ts` · Spec: `tests/user-functionality.spec.ts`
