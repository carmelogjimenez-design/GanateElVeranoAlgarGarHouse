"use client";
import { Btn } from "@/components/ui/atoms";

export default function Pending({ email, onLogout }: { email: string; onLogout: () => void }) {
  return (
    <div className="px-6 pt-24 text-center">
      <div className="text-6xl mb-4">⏳</div>
      <h1 className="text-2xl font-black text-orange-600">Cuenta creada</h1>
      <p className="text-slate-600 font-semibold mt-3">
        Tu cuenta <span className="font-black">{email}</span> está lista, pero todavía no tienes permisos de administrador.
      </p>
      <p className="text-slate-500 mt-2 text-sm">
        Tamar o Ricardo tienen que darte acceso al panel. Vuelve a entrar en un rato.
      </p>
      <Btn c="bg-slate-800" className="w-full mt-6" onClick={onLogout}>Cerrar sesión</Btn>
    </div>
  );
}
