import type { Kid, Reward } from "./types";

export const XP_PER_LEVEL = 100;

export const levelOf = (xp: number) => Math.floor((xp || 0) / XP_PER_LEVEL) + 1;
export const xpIntoLevel = (xp: number) => (xp || 0) % XP_PER_LEVEL;
export const levelProgress = (xp: number) => xpIntoLevel(xp) / XP_PER_LEVEL;
export const xpToNext = (xp: number) => XP_PER_LEVEL - xpIntoLevel(xp);

/** Recompensa más cercana que aún no puede permitirse (o null si lo tiene todo). */
export function nearestReward(kid: Kid, rewards: Reward[]) {
  const locked = rewards
    .filter((r) => r.active && r.cost > kid.total_points)
    .sort((a, b) => a.cost - b.cost);
  return locked[0] || null;
}

export const initials = (name: string) =>
  name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

/* ---- Métricas para el dashboard ---- */
import type { PointEvent, StudySession, Assignment } from "./types";

const isLast7 = (d: string) => Date.now() - new Date(d).getTime() < 7 * 864e5;

export const WEEKLY_GOAL = 100;
export const TEAM_WEEKLY_GOAL = 200;

export function weeklyXp(events: PointEvent[], kidId: string) {
  return events.filter((e) => e.kid_id === kidId && e.delta > 0 && isLast7(e.created_at)).reduce((a, b) => a + b.delta, 0);
}

/** Devuelve XP por día de la semana, lunes→domingo. */
export function weekdayBars(events: PointEvent[], kidId: string) {
  const bars = [0, 0, 0, 0, 0, 0, 0];
  events.filter((e) => e.kid_id === kidId && e.delta > 0 && isLast7(e.created_at)).forEach((e) => {
    const wd = (new Date(e.created_at).getDay() + 6) % 7;
    bars[wd] += e.delta;
  });
  return bars;
}

export function studyTodaySeconds(sessions: StudySession[], kidId: string) {
  const today = new Date().toISOString().slice(0, 10);
  return sessions.filter((s) => s.kid_id === kidId && s.created_at.slice(0, 10) === today).reduce((a, b) => a + b.seconds, 0);
}

export function teamWeeklyXp(events: PointEvent[], kidIds: string[]) {
  return events.filter((e) => kidIds.includes(e.kid_id) && e.delta > 0 && isLast7(e.created_at)).reduce((a, b) => a + b.delta, 0);
}

export function streakDays(asg: Assignment[]) {
  return new Set(asg.filter((a) => a.status === "approved" && a.validated_at).map((a) => a.validated_at!.slice(0, 10))).size;
}

// ===== Carta FUT: stats y rareza =====
import type { DB } from "@/lib/types";
const clamp99 = (n: number) => Math.max(40, Math.min(99, Math.round(n)));
export function playerStats(kid: Kid, db: DB) {
  const taskXp = db.point_events.filter((e) => e.kid_id === kid.id && e.delta > 0 && e.type === "task").reduce((a, b) => a + b.delta, 0);
  const studySec = db.study_sessions.filter((s) => s.kid_id === kid.id).reduce((a, b) => a + b.seconds, 0);
  const tests = db.test_sessions.filter((t) => t.kid_id === kid.id).length;
  const streak = streakDays(db.assignments.filter((a) => a.kid_id === kid.id));
  const activeDays = new Set(db.point_events.filter((e) => e.kid_id === kid.id && e.delta > 0).map((e) => (e.created_at || "").slice(0, 10))).size;
  const fuerza = clamp99(50 + taskXp * 0.7);
  const cerebro = clamp99(50 + (studySec / 3600) * 6 + tests * 2);
  const constancia = clamp99(48 + streak * 5 + activeDays * 2);
  const ovr = clamp99((fuerza + cerebro + constancia) / 3 + levelOf(kid.total_points) - 1);
  return { fuerza, cerebro, constancia, ovr };
}
export type Rarity = { key: string; label: string; grad: [string, string]; ring: string; text: string };
export function rarityOf(ovr: number): Rarity {
  if (ovr >= 90) return { key: "legendario", label: "LEGENDARIO", grad: ["#7C3AED", "#19D3AE"], ring: "#C4B5FD", text: "#fff" };
  if (ovr >= 78) return { key: "epico", label: "ÉPICO", grad: ["#D4AF37", "#F6E27A"], ring: "#FDE68A", text: "#3A2E00" };
  if (ovr >= 64) return { key: "raro", label: "RARO", grad: ["#7E8A99", "#C9D2DC"], ring: "#E2E8F0", text: "#1E293B" };
  return { key: "comun", label: "COMÚN", grad: ["#A06A3B", "#C89B6A"], ring: "#E7C9A6", text: "#2A1A09" };
}
