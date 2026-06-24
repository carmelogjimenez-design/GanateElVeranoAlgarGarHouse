"use client";
import { useState } from "react";
import { Modal, Btn, Input } from "@/components/ui/atoms";
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
    if (data.session) onClose();
    else setOk("Cuenta creada. Revisa tu email para confirmarla y luego entra.");
  };

  return (
    <Modal title={mode === "login" ? "Entrar" : "Crear cuenta"} onClose={onClose}>
      <div className="flex gap-2 mb-4 bg-slate-100 p-1 rounded-xl">
        <button onClick={() => { setMode("login"); setErr(""); setOk(""); }}
          className={`flex-1 py-2 rounded-lg font-semibold text-sm transition ${mode === "login" ? "bg-white text-navy shadow-card" : "text-slate-400"}`}>Entrar</button>
        <button onClick={() => { setMode("register"); setErr(""); setOk(""); }}
          className={`flex-1 py-2 rounded-lg font-semibold text-sm transition ${mode === "register" ? "bg-white text-navy shadow-card" : "text-slate-400"}`}>Crear cuenta</button>
      </div>

      {mode === "register" && <Input placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} className="mb-2" />}
      <Input placeholder="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mb-2" />
      <Input placeholder="contraseña" type="password" value={pass} onChange={(e) => setPass(e.target.value)} className="mb-2" />

      {err && <p className="text-red-500 font-medium text-sm mb-2">{err}</p>}
      {ok && <p className="text-teal font-medium text-sm mb-2">{ok}</p>}

      <Btn variant={mode === "login" ? "dark" : "primary"} className="w-full" onClick={mode === "login" ? login : register}>
        {mode === "login" ? "Entrar" : "Crear cuenta"}
      </Btn>
      <p className="text-xs text-slate-400 text-center mt-3">Al crear cuenta entras como usuario. Los permisos de administrador los concede Tamar o Ricardo.</p>
    </Modal>
  );
}
