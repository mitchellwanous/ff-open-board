import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type {
  EditStatus,
  OpenSourceEdit,
  OpenSourceEditCreate,
} from "./types";

/**
 * Open-source edits store.
 * - Local file (`.data/edits.json`) when Supabase env is unset (dev / Playwright).
 * - Supabase `open_source_edits` when URL + service role are set (Vercel prod).
 */

const STORE_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(STORE_DIR, "edits.json");
const LEGACY_PATH = path.join(STORE_DIR, "beliefs.json");

let envLoaded = false;
function ensureEnv() {
  if (envLoaded) return;
  loadEnvConfig(process.cwd());
  // Prefer non-empty values from .env.local over empty shell exports.
  // Next does not override existing process.env keys (even empty strings).
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    if (existsSync(envPath)) {
      for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
        const t = line.trim();
        if (!t || t.startsWith("#") || !t.includes("=")) continue;
        const i = t.indexOf("=");
        const k = t.slice(0, i).trim();
        let v = t.slice(i + 1).trim();
        if (
          (v.startsWith('"') && v.endsWith('"')) ||
          (v.startsWith("'") && v.endsWith("'"))
        ) {
          v = v.slice(1, -1);
        }
        if (!k || !v) continue;
        if (!process.env[k]?.trim()) process.env[k] = v;
      }
    }
  } catch {
    // ignore — stay on local store if unreadable
  }
  envLoaded = true;
}

function supabaseUrl() {
  ensureEnv();
  return (process.env["NEXT_PUBLIC_SUPABASE_URL"] || "").trim();
}

function supabaseKey() {
  ensureEnv();
  return (process.env["SUPABASE_SERVICE_ROLE_KEY"] || "").trim();
}

export function editBackend(): "local" | "supabase" {
  return supabaseUrl() && supabaseKey() ? "supabase" : "local";
}

function supabase(): SupabaseClient {
  return createClient(supabaseUrl(), supabaseKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function ensureLocalStore(): OpenSourceEdit[] {
  if (!existsSync(STORE_DIR)) mkdirSync(STORE_DIR, { recursive: true });
  if (!existsSync(STORE_PATH) && existsSync(LEGACY_PATH)) {
    // One-time migrate from old beliefs.json
    const legacy = JSON.parse(readFileSync(LEGACY_PATH, "utf8")) as Array<
      Partial<OpenSourceEdit> & { id: string; created_at: string }
    >;
    const migrated: OpenSourceEdit[] = legacy.map((r) => ({
      id: r.id,
      created_at: r.created_at,
      grain: (r.grain as "team" | "player") || "player",
      subject_id: String(r.subject_id ?? ""),
      subject_label: String(r.subject_label ?? r.subject_id ?? ""),
      field: String(r.field ?? ""),
      field_label: String(r.field_label ?? r.field ?? ""),
      official_value: r.official_value ?? null,
      value: r.value ?? null,
      confidence: (r.confidence as "low" | "med" | "high") || "med",
      rationale: String(r.rationale ?? ""),
      doctrine_ok: r.doctrine_ok !== false,
      author: String(r.author ?? "anonymous"),
      status: (r.status as EditStatus) || "pending",
      reviewed_at: r.reviewed_at ?? null,
      decision_note: r.decision_note ?? null,
    }));
    writeFileSync(STORE_PATH, JSON.stringify(migrated, null, 2), "utf8");
    return migrated;
  }
  if (!existsSync(STORE_PATH)) {
    writeFileSync(STORE_PATH, "[]", "utf8");
    return [];
  }
  return JSON.parse(readFileSync(STORE_PATH, "utf8")) as OpenSourceEdit[];
}

function saveLocal(edits: OpenSourceEdit[]) {
  if (!existsSync(STORE_DIR)) mkdirSync(STORE_DIR, { recursive: true });
  writeFileSync(STORE_PATH, JSON.stringify(edits, null, 2), "utf8");
}

function rowFromSupabase(r: Record<string, unknown>): OpenSourceEdit {
  return {
    id: String(r.id),
    created_at: String(r.created_at),
    grain: r.grain as "team" | "player",
    subject_id: String(r.subject_id),
    subject_label: String(r.subject_label),
    field: String(r.field),
    field_label: String(r.field_label),
    official_value:
      r.official_value == null ? null : Number(r.official_value),
    value: r.value == null ? null : Number(r.value),
    confidence: (r.confidence as "low" | "med" | "high") || "med",
    rationale: String(r.rationale ?? ""),
    doctrine_ok: Boolean(r.doctrine_ok),
    author: String(r.author ?? "anonymous"),
    status: (r.status as EditStatus) || "pending",
    reviewed_at: r.reviewed_at ? String(r.reviewed_at) : null,
    decision_note: r.decision_note ? String(r.decision_note) : null,
  };
}

export async function listEdits(filter?: {
  grain?: string;
  subject_id?: string;
  field?: string;
  status?: EditStatus | EditStatus[];
}): Promise<OpenSourceEdit[]> {
  const statuses = filter?.status
    ? Array.isArray(filter.status)
      ? filter.status
      : [filter.status]
    : null;

  if (editBackend() === "supabase") {
    let q = supabase().from("open_source_edits").select("*");
    if (filter?.grain) q = q.eq("grain", filter.grain);
    if (filter?.subject_id) q = q.eq("subject_id", filter.subject_id);
    if (filter?.field) q = q.eq("field", filter.field);
    if (statuses?.length === 1) q = q.eq("status", statuses[0]);
    else if (statuses && statuses.length > 1) q = q.in("status", statuses);
    const { data, error } = await q.order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => rowFromSupabase(r as Record<string, unknown>));
  }

  let rows = ensureLocalStore();
  if (filter?.grain) rows = rows.filter((b) => b.grain === filter.grain);
  if (filter?.subject_id)
    rows = rows.filter((b) => b.subject_id === filter.subject_id);
  if (filter?.field) rows = rows.filter((b) => b.field === filter.field);
  if (statuses)
    rows = rows.filter((b) => statuses.includes(b.status || "pending"));
  return rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function addEdit(
  input: OpenSourceEditCreate,
): Promise<OpenSourceEdit> {
  const status: EditStatus = input.status ?? "pending";
  if (editBackend() === "supabase") {
    const payload = {
      grain: input.grain,
      subject_id: input.subject_id,
      subject_label: input.subject_label,
      field: input.field,
      field_label: input.field_label,
      official_value: input.official_value,
      value: input.value,
      confidence: input.confidence,
      rationale: input.rationale,
      doctrine_ok: input.doctrine_ok,
      author: input.author,
      status,
    };
    const { data, error } = await supabase()
      .from("open_source_edits")
      .insert(payload)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return rowFromSupabase(data as Record<string, unknown>);
  }

  const edits = ensureLocalStore();
  const row: OpenSourceEdit = {
    ...input,
    id: randomUUID(),
    created_at: new Date().toISOString(),
    status,
    reviewed_at: null,
    decision_note: null,
  };
  edits.push(row);
  saveLocal(edits);
  return row;
}

export async function markEdits(
  ids: string[],
  status: "reviewed" | "rejected",
  decisionNote?: string,
): Promise<number> {
  if (!ids.length) return 0;
  const reviewed_at = new Date().toISOString();
  if (editBackend() === "supabase") {
    const { data, error } = await supabase()
      .from("open_source_edits")
      .update({
        status,
        reviewed_at,
        decision_note: decisionNote ?? null,
      })
      .in("id", ids)
      .select("id");
    if (error) throw new Error(error.message);
    return data?.length ?? 0;
  }
  const edits = ensureLocalStore();
  let n = 0;
  for (const e of edits) {
    if (ids.includes(e.id)) {
      e.status = status;
      e.reviewed_at = reviewed_at;
      e.decision_note = decisionNote ?? null;
      n += 1;
    }
  }
  saveLocal(edits);
  return n;
}

/**
 * Live consensus map for a subject (pending + reviewed; rejected excluded).
 * Unlocked when n >= CONSENSUS_MIN_N — that median drives the board.
 */
export async function communityMap(
  grain: string,
  subjectId: string,
): Promise<Record<string, { median: number; n: number; unlocked: boolean }>> {
  const { consensusMapForSubject, toCommunityShape } = await import(
    "./consensus"
  );
  const { getOfficialValue, getClaimableFields } = await import("./data");

  const rows = await listEdits({
    grain,
    subject_id: subjectId,
    status: ["pending", "reviewed"],
  });

  const seeds: Record<string, number | null> = {};
  if (grain === "team" || grain === "player") {
    for (const f of getClaimableFields().filter((c) => c.grain === grain)) {
      seeds[f.field] = getOfficialValue(
        grain,
        subjectId,
        f.field,
      );
    }
  }
  const map = consensusMapForSubject(rows, seeds);
  return toCommunityShape(map);
}
