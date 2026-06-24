"use client";
import { useEffect } from "react";
import { confetti } from "@/lib/confetti";
import { sfx } from "@/lib/sfx";

export default function Celebration({ icon, title, subtitle, color = "#FF8A00", onClose }:
  { icon: React.ReactNode; title: string; subtitle?: string; color?: string; onClose: () => void }) {
  useEffect(() => { confetti(); sfx("level"); const t = setTimeout(onClose, 3200); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed inset-0 z-[80] bg-navy/40 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-white rounded-3xl px-8 py-10 text-center animate-pop max-w-xs w-full" onClick={(e) => e.stopPropagation()}>
        <div className="w-24 h-24 rounded-3xl mx-auto flex items-center justify-center text-white animate-bounce-in" style={{ background: color }}>{icon}</div>
        <h2 className="text-2xl font-extrabold tracking-tight text-navy mt-5">{title}</h2>
        {subtitle && <p className="text-slate-500 font-medium mt-1">{subtitle}</p>}
        <button onClick={onClose} className="mt-6 text-sm font-semibold text-brand">Continuar</button>
      </div>
    </div>
  );
}
