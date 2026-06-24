import { Target, Flame, Brain, Medal, Sparkles, Crown, Clock, ShoppingBag, type LucideIcon } from "lucide-react";
import type { DB, Kid } from "./types";

export type Badge = { key: string; label: string; Icon: LucideIcon; color: string; earned: boolean };

export function computeBadges(me: Kid, db: DB): Badge[] {
  const approved = db.assignments.filter((a) => a.kid_id === me.id && a.status === "approved");
  const streak = new Set(approved.filter((a) => a.validated_at).map((a) => a.validated_at!.slice(0, 10))).size;
  const studied = db.study_sessions.some((s) => s.kid_id === me.id);
  const ranking = [...db.kids].sort((a, b) => b.total_points - a.total_points);
  const isFirst = ranking[0]?.id === me.id && me.total_points > 0;
  const redeemed = db.redemptions.some((r) => r.kid_id === me.id && r.status === "approved");
  const studySecs = db.study_sessions.filter((s) => s.kid_id === me.id).reduce((a, b) => a + b.seconds, 0);

  return [
    { key: "first", label: "Primera misión", Icon: Target, color: "#FF8A00", earned: approved.length >= 1 },
    { key: "streak", label: "Racha de fuego", Icon: Flame, color: "#EF4444", earned: streak >= 3 },
    { key: "brain", label: "Cerebrito", Icon: Brain, color: "#A855F7", earned: studied },
    { key: "century", label: "100 puntos", Icon: Medal, color: "#EAB308", earned: me.total_points >= 100 },
    { key: "worker", label: "Currante", Icon: Sparkles, color: "#19D3AE", earned: approved.length >= 5 },
    { key: "leader", label: "Líder", Icon: Crown, color: "#F59E0B", earned: isFirst },
    { key: "time", label: "1h de estudio", Icon: Clock, color: "#3B82F6", earned: studySecs >= 3600 },
    { key: "shop", label: "Primer canje", Icon: ShoppingBag, color: "#EC4899", earned: redeemed },
  ];
}
