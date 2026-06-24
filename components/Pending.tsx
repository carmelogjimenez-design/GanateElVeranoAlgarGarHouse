"use client";
import { Btn } from "@/components/ui/atoms";
import { Clock } from "lucide-react";

export default function Pending({ email, onLogout }: { email: string; onLogout: () => void }) {
  return (
    <div className="max-w-md mx-auto px-6 pt-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-brand/12 text-brand flex items-center justify-center mx-auto mb-5"><Clock size={30} /></div>
      <h1 className="text-2xl font-extrabold tracking-tight text-navy">Cuenta creada</h1>
      <p className="text-slate-500 font-medium mt-3">Tu cuenta <span className="font-bold text-navy">{email}</span> está lista, pero aún no tienes permisos de administrador.</p>
      <p className="text-slate-400 mt-2 text-sm">Tamar o Ricardo tienen que darte acceso al panel. Vuelve a entrar en un rato.</p>
      <Btn variant="dark" className="w-full mt-6" onClick={onLogout}>Cerrar sesión</Btn>
    </div>
  );
}
