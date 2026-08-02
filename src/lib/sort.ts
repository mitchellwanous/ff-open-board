/** URL-driven table sorting helpers for server components. */

export type SortDir = "asc" | "desc";

export function parseSortDir(raw: string | undefined, fallback: SortDir): SortDir {
  if (raw === "asc" || raw === "desc") return raw;
  return fallback;
}

export function nextSortDir(
  currentKey: string,
  clickedKey: string,
  currentDir: SortDir,
  defaultDir: SortDir = "desc",
): SortDir {
  if (currentKey !== clickedKey) return defaultDir;
  return currentDir === "desc" ? "asc" : "desc";
}

export function sortHref(opts: {
  basePath: string;
  params: Record<string, string | undefined>;
  sort: string;
  dir: SortDir;
}): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(opts.params)) {
    if (v != null && v !== "") q.set(k, v);
  }
  q.set("sort", opts.sort);
  q.set("dir", opts.dir);
  const s = q.toString();
  return s ? `${opts.basePath}?${s}` : opts.basePath;
}

export function compareNullable(
  a: number | string | null | undefined,
  b: number | string | null | undefined,
  dir: SortDir,
): number {
  const aNull = a == null || a === "";
  const bNull = b == null || b === "";
  if (aNull && bNull) return 0;
  if (aNull) return 1;
  if (bNull) return -1;
  let cmp = 0;
  if (typeof a === "number" && typeof b === "number") {
    cmp = a - b;
  } else {
    cmp = String(a).localeCompare(String(b), undefined, { sensitivity: "base" });
  }
  return dir === "asc" ? cmp : -cmp;
}
