import { sb } from "./supabase";
import type { DB } from "./types";

export async function loadAll(): Promise<DB> {
  const tables = [
    "teams", "kids", "tasks", "assignments", "rewards",
    "redemptions", "gifts", "subjects", "study_sessions", "point_events", "task_targets", "badges_catalog", "kid_badges", "study_rewards", "study_questions_seen", "test_sessions", "events", "activity_reactions", "milo_walks", "notifications",
  ] as const;
  const out: Record<string, unknown[]> = {};
  await Promise.all(
    tables.map(async (t) => {
      const cols = t === "kids"
        ? "id,name,emoji,color,team_id,total_points,study_enabled,active,created_at,weekly_goal,can_tutor,app_access,avatar,user_id,status"
        : "*";
      const limited: Record<string, number> = { point_events: 2000, study_sessions: 2000, study_questions_seen: 4000, test_sessions: 1000 };
      const build = (withOrder: boolean) => {
        let q = sb.from(t).select(cols);
        if (withOrder) q = q.order("created_at", { ascending: false });
        if (limited[t]) q = q.limit(limited[t]);
        return q;
      };
      // Algunas tablas (p.ej. kid_badges) no tienen 'created_at'. Si ordenar
      // falla, reintentamos sin orden para que la tabla cargue igualmente.
      let { data, error } = await build(true);
      if (error) ({ data } = await build(false));
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

// ── Cooldown rodante por frecuencia (Feature: misiones congeladas) ──
export function cooldownMs(freq: string): number {
  const D = 86400000;
  switch (freq) {
    case "diaria": return D;
    case "2/semana": return 3 * D;
    case "semanal": return 7 * D;
    case "quincenal": return 15 * D;
    case "mensual": return 30 * D;
    default: return 0; // personalizada u otras: sin cooldown automático
  }
}

export function fmtCountdown(ms: number): string {
  if (ms <= 0) return "ya disponible";
  const totalMin = Math.floor(ms / 60000);
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
