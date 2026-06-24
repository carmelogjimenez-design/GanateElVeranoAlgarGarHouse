"use client";
import { useState } from "react";
import { AppShell, type NavItem } from "@/components/ui/AppShell";
import AdminResumen from "@/components/admin/AdminResumen";
import AdminValidate from "@/components/admin/AdminValidate";
import AdminTasks from "@/components/admin/AdminTasks";
import AdminKids from "@/components/admin/AdminKids";
import AdminRewards from "@/components/admin/AdminRewards";
import type { Ctx } from "@/lib/types";
import { LayoutDashboard, ClipboardCheck, Target, Users, Gift } from "lucide-react";

export default function AdminApp({ ctx }: { ctx: Ctx }) {
  const { db, logout } = ctx;
  const [tab, setTab] = useState("resumen");
  const pend =
    db.assignments.filter((a) => a.status === "pending").length +
    db.redemptions.filter((r) => r.status === "pending").length +
    db.gifts.filter((g) => g.status === "pending").length;
  const nav: NavItem[] = [
    { key: "resumen", label: "Resumen", Icon: LayoutDashboard },
    { key: "validar", label: pend ? `Validar (${pend})` : "Validar", Icon: ClipboardCheck },
    { key: "tareas", label: "Misiones", Icon: Target },
    { key: "hijos", label: "Hijos", Icon: Users },
    { key: "premios", label: "Tienda", Icon: Gift },
  ];
  return (
    <AppShell variant="admin" title="Panel de padres" subtitle="Centro de mando" brand="P"
      nav={nav} active={tab} onChange={setTab} onExit={logout}>
      {tab === "resumen" && <AdminResumen ctx={ctx} onGo={setTab} />}
      {tab === "validar" && <div className="max-w-3xl"><AdminValidate ctx={ctx} /></div>}
      {tab === "tareas" && <div className="max-w-3xl"><AdminTasks ctx={ctx} /></div>}
      {tab === "hijos" && <div className="max-w-3xl"><AdminKids ctx={ctx} /></div>}
      {tab === "premios" && <AdminRewards ctx={ctx} />}
    </AppShell>
  );
}
