import { sb } from "./supabase";
import type { DB } from "./types";

export async function loadAll(): Promise<DB> {
  const tables = [
    "teams", "kids", "tasks", "assignments", "rewards",
    "redemptions", "gifts", "subjects", "study_sessions", "point_events", "task_targets", "badges_catalog", "kid_badges", "study_rewards", "study_questions_seen", "test_sessions", "events", "activity_reactions", "milo_walks",
  ] as const;
  const out: Record<string, unknown[]> = {};
  await Promise.all(
    tables.map(async (t) => {
      const cols = t === "kids"
        ? "id,name,emoji,color,team_id,total_points,study_enabled,active,created_at,weekly_goal,can_tutor,app_access,avatar,user_id,status"
        : "*";
      const limited: Record<string, number> = { point_events: 2000, study_sessions: 2000, study_questions_seen: 4000, test_sessions: 1000 };
      let q = sb.from(t).select(cols).order("created_at", { ascending: false });
      if (limited[t]) q = q.limit(limited[t]);
      const { data } = await q;
      out[t] = data ?? [];
    })
  );
  const { data: settings } = await sb.from("settings").select("*").eq("id", 1).maybeSingle();
  (out as Record<string, unknown>).settings = settings ?? null;
  return out as unknown as DB;
}

export const rpc = (fn: string, args: Record<string, unknown>) => sb.rpc(fn, args);
export const fmtMin = (s: number) => `${Math.floor((s || 0) / 60)} min`;
export const todayStr = () => new Date().toISOString().slice(0, 10);
export const last7 = (d: string | null) => !!d && Date.now() - new Date(d).getTime() < 7 * 864e5;
