import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import { FIXTURES as F } from "./fixtures";

const EDIT_STORE = path.join(process.cwd(), ".data", "edits.json");

function resetEditStore() {
  const dir = path.dirname(EDIT_STORE);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(EDIT_STORE, "[]", "utf8");
}

async function postEdit(
  request: APIRequestContext,
  body: Record<string, unknown>,
) {
  return request.post("/api/edits", { data: body });
}

test.beforeAll(() => {
  resetEditStore();
});

test.describe("1 · Home", () => {
  test("loads freeze meta, nav, and primary CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "The FF Collective" })).toBeVisible();
    await expect(
      page.getByText(/Crowdsourced fantasy football projections/i).first(),
    ).toBeVisible();
    await expect(page.getByText(/last update 2026-08-02/i)).toBeVisible();
    await expect(page.getByText(/313 players/)).toBeVisible();
    await expect(page.getByText(/half PPR/i).first()).toBeVisible();
    await expect(
      page.getByText(/team offense \+ player share \+ player efficiency/i),
    ).toBeVisible();

    for (const label of ["Players", "Compare", "Teams", "Explore", "Help"]) {
      await expect(page.getByRole("link", { name: label }).first()).toBeVisible();
    }

    await expect(page.getByRole("link", { name: "Contribute an input" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Browse players" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Compare players" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Browse teams" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Check Achane and contribute" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Site feedback" })).toBeVisible();
  });

  test("site feedback submits app-product note", async ({ page, request }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Site feedback" }).click();
    await page.getByLabel("Your note").fill(
      "The help guide is useful but the homepage should explain Site feedback vs card Add feedback more clearly.",
    );
    await page.getByLabel("Name / handle").fill("test-user");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Submit feedback" }).click();
    await expect(page.getByText("Feedback submitted.")).toBeVisible();

    const res = await request.get(
      "/api/edits?grain=app&subject_id=open_board&field=app_feedback&status=pending",
    );
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(
      body.edits.some((e: { field: string }) => e.field === "app_feedback"),
    ).toBe(true);
  });

  test("start-here links reach primary surfaces", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Browse teams" }).click();
    await expect(page).toHaveURL(/\/teams$/);
    await page.goto("/");
    await page.getByRole("link", { name: "Browse players" }).click();
    await expect(page).toHaveURL(/\/players/);
    await page.goto("/");
    await page.getByRole("link", { name: "Explore" }).first().click();
    await expect(page).toHaveURL(/\/explore$/);
    await page.goto("/");
    await page.getByRole("link", { name: "How contributing works" }).first().click();
    await expect(page).toHaveURL(/\/help$/);
    await expect(page.getByRole("heading", { name: "Help" })).toBeVisible();
  });
});

test.describe("2 · Teams index", () => {
  test("lists teams by PPG rank and opens a card", async ({ page }) => {
    await page.goto("/teams");
    await expect(page.getByRole("heading", { name: "Teams" })).toBeVisible();
    const firstRank = page.locator("table.data tbody tr").first().locator("td").first();
    await expect(firstRank).toHaveText("1");
    await page.getByRole("link", { name: F.team, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/teams/${F.team}`));
    await expect(page.getByRole("heading", { name: F.team })).toBeVisible();
  });
});

test.describe("3 · Team card", () => {
  test("shows offense, pies, claimables, roster", async ({ page }) => {
    await page.goto(`/teams/${F.team}`);
    await expect(page.getByRole("heading", { name: F.team })).toBeVisible();
    await expect(page.getByText(/PPG/).first()).toBeVisible();

    await expect(page.getByRole("heading", { name: "Team offense", exact: true })).toBeVisible();
    await expect(page.getByText("Projected points / game").first()).toBeVisible();
    await expect(page.getByText("Points / play").first()).toBeVisible();

    await expect(page.getByRole("heading", { name: "Who gets the ball" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Target share" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Contribute to target share" }),
    ).toBeVisible();

    await expect(page.getByRole("heading", { name: "Roster" })).toBeVisible();
    await expect(page.getByRole("link", { name: F.wr.name }).first()).toBeVisible();

    await expect(page.getByRole("heading", { name: "Community outlook" })).toBeVisible();
    await expect(page.getByText(/top scoring environment/i)).toBeVisible();
    await expect(page.getByRole("link", { name: "Contribute to team projection" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add team outlook" })).toBeVisible();

    await expect(
      page.getByRole("button", { name: "Contribute to team offense" }),
    ).toBeVisible();
    await expect(page.getByText("Projected points / game", { exact: false }).first()).toBeVisible();

    await expect(page.getByText("History & offense detail")).toBeVisible();
  });

  test("roster link opens player card", async ({ page }) => {
    await page.goto(`/teams/${F.team}`);
    await page.locator("table.data").first().getByRole("link", { name: F.wr.name }).click();
    await expect(page).toHaveURL(new RegExp(`/players/${F.wr.id}`));
    await expect(page.getByRole("heading", { name: F.wr.name })).toBeVisible();
  });

  test("soft-offense team card also loads", async ({ page }) => {
    await page.goto(`/teams/${F.softTeam}`);
    await expect(page.getByRole("heading", { name: F.softTeam, exact: true })).toBeVisible();
    await expect(page.getByText("18.6").first()).toBeVisible();
  });

  test("offense contribute sheet includes points/play", async ({ page }) => {
    await page.goto(`/teams/${F.team}`);
    await page.getByRole("button", { name: "Contribute to team offense" }).click();
    await expect(
      page.getByRole("heading", { name: `Contribute to team offense · ${F.team}` }),
    ).toBeVisible();
    await expect(page.getByText("Points / play").first()).toBeVisible();
    await expect(
      page.getByLabel("Points / play 2026 Expected"),
    ).toBeVisible();
  });

  test("target share sheet shows other-team hist with tag", async ({ page }) => {
    await page.goto(`/teams/${F.team}`);
    await page.getByRole("button", { name: "Contribute to target share" }).click();
    await expect(page.getByText(/Amber \+ team tag/)).toBeVisible();
    const mooreRow = page.locator("tr", { hasText: "DJ Moore" });
    await expect(mooreRow.locator(".edit-hist-table__away").first()).toBeVisible();
    await expect(mooreRow.getByText("CHI").first()).toBeVisible();
    await expect(mooreRow.getByText("15.9%").first()).toBeVisible();
  });
});

test.describe("4 · Players index", () => {
  test("default board and position filters", async ({ page }) => {
    await page.goto("/players");
    await expect(page.getByRole("heading", { name: "Players" })).toBeVisible();
    await expect(page.getByRole("link", { name: F.qb.name })).toBeVisible();

    await page.getByRole("link", { name: "WR", exact: true }).click();
    await expect(page).toHaveURL(/pos=WR/);
    await expect(page.getByRole("link", { name: F.wr.name })).toBeVisible();
    // QB should not appear in WR filter
    await expect(page.getByRole("link", { name: F.qb.name })).toHaveCount(0);

    await page.getByRole("link", { name: "QB", exact: true }).click();
    await expect(page.getByRole("link", { name: F.qb.name })).toBeVisible();
  });
});

test.describe("5 · Player card", () => {
  test("WR card: outlook, share, efficiency, edit sheets", async ({ page }) => {
    await page.goto(`/players/${F.wr.id}`);
    await expect(page.getByRole("heading", { name: F.wr.name })).toBeVisible();
    await expect(page.getByText("WR").first()).toBeVisible();
    await expect(page.getByText(/WR\d+/).first()).toBeVisible();

    await expect(page.getByRole("heading", { name: "Community outlook" })).toBeVisible();
    await expect(page.getByText(/reliable slot option/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Add player outlook" })).toBeVisible();

    await expect(page.getByRole("heading", { name: "Season outlook" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Contribute to this projection" })).toBeVisible();
    await expect(page.getByText("Inspect the pieces").first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Contribute to team offense" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Contribute to player share" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Contribute to player efficiency" }),
    ).toBeVisible();

    await expect(page.getByText("Target share").first()).toBeVisible();
    await expect(page.getByText("Yards / target").first()).toBeVisible();
    // Downside FP is a locked roll-up output, not a claimable
    await expect(page.getByText("Downside fantasy points")).toHaveCount(0);
    // WR should not see rush share band on this card
    await expect(page.getByText("Rush share", { exact: true })).toHaveCount(0);

    await expect(page.getByRole("heading", { name: "Recent history" })).toBeVisible();
    await expect(page.getByText("Downside").first()).toBeVisible();
    await expect(page.getByText("Expected").first()).toBeVisible();
    await expect(page.getByText("Upside").first()).toBeVisible();
  });

  test("QB card shows rush share and pass rates, not target share", async ({ page }) => {
    await page.goto(`/players/${F.qb.id}`);
    await expect(page.getByRole("heading", { name: F.qb.name })).toBeVisible();
    await expect(page.getByText("Rush share").first()).toBeVisible();
    await expect(page.getByText("Pass YPA").first()).toBeVisible();
    await expect(page.getByText("Target share", { exact: true })).toHaveCount(0);
  });

  test("RB card shows target and rush shares", async ({ page }) => {
    await page.goto(`/players/${F.rb.id}`);
    await expect(page.getByRole("heading", { name: F.rb.name })).toBeVisible();
    await expect(page.getByText("Target share").first()).toBeVisible();
    await expect(page.getByText("Rush share").first()).toBeVisible();
    await expect(page.getByText("Yards / carry").first()).toBeVisible();
  });

  test("player → team share-pie button", async ({ page }) => {
    await page.goto(`/players/${F.wr.id}`);
    await page.getByRole("link", { name: `Also contribute on ${F.wr.team} pie` }).click();
    await expect(page).toHaveURL(new RegExp(`/teams/${F.wr.team}#share-pies`));
    await expect(page.getByRole("heading", { name: /Who gets the ball/ })).toBeVisible();
  });
});

test.describe("6 · Explore / Rankings", () => {
  test("explore index lists team and player ranking defs", async ({ page }) => {
    await page.goto("/explore");
    await expect(page.getByRole("heading", { name: "Explore" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Projected points / game" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Target share" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Base season FP" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Upside FP" })).toBeVisible();
  });

  test("rankings index still works", async ({ page }) => {
    await page.goto("/rankings");
    await expect(page.getByRole("heading", { name: "Rankings" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Projected points / game" })).toBeVisible();
  });

  test("team PPG ranking is descending and links to team", async ({ page }) => {
    await page.goto(`/rankings/${F.rankingPpg}`);
    await expect(page.getByRole("heading", { name: "Projected points / game" })).toBeVisible();
    const rows = page.locator("table.data tbody tr");
    await expect(rows.first().locator("td").nth(1)).toContainText("DET");
    const firstVal = await rows.first().locator("td").last().innerText();
    const secondVal = await rows.nth(1).locator("td").last().innerText();
    expect(Number(firstVal)).toBeGreaterThanOrEqual(Number(secondVal));
    await rows.first().getByRole("link").click();
    await expect(page).toHaveURL(/\/teams\/DET/);
  });

  test("player tgt% ranking links to player card", async ({ page }) => {
    await page.goto(`/rankings/${F.rankingTgt}`);
    await expect(page.getByRole("heading", { name: "Target share" })).toBeVisible();
    const first = page.locator("table.data tbody tr").first();
    await expect(first.locator("td").first()).toHaveText("1");
    await first.getByRole("link").first().click();
    await expect(page).toHaveURL(/\/players\//);
  });
});

test.describe("7 · Edits API", () => {
  test.beforeEach(() => {
    resetEditStore();
  });

  test("rejects non-claimable field", async ({ request }) => {
    const res = await postEdit(request, {
      grain: "player",
      subject_id: F.wr.id,
      subject_label: F.wr.name,
      field: "season_fp",
      value: 200,
      confidence: "med",
      rationale: "trying to edit settled FP",
      doctrine_ok: true,
      author: "tester",
    });
    expect(res.status()).toBe(400);
  });

  test("rejects out-of-range share", async ({ request }) => {
    const res = await postEdit(request, {
      grain: "player",
      subject_id: F.wr.id,
      subject_label: F.wr.name,
      field: "target_share",
      value: 0.9,
      confidence: "med",
      rationale: "implausibly high target share",
      doctrine_ok: true,
      author: "tester",
    });
    expect(res.status()).toBe(400);
  });

  test("rejects missing doctrine and short rationale", async ({ request }) => {
    const noDoc = await postEdit(request, {
      grain: "player",
      subject_id: F.wr.id,
      subject_label: F.wr.name,
      field: "target_share",
      value: 0.18,
      confidence: "med",
      rationale: "healthy chart destination near eighteen",
      doctrine_ok: false,
      author: "tester",
    });
    expect(noDoc.status()).toBe(400);

    const short = await postEdit(request, {
      grain: "player",
      subject_id: F.wr.id,
      subject_label: F.wr.name,
      field: "target_share",
      value: 0.18,
      confidence: "med",
      rationale: "short",
      doctrine_ok: true,
      author: "tester",
    });
    expect(short.status()).toBe(400);
  });

  test("accepts valid edits and returns community median", async ({
    request,
  }) => {
    const a = await postEdit(request, {
      grain: "player",
      subject_id: F.wr.id,
      subject_label: F.wr.name,
      field: "target_share",
      value: 0.18,
      confidence: "med",
      rationale: "Slot role holds near 18% with Moore present",
      doctrine_ok: true,
      author: "a",
    });
    expect(a.status()).toBe(200);

    const b = await postEdit(request, {
      grain: "player",
      subject_id: F.wr.id,
      subject_label: F.wr.name,
      field: "target_share",
      value: 0.20,
      confidence: "high",
      rationale: "Ceiling path if Moore is WR2 only",
      doctrine_ok: true,
      author: "b",
    });
    expect(b.status()).toBe(200);

    const get = await request.get(
      `/api/edits?grain=player&subject_id=${F.wr.id}`,
    );
    expect(get.status()).toBe(200);
    const json = await get.json();
    expect(json.community.target_share.n).toBe(2);
    expect(json.community.target_share.median).toBeCloseTo(0.19, 5);
  });

  test("accepts team-grain edit", async ({ request }) => {
    const res = await postEdit(request, {
      grain: "team",
      subject_id: F.team,
      subject_label: F.team,
      field: "implied_ppg",
      value: 26.5,
      confidence: "low",
      rationale: "Market underrates Buffalo scoring environment",
      doctrine_ok: true,
      author: "team-tester",
    });
    expect(res.status()).toBe(200);
    const get = await request.get(
      `/api/edits?grain=team&subject_id=${F.team}`,
    );
    const json = await get.json();
    expect(json.community.implied_ppg.n).toBeGreaterThanOrEqual(1);
    expect(json.community.implied_ppg.median).toBeCloseTo(26.5, 5);
  });

  test("accepts team points_per_play edit", async ({ request }) => {
    const res = await postEdit(request, {
      grain: "team",
      subject_id: F.team,
      subject_label: F.team,
      field: "points_per_play",
      value: 0.43,
      confidence: "med",
      rationale: "Brady/Carmichael should sustain above-league PPP",
      doctrine_ok: true,
      author: "ppp-tester",
    });
    expect(res.status()).toBe(200);
    const get = await request.get(
      `/api/edits?grain=team&subject_id=${F.team}&field=points_per_play`,
    );
    const json = await get.json();
    expect(json.community.points_per_play.n).toBeGreaterThanOrEqual(1);
    expect(json.community.points_per_play.median).toBeCloseTo(0.43, 5);
  });

  test("rejects unknown outlook text field", async ({ request }) => {
    const res = await postEdit(request, {
      grain: "player",
      subject_id: F.wr.id,
      subject_label: F.wr.name,
      field: "community_outlook",
      text: "This should not be writable anymore as free text.",
      doctrine_ok: true,
      author: "tester",
    });
    expect(res.status()).toBe(400);
  });

  test("accepts general feedback as pending edit", async ({ request }) => {
    const text =
      "Buffalo’s slot role looks secure for Shakir even if Moore takes some " +
      "outside snaps — steady PPR floor, not a smash upside dart.";
    const res = await postEdit(request, {
      grain: "player",
      subject_id: F.wr.id,
      subject_label: F.wr.name,
      field: "general_feedback",
      text,
      doctrine_ok: true,
      author: "feedback-tester",
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.edit.field).toBe("general_feedback");
    expect(body.edit.value).toBeNull();
    expect(body.edit.status).toBe("pending");

    const get = await request.get(
      `/api/edits?grain=player&subject_id=${F.wr.id}&field=general_feedback&status=pending`,
    );
    const json = await get.json();
    expect(json.edits.length).toBeGreaterThanOrEqual(1);
    expect(json.edits[0].rationale).toMatch(/slot role/i);
  });

  test("pending numeric edits feed community medians only", async ({
    request,
  }) => {
    const a = await postEdit(request, {
      grain: "player",
      subject_id: F.wr.id,
      subject_label: F.wr.name,
      field: "target_share",
      value: 0.22,
      confidence: "high",
      rationale: "Slot role expands with more pass volume in Buffalo",
      doctrine_ok: true,
      author: "a",
      official_value: 0.174,
    });
    expect(a.status()).toBe(200);

    const b = await postEdit(request, {
      grain: "player",
      subject_id: F.wr.id,
      subject_label: F.wr.name,
      field: "catch_pct",
      value: 0.74,
      confidence: "med",
      rationale: "Reliable hands in the short game should hold",
      doctrine_ok: true,
      author: "b",
      official_value: 0.72,
    });
    expect(b.status()).toBe(200);

    const get = await request.get(
      `/api/edits?grain=player&subject_id=${F.wr.id}`,
    );
    const json = await get.json();
    expect(json.community.target_share.n).toBeGreaterThanOrEqual(1);
    expect(json.community.catch_pct.n).toBeGreaterThanOrEqual(1);
    expect(json.outlook).toBeUndefined();
  });

  test("review endpoint marks edits reviewed", async ({ request }) => {
    const res = await postEdit(request, {
      grain: "player",
      subject_id: F.wr.id,
      subject_label: F.wr.name,
      field: "ypt",
      value: 8.5,
      rationale: "Intermediate efficiency holds with Allen",
      doctrine_ok: true,
      author: "reviewer-seed",
      official_value: 8.0,
    });
    expect(res.status()).toBe(200);
    const id = (await res.json()).edit.id;

    const mark = await request.post("/api/edits/review", {
      data: { ids: [id], status: "reviewed", decision_note: "accepted pin" },
    });
    expect(mark.status()).toBe(200);
    expect((await mark.json()).updated).toBe(1);

    const pending = await request.get(
      `/api/edits?grain=player&subject_id=${F.wr.id}&field=ypt&status=pending`,
    );
    const pendingJson = await pending.json();
    expect(
      pendingJson.edits.filter((e: { id: string }) => e.id === id),
    ).toHaveLength(0);
  });
});

test.describe("8 · Edit UI (Propose modal)", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(() => {
    resetEditStore();
  });

  async function submitPropose(
    page: Page,
    opts: { value: string; rationale: string; author?: string },
  ) {
    await page.getByRole("button", { name: "Contribute" }).first().click();
    await expect(page.getByRole("heading", { name: "Contribute an input" })).toBeVisible();
    await page.locator("#propose-value").fill(opts.value);
    await page.locator("#propose-rationale").fill(opts.rationale);
    await page.locator("#propose-author").fill(opts.author ?? "ui-tester");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Submit contribution" }).click();
    await expect(page.getByText(/Contribution submitted/)).toBeVisible();
  }

  test("Contribute target share sheet from team pie updates community", async ({
    page,
  }) => {
    await page.goto(`/teams/${F.wr.team}`);
    await page.getByRole("button", { name: "Contribute to target share" }).click();
    await expect(
      page.getByRole("heading", { name: /Contribute to target share/ }),
    ).toBeVisible();
    await page
      .locator(`input[aria-label="${F.wr.name} expected"]`)
      .fill("18.5");
    await page.locator("#share-target-rationale").fill(
      "UI path: absolute healthy destination near 18.5%",
    );
    await page.locator("#share-target-author").fill("ui-tester");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: /Submit contribution/ }).click();
    await expect(page.getByText(/Contribution submitted|contributions submitted/)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Contribute to target share/ }),
    ).toHaveCount(0, { timeout: 3000 });
    await expect(page.getByText(/18\.5% \(\d+\)/)).toBeVisible();
  });

  test("Propose validation blocks submit without doctrine", async ({ page }) => {
    await page.goto(`/players/${F.wr.id}?edit=classic`);
    await page
      .locator("tr", { hasText: "Catch %" })
      .getByRole("button", { name: "Contribute" })
      .click();
    // Catch % — enter a valid percent so only doctrine fails
    await page.locator("#propose-value").fill("72");
    await page.locator("#propose-rationale").fill("Enough characters for rationale text");
    // leave doctrine unchecked
    await page.getByRole("button", { name: "Submit contribution" }).click();
    await expect(page.getByText(/Confirm you.ve read the field description/)).toBeVisible();
  });

  test("Propose still saves without changing published outlook", async ({
    page,
  }) => {
    await page.goto(`/players/${F.wr.id}?edit=classic`);
    await expect(page.getByText(/reliable slot option/i)).toBeVisible();
    await page
      .locator("tr", { hasText: "Catch %" })
      .getByRole("button", { name: "Contribute" })
      .click();
    await page.locator("#propose-value").fill("74");
    await page.locator("#propose-rationale").fill(
      "Catch rate stays sturdy on short and intermediate looks",
    );
    await page.locator("#propose-author").fill("ui-outlook");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Submit contribution" }).click();
    await expect(page.getByText(/Contribution submitted/)).toBeVisible();
    // Published outlook is freeze text — not overwritten by Contribute
    await expect(page.getByText(/reliable slot option/i)).toBeVisible();
  });

  test("Add feedback submits general note into edit store", async ({
    page,
    request,
  }) => {
    await page.goto(`/players/${F.wr.id}`);
    await page.getByRole("button", { name: "Add player outlook" }).click();
    await expect(
      page.getByRole("heading", { name: /Add player outlook|Add general feedback/ }),
    ).toBeVisible();
    await page.locator("#feedback-text").fill(
      "Shakir profiles as a reliable weekly slot option with a sturdy floor " +
        "even if the deep shots go elsewhere.",
    );
    await page.locator("#feedback-author").fill("ui-feedback");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Submit", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Add player outlook" }),
    ).toHaveCount(0);

    const get = await request.get(
      `/api/edits?grain=player&subject_id=${F.wr.id}&field=general_feedback&status=pending`,
    );
    const json = await get.json();
    expect(
      json.edits.some((e: { rationale: string; author: string }) =>
        /reliable weekly slot/i.test(e.rationale),
      ),
    ).toBe(true);
  });
});

test.describe("9 · Unknown routes", () => {
  test("bad team and player ids show not found", async ({ page }) => {
    await page.goto("/teams/ZZZ");
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
    await page.goto("/players/not-a-real-id");
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  });
});

test.describe("10 · Frozen data integrity smoke", () => {
  test("public JSON payloads are present and coherent", async () => {
    const dataDir = path.join(process.cwd(), "public", "data");
    const meta = JSON.parse(readFileSync(path.join(dataDir, "meta.json"), "utf8"));
    const teams = JSON.parse(readFileSync(path.join(dataDir, "teams.json"), "utf8"));
    const players = JSON.parse(
      readFileSync(path.join(dataDir, "players.json"), "utf8"),
    );
    const rankings = JSON.parse(
      readFileSync(path.join(dataDir, "rankings.json"), "utf8"),
    );
    const claimable = JSON.parse(
      readFileSync(path.join(dataDir, "claimable_fields.json"), "utf8"),
    );

    expect(meta.n_teams).toBe(32);
    expect(meta.n_players).toBe(313);
    expect(teams).toHaveLength(32);
    expect(players).toHaveLength(313);
    expect(rankings.defs.length).toBeGreaterThanOrEqual(10);
    expect(meta.edit_backend).toMatch(/local|supabase/);
    expect(claimable.some((c: { field: string }) => c.field === "season_fp")).toBe(
      false,
    );
    expect(
      claimable.some(
        (c: { field: string }) => c.field === "community_outlook",
      ),
    ).toBe(false);

    const buf = teams.find((t: { team: string }) => t.team === "BUF");
    expect(buf.hist.length).toBeGreaterThanOrEqual(6);
    expect(buf.market.implied_ppg).toBeCloseTo(25.7, 1);
    expect(buf.community_note).toMatch(/scoring environment/i);

    const shakir = players.find(
      (p: { player_id: string }) => p.player_id === F.wr.id,
    );
    expect(shakir.usage.target_share).toBeCloseTo(17.4, 1);
    expect(shakir.community_note).toMatch(/slot option/i);
    expect(shakir.hist.some((h: { kind: string }) => h.kind === "actual")).toBe(
      true,
    );
  });
});
