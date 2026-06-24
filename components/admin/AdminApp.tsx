"use client";
import { useState, useEffect } from "react";
import { AppShell, type NavItem } from "@/components/ui/AppShell";
import AdminResumen from "@/components/admin/AdminResumen";
import AdminValidate from "@/components/admin/AdminValidate";
import AdminTasks from "@/components/admin/AdminTasks";
import AdminKids from "@/components/admin/AdminKids";
import AdminRewards from "@/components/admin/AdminRewards";
import AdminSettings from "@/components/admin/AdminSettings";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import NotificationBell from "@/components/admin/NotificationBell";
import type { Ctx } from "@/lib/types";
import { LayoutDashboard, ClipboardCheck, Target, Users, Gift, Settings, BarChart3 } from "lucide-react";
import { rpc, todayStr } from "@/lib/helpers";

export default function AdminApp({ ctx }: { ctx: Ctx }) {
  const { db, logout, refresh } = ctx;
  const [tab, setTab] = useState("resumen");
  useEffect(() => { rpc("generate_missions", { p_date: todayStr() }).then(({ data }) => { if (data) refresh(); }); /* eslint-disable-next-line */ }, []);
  const pend =
    db.assignments.filter((a) => a.status === "pending").length +
    db.redemptions.filter((r) => r.status === "pending").length +
    db.gifts.filter((g) => g.status === "pending").length +
    db.study_rewards.filter((r) => r.status === "pending").length;
  const nav: NavItem[] = [
    { key: "resumen", label: "Resumen", Icon: LayoutDashboard },
    { key: "validar", label: pend ? `Validar (${pend})` : "Validar", Icon: ClipboardCheck },
    { key: "tareas", label: "Misiones", Icon: Target },
    { key: "hijos", label: "Hijos", Icon: Users },
    { key: "premios", label: "Tienda", Icon: Gift },
    { key: "analytics", label: "Analytics", Icon: BarChart3 },
    { key: "ajustes", label: "Ajustes", Icon: Settings },
  ];
  return (
    <AppShell variant="admin" title="Panel de padres" subtitle="Centro de mando" brand={<img src="/logo.png" alt="logo" className="w-full h-full object-contain rounded-xl" />}
      nav={nav} active={tab} onChange={setTab} onExit={logout}
      headerRight={<NotificationBell ctx={ctx} onGo={setTab} />}>
      {tab === "resumen" && <AdminResumen ctx={ctx} onGo={setTab} />}
      {tab === "validar" && <div className="max-w-3xl"><AdminValidate ctx={ctx} /></div>}
      {tab === "tareas" && <div className="max-w-3xl"><AdminTasks ctx={ctx} /></div>}
      {tab === "hijos" && <div className="max-w-3xl"><AdminKids ctx={ctx} /></div>}
      {tab === "premios" && <AdminRewards ctx={ctx} />}
      {tab === "analytics" && <AdminAnalytics ctx={ctx} />}
      {tab === "ajustes" && <AdminSettings ctx={ctx} />}
    </AppShell>
  );
}
