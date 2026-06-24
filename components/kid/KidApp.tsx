"use client";
import { useState } from "react";
import { Avatar, Modal } from "@/components/ui/atoms";
import KidHome from "@/components/kid/KidHome";
import KidTasks from "@/components/kid/KidTasks";
import KidRewards from "@/components/kid/KidRewards";
import KidMarket from "@/components/kid/KidMarket";
import KidStudy from "@/components/kid/KidStudy";
import RankingList from "@/components/RankingList";
import type { Ctx } from "@/lib/types";
import { Home, ClipboardList, BookOpen, Trophy, ShoppingBag, Star, Bell, LogOut, Sun } from "lucide-react";

export default function KidApp({ ctx }: { ctx: Ctx }) {
  const { db, kid, setScreen } = ctx;
  const me = db.kids.find((k) => k.id === kid!.id) || kid!;
  const [tab, setTab] = useState("inicio");
  const [mercado, setMercado] = useState(false);
  const myAsg = db.assignments.filter((a) => a.kid_id === me.id);
  const bell = myAsg.filter((a) => a.status === "pending").length;

  const nav: [string, string, typeof Home][] = [
    ["inicio", "Inicio", Home], ["tareas", "Misiones", ClipboardList],
  ];
  if (me.study_enabled) nav.push(["estudio", "Estudio", BookOpen]);
  nav.push(["ranking", "Ranking", Trophy], ["tienda", "Tienda", ShoppingBag]);

  return (
    <div className="min-h-screen pb-24">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-brand/12 flex items-center justify-center"><Sun size={20} className="text-brand" /></div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-navy tracking-tight leading-none">¡Hola, {me.name}!</div>
            <div className="text-xs text-slate-400 hidden sm:block mt-0.5">Hoy es un gran día para sumar puntos</div>
          </div>
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-amber-50">
            <Star size={16} className="text-amber-400 fill-amber-400" />
            <div className="leading-none"><div className="font-extrabold text-navy text-sm">{me.total_points}</div></div>
            <span className="text-[10px] font-semibold text-slate-400 hidden sm:block">PUNTOS</span>
          </div>
          <button className="relative w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <Bell size={17} />
            {bell > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{bell}</span>}
          </button>
          <Avatar name={me.name} color={me.color} size={36} />
          <button onClick={() => setScreen("lobby")} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500" title="Salir"><LogOut size={16} /></button>
        </div>
      </header>

      {/* CONTENT */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-5">
        {tab === "inicio" && <KidHome ctx={ctx} me={me} onTab={setTab} onMercado={() => setMercado(true)} />}
        {tab === "tareas" && <div className="max-w-2xl"><KidTasks ctx={ctx} me={me} asg={myAsg} /></div>}
        {tab === "estudio" && <div className="max-w-2xl"><KidStudy ctx={ctx} me={me} /></div>}
        {tab === "ranking" && <div className="max-w-2xl"><RankingList db={db} highlight={me.id} /></div>}
        {tab === "tienda" && <KidRewards ctx={ctx} me={me} />}
      </main>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200">
        <div className="max-w-2xl mx-auto flex">
          {nav.map(([k, label, Icon]) => {
            const on = tab === k;
            return (
              <button key={k} onClick={() => setTab(k)} className="flex-1 flex flex-col items-center gap-0.5 py-2.5" style={{ color: on ? me.color : "#94A3B8" }}>
                <Icon size={22} strokeWidth={on ? 2.4 : 2} />
                <span className="text-[10px] font-semibold">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {mercado && <Modal title="Mercado de hermanos" onClose={() => setMercado(false)}><KidMarket ctx={ctx} me={me} /></Modal>}
    </div>
  );
}
