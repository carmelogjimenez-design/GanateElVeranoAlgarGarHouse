"use client";
import { useState } from "react";
import { Modal, Btn } from "@/components/ui/atoms";
import { sb } from "@/lib/supabase";

export default function LoginModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const login = async () => {
    setErr(""); setOk("");
    const { error } = await sb.auth.signInWithPassword({ email, password: pass });
    if (error) setErr(error.message); else onClose();
  };
  const register = async () => {
    setErr(""); setOk("");
    if (pass.length < 6) { setErr("La contraseña debe tener al menos 6 caracteres."); return; }
    const { data, error } = await sb.auth.signUp({ email, password: pass, options: { data: { name } } });
    if (error) { setErr(error.message); return; }
    if (data.session) onClose();                       // sesión directa (confirmación de email desactivada)
    else setOk("Cuenta creada. Revisa tu email para confirmarla y luego entra.");
  };

  return (
    <Modal title={mode === "login" ? "🔑 Entrar" : "✨ Crear cuenta"} onClose={onClose}>
      <div className="flex gap-2 mb-4">
        <button onClick={() => { setMode("login"); setErr(""); setOk(""); }}
          className={`flex-1 py-2 rounded-2xl font-bold text-sm ${mode === "login" ? "bg-slate-800 text-white" : "bg-slate-100"}`}>Entrar</button>
        <button onClick={() => { setMode("register"); setErr(""); setOk(""); }}
          className={`flex-1 py-2 rounded-2xl font-bold text-sm ${mode === "register" ? "bg-slate-800 text-white" : "bg-slate-100"}`}>Crear cuenta</button>
      </div>

      {mode === "register" && (
        <input placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} className="w-full border-2 rounded-2xl px-4 py-3 mb-2" />
      )}
      <input placeholder="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border-2 rounded-2xl px-4 py-3 mb-2" />
      <input placeholder="contraseña" type="password" value={pass} onChange={(e) => setPass(e.target.value)} className="w-full border-2 rounded-2xl px-4 py-3 mb-2" />

      {err && <p className="text-red-500 font-bold text-sm mb-2">{err}</p>}
      {ok && <p className="text-green-600 font-bold text-sm mb-2">{ok}</p>}

      {mode === "login"
        ? <Btn c="bg-slate-800" className="w-full" onClick={login}>Entrar</Btn>
        : <Btn c="bg-orange-500" className="w-full" onClick={register}>Crear cuenta</Btn>}

      <p className="text-xs text-slate-400 text-center mt-3">
        Al crear cuenta entras como usuario. Los permisos de administrador los concede Tamar o Ricardo.
      </p>
    </Modal>
  );
}
