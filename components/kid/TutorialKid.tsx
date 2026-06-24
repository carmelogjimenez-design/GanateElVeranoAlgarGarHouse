"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ClipboardList, Star, BookOpen, Trophy, ShoppingBag, ArrowRight, X } from "lucide-react";

const STEPS = [
  { icon: ClipboardList, color: "#FF8A00", title: "Misiones", text: "Haz las tareas de casa, márcalas como hechas y gana XP. Algunas te pedirán una foto como prueba." },
  { icon: Star, color: "#EAB308", title: "XP y niveles", text: "Cada misión suma XP. Cuanta más XP, más subes de nivel y desbloqueas nuevos avatares." },
  { icon: BookOpen, color: "#3B82F6", title: "Estudio", text: "Estudia, repasa el temario y haz tests para ganar XP extra. ¡1 hora al día tiene premio!" },
  { icon: Trophy, color: "#19D3AE", title: "Ranking", text: "Compites con tus hermanos y por equipos. Sé el mejor de la semana y gánate el trono 👑." },
  { icon: ShoppingBag, color: "#A855F7", title: "Tienda y mercado", text: "Canjea tus XP por premios en la tienda, y en el mercado regala o pelea puntos con tus hermanos." },
];

export default function TutorialKid({ kidName, onClose }: { kidName: string; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [i, setI] = useState(0);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  const s = STEPS[i];
  const last = i === STEPS.length - 1;
  const Icon = s.icon;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: "rgba(10,26,48,.75)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden" style={{ background: "#ffffff", boxShadow: "0 30px 80px rgba(0,0,0,.4)" }}>
        <div className="relative p-6 text-white text-center" style={{ background: `linear-gradient(135deg,${s.color},${s.color}bb)` }}>
          <button onClick={onClose} className="absolute top-3 right-3 text-white/70 hover:text-white"><X size={20} /></button>
          {i === 0 && <div className="text-[11px] font-bold uppercase tracking-wider opacity-80 mb-2">¡Hola, {kidName}!</div>}
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white/20 flex items-center justify-center mb-3"><Icon size={30} /></div>
          <h3 className="text-xl font-black">{s.title}</h3>
        </div>
        <div className="p-6 text-center">
          <p className="text-slate-500 font-medium leading-relaxed">{s.text}</p>
          <div className="flex items-center justify-center gap-1.5 mt-5">
            {STEPS.map((_, idx) => (
              <span key={idx} className="h-1.5 rounded-full transition-all" style={{ width: idx === i ? 22 : 7, background: idx === i ? s.color : "#E2E8F0" }} />
            ))}
          </div>
          <div className="flex gap-2 mt-5">
            {i > 0 && <button onClick={() => setI(i - 1)} className="px-4 py-3 rounded-2xl font-bold text-slate-500 bg-slate-100">Atrás</button>}
            <button onClick={() => (last ? onClose() : setI(i + 1))} className="flex-1 px-4 py-3 rounded-2xl font-extrabold text-white flex items-center justify-center gap-2" style={{ background: s.color }}>
              {last ? "¡A jugar!" : "Siguiente"} {!last && <ArrowRight size={18} />}
            </button>
          </div>
          {!last && <button onClick={onClose} className="text-xs font-semibold text-slate-400 mt-3">Saltar tutorial</button>}
        </div>
      </div>
    </div>,
    document.body
  );
}
