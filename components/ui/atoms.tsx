"use client";
import React from "react";

export const Chip = ({ children, c = "#6366f1" }: { children: React.ReactNode; c?: string }) => (
  <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ background: c }}>{children}</span>
);

export const Bar = ({ v, max, c = "#fb923c" }: { v: number; max: number; c?: string }) => (
  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
    <div className="h-3 rounded-full transition-all" style={{ width: `${max ? Math.min(100, (v / max) * 100) : 0}%`, background: c }} />
  </div>
);

export const Btn = ({ children, onClick, c = "bg-orange-500", className = "" }:
  { children: React.ReactNode; onClick?: () => void; c?: string; className?: string }) => (
  <button onClick={onClick} className={`${c} text-white font-extrabold rounded-2xl px-4 py-3 active:scale-95 transition ${className}`}>{children}</button>
);

export const Section = ({ t, children }: { t: string; children: React.ReactNode }) => (
  <div><h3 className="font-black mb-2">{t}</h3><div className="space-y-3">{children}</div></div>
);

export function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-3" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-3xl p-5 max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-black text-xl">{title}</h3>
          <button onClick={onClose} className="text-2xl leading-none text-slate-400">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
