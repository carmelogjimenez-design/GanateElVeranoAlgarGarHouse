"use client";
import React from "react";
import type { LucideIcon } from "lucide-react";
import { LogOut } from "lucide-react";

export type NavItem = { key: string; label: string; Icon: LucideIcon };

export function AppShell({
  variant, title, subtitle, accent = "#FF8A00", brand,
  nav, active, onChange, onExit, exitLabel = "Salir", headerRight, children,
}: {
  variant: "kid" | "admin";
  title: string; subtitle?: string; accent?: string; brand?: React.ReactNode;
  nav: NavItem[]; active: string; onChange: (k: string) => void;
  onExit: () => void; exitLabel?: string; headerRight?: React.ReactNode; children: React.ReactNode;
}) {
  const dark = variant === "admin";
  const sideBg = dark ? "bg-navy text-white" : "bg-white text-navy border-r border-slate-200";

  return (
    <div className="min-h-screen md:flex">
      {/* SIDEBAR — solo desktop */}
      <aside className={`hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 ${sideBg} px-4 py-6`}>
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold"
            style={{ background: dark ? "rgba(255,255,255,.1)" : `${accent}1a`, color: accent }}>{brand || "G"}</div>
          <div className="min-w-0">
            <div className="font-extrabold tracking-tight truncate">{title}</div>
            {subtitle && <div className={`text-xs truncate ${dark ? "opacity-60" : "text-slate-400"}`}>{subtitle}</div>}
          </div>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {nav.map(({ key, label, Icon }) => {
            const on = active === key;
            const base = dark
              ? on ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
              : on ? "text-white" : "text-slate-500 hover:bg-slate-50";
            return (
              <button key={key} onClick={() => onChange(key)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition ${base}`}
                style={!dark && on ? { background: accent } : undefined}>
                <Icon size={19} strokeWidth={on ? 2.4 : 2} /> {label}
              </button>
            );
          })}
        </nav>
        <button onClick={onExit} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm ${dark ? "text-white/60 hover:bg-white/5" : "text-slate-500 hover:bg-slate-50"}`}>
          <LogOut size={18} /> {exitLabel}
        </button>
      </aside>

      {/* MAIN */}
      <div className="md:pl-64 flex-1 min-h-screen flex flex-col">
        {/* top bar — solo móvil */}
        <div className={`md:hidden sticky top-0 z-20 px-4 py-3 flex items-center justify-between ${dark ? "bg-navy text-white" : "bg-white border-b border-slate-200 text-navy"}`}>
          <div className="min-w-0">
            <div className="font-extrabold tracking-tight truncate leading-none">{title}</div>
            {subtitle && <div className={`text-[11px] truncate ${dark ? "opacity-60" : "text-slate-400"}`}>{subtitle}</div>}
          </div>
          <div className="flex items-center gap-1">
            {headerRight}
            <button onClick={onExit} className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg ${dark ? "bg-white/10" : "bg-slate-100"}`}><LogOut size={15} /> {exitLabel}</button>
          </div>
        </div>

        {headerRight && <div className="hidden md:flex justify-end items-center px-8 pt-5 text-navy">{headerRight}</div>}

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-8 py-5 pb-28 md:pb-10">{children}</main>

        {/* bottom nav — solo móvil */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200 flex">
          {nav.map(({ key, label, Icon }) => {
            const on = active === key;
            return (
              <button key={key} onClick={() => onChange(key)} className="flex-1 flex flex-col items-center gap-0.5 py-2.5"
                style={{ color: on ? accent : "#94A3B8" }}>
                <Icon size={21} strokeWidth={on ? 2.4 : 2} />
                <span className="text-[10px] font-semibold">{label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
