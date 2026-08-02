/**
 * Regenerate public/help/*.png from the local Next server.
 * Usage: npm run dev  (other terminal) then:
 *   node scripts/capture-help-shots.mjs
 */
import { chromium } from "playwright";
import path from "path";

const out = path.join(process.cwd(), "public", "help");
const base = "http://localhost:3000";

async function hideChrome(page) {
  await page.addStyleTag({
    content:
      "[data-nextjs-toast],[data-next-badge-root],nextjs-portal{display:none!important}",
  });
}

async function shotEl(page, selector, file) {
  const loc = page.locator(selector).first();
  await loc.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await loc.screenshot({ path: path.join(out, file) });
  console.log("wrote", file);
}

async function shotClip(page, file, clip) {
  await page.screenshot({ path: path.join(out, file), clip });
  console.log("wrote", file, `${Math.round(clip.width)}x${Math.round(clip.height)}`);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1100, height: 1400 } });

await page.goto(`${base}/players/00-0036322`, { waitUntil: "networkidle" });
await hideChrome(page);

// 01 outlook
await page.locator("h1").scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
await shotClip(
  page,
  "01-player-outlook.png",
  await page.evaluate(() => {
    const h1 = document.querySelector("h1");
    const outlook = document.querySelector(".outlook");
    const topEl = h1?.previousElementSibling || h1;
    const t = topEl.getBoundingClientRect();
    const b = outlook.getBoundingClientRect();
    const x = Math.max(0, Math.min(t.left, b.left) - 8);
    const y = Math.max(0, Math.min(t.top, b.top) - 8);
    return {
      x,
      y,
      width: Math.max(t.right, b.right) - x + 8,
      height: b.bottom - y + 8,
    };
  }),
);

// 02 efficiency table
await page.evaluate(() => {
  const h2 = [...document.querySelectorAll("h2")].find((el) =>
    /Efficiency & TD rates/i.test(el.textContent || ""),
  );
  h2.id = "help-shot-eff";
  let el = h2.nextElementSibling;
  let last = h2;
  while (el && el.tagName !== "H2") {
    last = el;
    el = el.nextElementSibling;
  }
  last.id = "help-shot-eff-end";
});
await page.locator("#help-shot-eff").scrollIntoViewIfNeeded();
await page.waitForTimeout(250);
await shotClip(
  page,
  "02-propose-table.png",
  await page.evaluate(() => {
    const a = document.querySelector("#help-shot-eff").getBoundingClientRect();
    const b = document
      .querySelector("#help-shot-eff-end")
      .getBoundingClientRect();
    const x = Math.max(0, Math.min(a.left, b.left) - 8);
    const y = Math.max(0, a.top - 8);
    return {
      x,
      y,
      width: Math.max(a.right, b.right) - x + 8,
      height: b.bottom - y + 8,
    };
  }),
);

// 06 locked FP
await page.evaluate(() => {
  const h3 = [...document.querySelectorAll("h3")].find((el) =>
    /Season fantasy points/i.test(el.textContent || ""),
  );
  h3.id = "help-fp-h3";
  h3.nextElementSibling.id = "help-fp-grid";
  const note = h3.nextElementSibling.nextElementSibling;
  if (note) note.id = "help-fp-note";
});
await page.locator("#help-fp-h3").scrollIntoViewIfNeeded();
await page.evaluate(() => {
  document.querySelector("#help-fp-h3").scrollIntoView({ block: "start" });
  window.scrollBy(0, -24);
});
await page.waitForTimeout(250);
await shotClip(
  page,
  "06-locked-fp.png",
  await page.evaluate(() => {
    const a = document.querySelector("#help-fp-h3").getBoundingClientRect();
    const g = document.querySelector("#help-fp-grid").getBoundingClientRect();
    const b = document.querySelector("#help-fp-note").getBoundingClientRect();
    const x = Math.max(0, Math.min(a.left, g.left, b.left) - 8);
    const y = Math.max(0, a.top - 8);
    return {
      x,
      y,
      width: Math.max(a.right, g.right, b.right) - x + 8,
      height: Math.max(a.bottom, g.bottom, b.bottom) - y + 8,
    };
  }),
);

// 03 propose modal
await page.locator("#help-shot-eff").scrollIntoViewIfNeeded();
await page.locator("button", { hasText: "Propose" }).first().click();
await page.waitForSelector(".modal");
await page.fill("#propose-value", "67.0");
await page.fill(
  "#propose-rationale",
  "Slight catch% bump with Kyler — cleaner ball and fewer uncatchable deep misses than last year. Season-long healthy rate, not a spike week.",
);
await page.locator(".doctrine-check input[type=checkbox]").check({ force: true });
await page.waitForTimeout(150);
await shotEl(page, ".modal", "03-propose-modal.png");
await page.locator(".modal button", { hasText: "Cancel" }).click();

// 07 add feedback
await page.locator("button", { hasText: "Add feedback" }).click();
await page.waitForSelector(".modal");
await page.locator(".modal textarea").first().fill(
  "Board already has Jefferson as the clear alpha — community lean is modest efficiency with Kyler, not a target-share leap.",
);
await page.locator(".modal input[type=checkbox]").check({ force: true });
await page.waitForTimeout(150);
await shotEl(page, ".modal", "07-add-feedback.png");
await page.keyboard.press("Escape");

// 04 team pies
await page.goto(`${base}/teams/MIN`, { waitUntil: "networkidle" });
await hideChrome(page);
await page.evaluate(() => {
  const h2 = [...document.querySelectorAll("h2")].find((el) =>
    /Who gets the ball/i.test(el.textContent || ""),
  );
  h2.id = "help-pie-h2";
});
await page.locator("#help-pie-h2").scrollIntoViewIfNeeded();
await page.evaluate(() => {
  document.querySelector("#help-pie-h2").scrollIntoView({ block: "start" });
  window.scrollBy(0, -16);
});
await page.waitForTimeout(300);
await shotClip(
  page,
  "04-team-pie.png",
  await page.evaluate(() => {
    const h2 = document.querySelector("#help-pie-h2");
    const cards = [...document.querySelectorAll("h3")]
      .filter((el) => /Target share|Rush share/i.test(el.textContent || ""))
      .map((h3) => {
        let card = h3.parentElement;
        while (card && card !== document.body) {
          if (
            card.querySelector("table") &&
            /Base sum/i.test(card.textContent || "")
          )
            return card;
          card = card.parentElement;
        }
        return h3.parentElement;
      });
    const a = h2.getBoundingClientRect();
    const boxes = cards.map((c) => c.getBoundingClientRect());
    const left = Math.min(a.left, ...boxes.map((b) => b.left));
    const right = Math.max(a.right, ...boxes.map((b) => b.right));
    const top = a.top;
    const bottom = Math.max(...boxes.map((b) => b.bottom));
    return {
      x: Math.max(0, left - 8),
      y: Math.max(0, top - 8),
      width: right - left + 16,
      height: bottom - top + 16,
    };
  }),
);

await browser.close();
console.log("done");
