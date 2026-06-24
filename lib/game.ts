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
