"use client";
import React, { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { LogOut, MoreHorizontal } from "lucide-react";
import Footer from "@/components/Footer";

export type NavItem = { key: string; label: string; Icon: LucideIcon };

const CORAL = "linear-gradient(135deg,#FF6B5E,#FF9F45)";

export function AppShell({
  variant, title, subtitle, accent = "#FF6B5E", brand,
  nav, active, onChange, onExit, exitLabel = "Salir", headerRight, children,
}: {
  variant: "kid" | "admin";
  title: string; subtitle?: string; accent?: string; brand?: React.ReactNode;
  nav: NavItem[]; active: string; onChange: (k: string) => void;
  onExit: () => void; exitLabel?: string; headerRight?: React.ReactNode; children: React.ReactNode;
}) {
  const warm = variant === "admin";
  const [moreOpen, setMoreOpen] = useState(false);
  const MAXBOTTOM = 4;
  const primary = nav.slice(0, MAXBOTTOM);
  const rest = nav.slice(MAXBOTTOM);
  const restActive = rest.some((n) => n.key === active);

  if (!warm) {
    return (
      <div className="min-h-screen md:flex">
        <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-white text-navy border-r border-slate-200 px-4 py-6">
          <div className="flex items-center gap-3 px-2 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold" style={{ background: `${accent}1a`, color: accent }}>{brand || "G"}</div>
            <div className="min-w-0"><div className="font-extrabold tracking-tight truncate">{title}</div>{subtitle && <div className="text-xs truncate text-slate-400">{subtitle}</div>}</div>
          </div>
          <nav className="flex flex-col gap-1 flex-1">
            {nav.map(({ key, label, Icon }) => {
              const on = active === key;
              return <button key={key} onClick={() => onChange(key)} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition ${on ? "text-white" : "text-slate-500 hover:bg-slate-50"}`} style={on ? { background: accent } : undefined}><Icon size={19} /> {label}</button>;
            })}
          </nav>
          <button onClick={onExit} className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm text-slate-500 hover:bg-slate-50"><LogOut size={18} /> {exitLabel}</button>
        </aside>
        <div className="md:pl-64 flex-1 min-h-screen flex flex-col">
          <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-8 py-5 pb-28 md:pb-10">{children}<Footer /></main>
        </div>
      </div>
    );
  }

  return (
    <div className="adminskin min-h-screen md:flex relative">
      <div className="kid-canvas">
        <div className="kid-bg" />
        <span className="kid-blob" style={{ width: 380, height: 380, top: -110, right: -100, background: "#FF8A5B" }} />
        <span className="kid-blob" style={{ width: 360, height: 360, bottom: -120, left: -110, background: "#19D3AE" }} />
        <span className="kid-blob" style={{ width: 300, height: 300, top: "40%", left: "52%", background: "#FF7EB6", opacity: 0.28 }} />
      </div>

      <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 z-30 px-4 py-6 text-navy"
        style={{ background: "rgba(255,255,255,.55)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", borderRight: "1px solid rgba(255,255,255,.6)" }}>
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center font-extrabold shrink-0" style={{ background: "rgba(255,107,94,.12)", color: accent }}>{brand || "G"}</div>
          <div className="min-w-0">
            <div className="font-black tracking-tight truncate">{title}</div>
            {subtitle && <div className="text-xs truncate text-navy/45 font-semibold">{subtitle}</div>}
          </div>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {nav.map(({ key, label, Icon }) => {
            const on = active === key;
            return (
              <button key={key} onClick={() => onChange(key)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl font-bold text-sm transition ${on ? "text-white" : "text-navy/55 hover:text-navy hover:bg-white/45"}`}
                style={on ? { background: CORAL, boxShadow: "0 8px 18px -6px rgba(255,107,94,.5)" } : undefined}>
                <Icon size={19} strokeWidth={on ? 2.6 : 2} /> {label}
              </button>
            );
          })}
        </nav>
        <button onClick={onExit} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl font-bold text-sm text-navy/55 hover:text-navy hover:bg-white/45 transition"><LogOut size={18} /> {exitLabel}</button>
      </aside>

      <div className="md:pl-64 flex-1 min-h-screen flex flex-col relative z-10">
        <div className="md:hidden sticky top-0 z-20 px-4 py-3 flex items-center justify-between text-navy"
          style={{ background: "rgba(255,255,255,.5)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", borderBottom: "1px solid rgba(255,255,255,.6)" }}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shrink-0" style={{ background: "rgba(255,107,94,.12)", color: accent }}>{brand || "G"}</div>
            <div className="min-w-0">
              <div className="font-black tracking-tight truncate leading-none">{title}</div>
              {subtitle && <div className="text-[11px] truncate text-navy/45 font-semibold">{subtitle}</div>}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {headerRight}
            <button onClick={onExit} className="flex items-center justify-center text-sm font-bold w-9 h-9 rounded-full bg-white/60 text-navy/70 active:scale-90 transition"><LogOut size={15} /></button>
          </div>
        </div>

        {headerRight && <div className="hidden md:flex justify-end items-center px-8 pt-5 text-navy">{headerRight}</div>}

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-8 py-5 pb-28 md:pb-10">{children}<Footer /></main>

        {moreOpen && (
          <div className="md:hidden fixed inset-0 z-30" onClick={() => setMoreOpen(false)}>
            <div className="absolute bottom-[88px] inset-x-3 rounded-3xl p-2 grid grid-cols-2 gap-1.5"
              style={{ background: "rgba(255,255,255,.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,.8)", boxShadow: "0 20px 50px -16px rgba(13,31,58,.3)" }}
              onClick={(e) => e.stopPropagation()}>
              {rest.map(({ key, label, Icon }) => {
                const on = active === key;
                return (
                  <button key={key} onClick={() => { onChange(key); setMoreOpen(false); }}
                    className="flex items-center gap-2 px-3 py-3 rounded-2xl font-bold text-sm"
                    style={on ? { background: CORAL, color: "#fff" } : { color: "#0B1F3A99" }}>
                    <Icon size={18} strokeWidth={on ? 2.6 : 2} /> {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <nav className="md:hidden fixed bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-md z-30 rounded-3xl"
          style={{ background: "rgba(255,255,255,.7)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,.8)", boxShadow: "0 14px 40px -12px rgba(255,107,94,.35)" }}>
          <div className="flex p-1.5">
            {primary.map(({ key, label, Icon }) => {
              const on = active === key;
              return (
                <button key={key} onClick={() => { onChange(key); setMoreOpen(false); }} className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-2xl transition active:scale-90 min-w-0"
                  style={on ? { background: CORAL, color: "#fff", boxShadow: "0 8px 18px -6px rgba(255,107,94,.6)" } : { color: "#0B1F3A99" }}>
                  <Icon size={21} strokeWidth={on ? 2.6 : 2} />
                  <span className="text-[10px] font-bold truncate max-w-full px-0.5">{label}</span>
                </button>
              );
            })}
            {rest.length > 0 && (
              <button onClick={() => setMoreOpen((v) => !v)} className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-2xl transition active:scale-90"
                style={(restActive || moreOpen) ? { background: CORAL, color: "#fff", boxShadow: "0 8px 18px -6px rgba(255,107,94,.6)" } : { color: "#0B1F3A99" }}>
                <MoreHorizontal size={21} />
                <span className="text-[10px] font-bold">Más</span>
              </button>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}
