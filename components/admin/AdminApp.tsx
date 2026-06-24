"use client";
import { useState } from "react";
import AdminValidate from "@/components/admin/AdminValidate";
import AdminTasks from "@/components/admin/AdminTasks";
import AdminKids from "@/components/admin/AdminKids";
import AdminRewards from "@/components/admin/AdminRewards";
import AdminStats from "@/components/admin/AdminStats";
import type { Ctx } from "@/lib/types";

export default function AdminApp({ ctx }: { ctx: Ctx }) {
  const { db, logout } = ctx;
  const [tab, setTab] = useState("validar");
  const pend =
    db.assignments.filter((a) => a.status === "pending").length +
    db.redemptions.filter((r) => r.status === "pending").length +
    db.gifts.filter((g) => g.status === "pending").length;
  const tabs: [string, string][] = [
    ["validar", `✅ Validar${pend ? " (" + pend + ")" : ""}`],
    ["tareas", "📋 Tareas"],
    ["hijos", "👨‍👩‍👧 Hijos"],
    ["premios", "🎁 Premios"],
    ["rank", "📊 Stats"],
  ];
  return (
    <div>
      <div className="bg-slate-900 text-white px-4 pt-6 pb-4 flex justify-between items-center">
        <div><div className="font-black text-xl">👑 Panel de padres</div><div className="text-xs opacity-70">Tamar &amp; Ricardo</div></div>
        <button onClick={logout} className="font-bold text-sm bg-white/15 px-3 py-2 rounded-xl">Salir</button>
      </div>
      <div className="flex gap-2 overflow-x-auto px-4 py-3 bg-white sticky top-0 z-10">
        {tabs.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`whitespace-nowrap px-3 py-2 rounded-2xl font-bold text-sm ${tab === k ? "bg-orange-500 text-white" : "bg-slate-100"}`}>{l}</button>
        ))}
      </div>
      <div className="px-4 pt-1">
        {tab === "validar" && <AdminValidate ctx={ctx} />}
        {tab === "tareas" && <AdminTasks ctx={ctx} />}
        {tab === "hijos" && <AdminKids ctx={ctx} />}
        {tab === "premios" && <AdminRewards ctx={ctx} />}
        {tab === "rank" && <AdminStats ctx={ctx} />}
      </div>
    </div>
  );
}
