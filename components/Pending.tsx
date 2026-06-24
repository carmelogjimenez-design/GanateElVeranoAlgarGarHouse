"use client";
import { useState } from "react";
import { Btn, Input } from "@/components/ui/atoms";
import { rpc } from "@/lib/helpers";
import type { Ctx } from "@/lib/types";
import { Clock, UserPlus, PartyPopper } from "lucide-react";

export default function Pending({ ctx, mode, kidName }: { ctx: Ctx; mode: "register" | "waiting"; kidName?: string }) {
  const { session, logout, refresh, flash } = ctx;
  const email = (session as { user?: { email?: string } } | null)?.user?.email || "";
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const register = async () => {
    if (!name.trim()) return flash("Escribe tu nombre");
    setBusy(true);
    const { error } = await rpc("register_kid", { p_name: name.trim() });
    setBusy(false);
    if (error) flash(error.message); else { flash("¡Listo! Tus padres te asignarán equipo."); refresh(); }
  };

  if (mode === "register") {
    return (
      <div className="max-w-md mx-auto px-6 pt-20 text-center">
        <img src="/logo.png" alt="Gánate el Verano" className="h-24 w-auto object-contain mx-auto mb-4" />
        <div className="w-14 h-14 rounded-2xl bg-teal/12 text-teal flex items-center justify-center mx-auto mb-4"><UserPlus size={26} /></div>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy">¡Bienvenido al juego!</h1>
        <p className="text-slate-500 font-medium mt-2">Te has registrado con <span className="font-bold text-navy">{email}</span>. ¿Cómo te llamas?</p>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" className="mt-5 text-center" />
        <Btn variant="primary" className="w-full mt-3" onClick={register} disabled={busy}>Entrar al juego</Btn>
        <button onClick={logout} className="text-sm font-semibold text-slate-400 mt-4">Cerrar sesión</button>
      </div>
    );
  }
  return (
    <div className="max-w-md mx-auto px-6 pt-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-brand/12 text-brand flex items-center justify-center mx-auto mb-5"><Clock size={30} /></div>
      <h1 className="text-2xl font-extrabold tracking-tight text-navy">Casi listo, {kidName} <PartyPopper size={22} className="inline -mt-1 text-brand" /></h1>
      <p className="text-slate-500 font-medium mt-3">Tus padres tienen que <span className="font-bold text-navy">autorizarte y meterte en un equipo</span>. En cuanto lo hagan, entrarás directo a tu panel.</p>
      <Btn variant="dark" className="w-full mt-6" onClick={logout}>Cerrar sesión</Btn>
    </div>
  );
}
