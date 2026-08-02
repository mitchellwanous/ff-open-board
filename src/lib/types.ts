/** Shared types for Open Board frozen payloads + open-source edits. */

export type HistKind = "actual" | "proj";

export type TeamHistRow = {
  season: number;
  kind: HistKind;
  ppg: number | null;
  plays_pg: number | null;
  pass_rate: number | null;
  pass_yards: number | null;
  rush_yards: number | null;
  team_targets: number | null;
  designed_rush_attempts?: number | null;
  sack_rate?: number | null;
  pressure_proxy?: number | null;
  pass_ypa?: number | null;
  rz_plays?: number | null;
  gl_rush_attempts?: number | null;
};

export type PieSegment = {
  kind: "player" | "depth";
  player_id: string | null;
  depth_key?: string | null;
  name: string;
  position: string;
  share_dn: number | null;
  share: number | null;
  share_ceil: number | null;
};

export type Team = {
  team: string;
  summary?: string | null;
  /** Published distilled “why” outlook (from lab community_notes). */
  community_note?: string | null;
  staff: {
    head_coach: string | null;
    oc_name: string | null;
    oc_changed: boolean | null;
    hc_changed: boolean | null;
    scheme_prior_team: string | null;
    notes: string | null;
  };
  market: {
    implied_ppg: number | null;
    win_total: number | null;
    volume_scale: number | null;
    pass_rate_prior: number | null;
    rush_rate_prior: number | null;
    source: string | null;
    as_of: string | null;
    ppg_rk: number | null;
  };
  hub: {
    plays_pg: number | null;
    pass_rate: number | null;
    rush_rate: number | null;
    pass_yards: number | null;
    rush_yards: number | null;
    team_targets: number | null;
    designed_rush_attempts: number | null;
    sack_rate: number | null;
    pressure_proxy: number | null;
    pass_ypa_used: number | null;
    rz_plays: number | null;
    rz_pass_attempts: number | null;
    gl_rush_attempts: number | null;
    hub_source: string | null;
    pass_rk: number | null;
    rush_rk: number | null;
    plays_rk: number | null;
  };
  scenario: {
    vol_up: number | null;
    vol_dn: number | null;
    pass_tilt_up: number | null;
    pass_tilt_dn: number | null;
    eff_up: number | null;
    eff_dn: number | null;
    source: string | null;
    notes: string | null;
  };
  board_fp: number | null;
  board_rk: number | null;
  newcomers: string[];
  tgt_segs: PieSegment[];
  rush_segs: PieSegment[];
  depth_shares: Record<string, number | null>;
  hist: TeamHistRow[];
  implied_ppg: number | null;
  plays_pg: number | null;
  pass_rate: number | null;
  pass_yards: number | null;
  rush_yards: number | null;
  volume_scale: number | null;
  vol_up: number | null;
  eff_up: number | null;
};

export type Player = {
  player_id: string;
  name: string;
  team: string;
  position: string;
  depth_rank: number | null;
  age: number | null;
  years_exp: number | null;
  same_team: boolean | null;
  prev_team: string | null;
  /** Published distilled “why” outlook (from lab community_notes). */
  community_note?: string | null;
  team_pack: {
    team: string;
    implied_ppg: number | null;
    plays_pg: number | null;
    pass_rate: number | null;
    team_targets: number | null;
    oc_changed: boolean | null;
    coach_change_kind: string | null;
    vol_up: number | null;
    eff_up: number | null;
    pass_tilt_up: number | null;
  };
  usage: {
    target_share: number | null;
    rush_share: number | null;
    target_share_ceil: number | null;
    rush_share_ceil: number | null;
    target_share_floor: number | null;
    rush_share_floor: number | null;
  };
  volume: Record<string, number | null>;
  rates: Record<string, number | null>;
  fp: {
    season_fp: number | null;
    fp_per_game: number | null;
    games_played_proj: number | null;
    ly_fp: number | null;
    floor_fp: number | null;
    ceiling_fp: number | null;
    passing_fp: number | null;
    rushing_fp: number | null;
    receiving_fp: number | null;
  };
    draft: {
    draft_rank: number | null;
    wwor: number | null;
    e_win_weeks: number | null;
    win_week_rate_proj: number | null;
    scenario_fp: number | null;
    downside_fp: number | null;
    upside_gap: number | null;
    downside_gap: number | null;
    uwwor: number | null;
    dwwor: number | null;
    risk_reward: number | null;
    pos_rank: number | null;
    pos_downside_rank: number | null;
    pos_upside_rank: number | null;
    no_pos1: string | null;
    pos1_path: string | null;
    scenario_note: string | null;
    downside_blurb: string | null;
    base_blurb: string | null;
    upside_blurb: string | null;
  };
  waterfall?: unknown;
  win_weeks_hist: {
    win_weeks: number | null;
    win_week_games: number | null;
    win_week_rate: number | null;
    max_weekly_fp: number | null;
  } | null;
  hist: Array<{
    season: number;
    kind: HistKind;
    team: string | null;
    games: number | null;
    targets: number | null;
    receptions: number | null;
    rec_yards: number | null;
    target_share: number | null;
    rush_share: number | null;
    season_fp: number | null;
  }>;
  // flat claimable mirrors
  target_share: number | null;
  rush_share: number | null;
  target_share_ceil: number | null;
  rush_share_ceil: number | null;
  target_share_dn: number | null;
  rush_share_dn: number | null;
  catch_pct: number | null;
  ypt: number | null;
  cay_per_rec: number | null;
  yac_per_rec: number | null;
  rec_td_rate: number | null;
  ypc: number | null;
  rush_td_rate: number | null;
  pass_ypa: number | null;
  pass_td_rate: number | null;
  int_rate: number | null;
  downside_fp: number | null;
  season_fp: number | null;
  wwor: number | null;
  scenario_fp: number | null;
  draft_rank: number | null;
};

export type ClaimableField = {
  field: string;
  grain: "team" | "player";
  label: string;
  unit: string;
  min: number;
  max: number;
  positions?: string[];
  doctrine: string;
};

export type RankingDef = {
  id: string;
  grain: "team" | "player";
  label: string;
  field: string;
  higher_is_better: boolean;
  format?: string;
  positions?: string[];
  min_targets?: number;
};

export type RankingRow = {
  rank: number;
  id: string;
  label: string;
  team: string;
  position?: string;
  value: number;
  href?: string;
};

export type RankingsPayload = {
  defs: RankingDef[];
  tables: Record<string, RankingRow[]>;
};

export type Meta = {
  season: number;
  scoring: string;
  exported_on: string;
  source: string;
  n_teams: number;
  n_players: number;
  edit_backend: string;
  notes: string;
};

export type EditStatus = "pending" | "reviewed" | "rejected";

/** team/player = projection inbox; app = site/product feedback (not pins/outlook). */
export type EditGrain = "team" | "player" | "app";

export type OpenSourceEdit = {
  id: string;
  created_at: string;
  grain: EditGrain;
  subject_id: string;
  subject_label: string;
  field: string;
  field_label: string;
  official_value: number | null;
  value: number | null;
  confidence: "low" | "med" | "high";
  rationale: string;
  doctrine_ok: boolean;
  author: string;
  status: EditStatus;
  reviewed_at?: string | null;
  decision_note?: string | null;
};

export type OpenSourceEditCreate = Omit<
  OpenSourceEdit,
  "id" | "created_at" | "status" | "reviewed_at" | "decision_note"
> & {
  status?: EditStatus;
};
