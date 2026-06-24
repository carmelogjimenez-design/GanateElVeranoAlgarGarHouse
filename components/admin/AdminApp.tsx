"use client";
import { useState } from "react";
import AdminValidate from "@/components/admin/AdminValidate";
import AdminTasks from "@/components/admin/AdminTasks";
import AdminKids from "@/components/admin/AdminKids";
import AdminRewards from "@/components/admin/AdminRewards";
import AdminStats from "@/components/admin/AdminStats";
import type { Ctx } from "@/lib/types";
import { ClipboardCheck, Target, Users, Gift, BarChart3, LogOut } from "lucide-react";

export default function AdminApp({ ctx }: { ctx: Ctx }) {
  const { db, logout } = ctx;
  const [tab, setTab] = useState("validar");
  const pend =
    db.assignments.filter((a) => a.status === "pending").length +
    db.redemptions.filter((r) => r.status === "pending").length +
    db.gifts.filter((g) => g.status === "pending").length;
  const tabs: [string, string, typeof Target][] = [
    ["validar", "Validar", ClipboardCheck], ["tareas", "Misiones", Target],
    ["hijos", "Hijos", Users], ["premios", "Tienda", Gift], ["rank", "Stats", BarChart3],
  ];
  return (
    <div className="min-h-screen">
      <div className="bg-navy text-white px-4 pt-6 pb-4 flex justify-between items-center">
        <div>
          <div className="font-extrabold text-lg tracking-tight">Panel de padres</div>
          <div className="text-xs opacity-60">Tamar &amp; Ricardo · Centro de mando</div>
        </div>
        <button onClick={logout} className="flex items-center gap-1.5 text-sm font-medium bg-white/10 px-3 py-2 rounded-xl"><LogOut size={15} /> Salir</button>
      </div>
      <div className="flex gap-2 overflow-x-auto px-4 py-3 bg-white sticky top-0 z-10 border-b border-slate-100">
        {tabs.map(([k, l, Icon]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`whitespace-nowrap px-3 py-2 rounded-xl font-semibold text-sm flex items-center gap-1.5 ${tab === k ? "bg-brand text-white" : "bg-slate-100 text-slate-500"}`}>
            <Icon size={15} /> {l}{k === "validar" && pend ? ` (${pend})` : ""}
          </button>
        ))}
      </div>
      <div className="px-4 pt-4">
        {tab === "validar" && <AdminValidate ctx={ctx} />}
        {tab === "tareas" && <AdminTasks ctx={ctx} />}
        {tab === "hijos" && <AdminKids ctx={ctx} />}
        {tab === "premios" && <AdminRewards ctx={ctx} />}
        {tab === "rank" && <AdminStats ctx={ctx} />}
      </div>
    </div>
  );
}
