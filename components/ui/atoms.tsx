"use client";
import React from "react";
import { initials } from "@/lib/game";
import { avatarIcon } from "@/lib/icons";

/* ---------- Card ---------- */
export const Card = ({ children, className = "", onClick, style }:
  { children: React.ReactNode; className?: string; onClick?: () => void; style?: React.CSSProperties }) => (
  <div onClick={onClick} style={style} className={`bg-white border border-slate-200 rounded-2xl shadow-card ${onClick ? "cursor-pointer active:scale-[.99] transition" : ""} ${className}`}>{children}</div>
);

/* ---------- Button ---------- */
type Variant = "primary" | "dark" | "teal" | "ghost" | "danger" | "muted";
const VARIANT: Record<Variant, string> = {
  primary: "bg-brand text-white",
  dark: "bg-navy text-white",
  teal: "bg-teal text-white",
  ghost: "bg-slate-100 text-navy",
  danger: "bg-red-500 text-white",
  muted: "bg-slate-200 text-slate-500",
};
export const Btn = ({ children, onClick, variant = "primary", className = "" }:
  { children: React.ReactNode; onClick?: () => void; variant?: Variant; className?: string }) => (
  <button onClick={onClick} className={`${VARIANT[variant]} font-semibold rounded-xl px-4 py-3 text-[15px] active:scale-95 transition ${className}`}>{children}</button>
);

/* ---------- Chip / Pill ---------- */
export const Chip = ({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "brand" | "teal" | "navy" | "green" | "amber" | "red" }) => {
  const map: Record<string, string> = {
    slate: "bg-slate-100 text-slate-600", brand: "bg-orange-50 text-brand", teal: "bg-teal-50 text-teal",
    navy: "bg-navy/10 text-navy", green: "bg-green-50 text-green-600", amber: "bg-amber-50 text-amber-600", red: "bg-red-50 text-red-500",
  };
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${map[tone]}`}>{children}</span>;
};

/* ---------- Progress bar (thin, flat) ---------- */
export const Bar = ({ v, max, c = "#FF8A00" }: { v: number; max: number; c?: string }) => (
  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
    <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${max ? Math.min(100, (v / max) * 100) : 0}%`, background: c }} />
  </div>
);

/* ---------- Avatar (icono desbloqueable o monograma) ---------- */
export const Avatar = ({ name, color, size = 40, avatar }: { name: string; color: string; size?: number; avatar?: string }) => {
  const Icon = avatar ? avatarIcon(avatar) : null;
  return (
    <div style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
      className="rounded-2xl flex items-center justify-center text-white font-bold shrink-0">
      {Icon ? <Icon size={size * 0.55} /> : initials(name)}
    </div>
  );
};

/* ---------- Ring (progreso circular) ---------- */
export const Ring = ({ value, size = 132, stroke = 11, color = "#FF8A00", track = "rgba(255,255,255,.18)", children }:
  { value: number; size?: number; stroke?: number; color?: string; track?: string; children?: React.ReactNode }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - Math.min(1, Math.max(0, value)) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} style={{ transition: "stroke-dashoffset .7s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
};

/* ---------- Section header ---------- */
export const Section = ({ title, right, children }:
  { title: string; right?: React.ReactNode; children: React.ReactNode }) => (
  <div>
    <div className="flex items-center justify-between mb-2.5 px-0.5">
      <h3 className="font-bold text-navy tracking-tight">{title}</h3>{right}
    </div>
    <div className="space-y-2.5">{children}</div>
  </div>
);

/* ---------- Icon tile ---------- */
export const IconTile = ({ children, color = "#0B1F3A", soft = true }:
  { children: React.ReactNode; color?: string; soft?: boolean }) => (
  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
    style={{ background: soft ? `${color}14` : color, color: soft ? color : "#fff" }}>{children}</div>
);

/* ---------- Modal ---------- */
export function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 bg-navy/30 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-3" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-3xl p-5 max-h-[88vh] overflow-y-auto animate-pop" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-navy tracking-tight">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------- Input ---------- */
export const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-[15px] outline-none focus:border-brand focus:bg-white transition ${props.className || ""}`} />
);

/* ---------- Stat (KPI) ---------- */
export const Stat = ({ label, value, accent = "#FF8A00", icon }:
  { label: string; value: React.ReactNode; accent?: string; icon?: React.ReactNode }) => (
  <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-4">
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-slate-400">{label}</span>
      {icon && <span style={{ color: accent }}>{icon}</span>}
    </div>
    <div className="text-2xl font-extrabold text-navy tracking-tight mt-1">{value}</div>
  </div>
);
