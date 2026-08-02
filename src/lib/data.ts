import { readFileSync } from "fs";
import path from "path";
import type {
  ClaimableField,
  Meta,
  Player,
  RankingsPayload,
  Team,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "public", "data");

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(path.join(DATA_DIR, name), "utf8")) as T;
}

export function getMeta(): Meta {
  return readJson("meta.json");
}

export function getTeams(): Team[] {
  return readJson("teams.json");
}

export function getTeam(abbr: string): Team | undefined {
  return getTeams().find((t) => t.team === abbr.toUpperCase());
}

export function getPlayers(): Player[] {
  return readJson("players.json");
}

export function getPlayer(id: string): Player | undefined {
  return getPlayers().find((p) => p.player_id === id);
}

export function getPlayersByTeam(team: string): Player[] {
  return getPlayers()
    .filter((p) => p.team === team)
    .sort((a, b) => (b.fp.season_fp ?? 0) - (a.fp.season_fp ?? 0));
}

export function getRankings(): RankingsPayload {
  return readJson("rankings.json");
}

export function getClaimableFields(): ClaimableField[] {
  return readJson("claimable_fields.json");
}

function asShare(n: number | null | undefined): number | null {
  if (n == null || Number.isNaN(n)) return null;
  return Math.abs(n) > 1.5 ? n / 100 : n;
}

export function getOfficialValue(
  grain: "team" | "player",
  subjectId: string,
  field: string,
): number | null {
  if (grain === "team") {
    const t = getTeam(subjectId);
    if (!t) return null;
    const map: Record<string, number | null | undefined> = {
      implied_ppg: t.market.implied_ppg,
      plays_pg: t.hub.plays_pg,
      pass_rate: asShare(t.hub.pass_rate),
      vol_up: t.scenario.vol_up,
      eff_up: t.scenario.eff_up,
      target_share_other: t.depth_shares?.target_share_other ?? null,
      rush_share_other: t.depth_shares?.rush_share_other ?? null,
    };
    return map[field] ?? null;
  }
  const p = getPlayer(subjectId);
  if (!p) return null;
  const map: Record<string, number | null | undefined> = {
    target_share_dn: p.target_share_dn ?? asShare(p.usage.target_share_floor),
    target_share: p.target_share,
    target_share_ceil: p.target_share_ceil,
    rush_share_dn: p.rush_share_dn ?? asShare(p.usage.rush_share_floor),
    rush_share: p.rush_share,
    rush_share_ceil: p.rush_share_ceil,
    catch_pct: p.catch_pct ?? asShare(p.rates.catch_pct),
    ypt: p.ypt ?? p.rates.ypt,
    cay_per_rec: p.cay_per_rec ?? p.rates.cay_per_rec,
    yac_per_rec: p.yac_per_rec ?? p.rates.yac_per_rec,
    rec_td_rate: p.rec_td_rate ?? asShare(p.rates.rec_td_rate),
    ypc: p.ypc ?? p.rates.ypc,
    rush_td_rate: p.rush_td_rate ?? asShare(p.rates.rush_td_rate),
    pass_ypa: p.pass_ypa ?? p.rates.pass_ypa,
    pass_td_rate: p.pass_td_rate ?? asShare(p.rates.pass_td_rate),
    int_rate: p.int_rate ?? asShare(p.rates.int_rate),
  };
  return map[field] ?? null;
}
