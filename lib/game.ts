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
