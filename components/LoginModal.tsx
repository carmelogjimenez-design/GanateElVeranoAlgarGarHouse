"use client";
import { useState } from "react";
import { Modal, Btn } from "@/components/ui/atoms";
import { sb } from "@/lib/supabase";

export default function LoginModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const go = async () => {
    const { error } = await sb.auth.signInWithPassword({ email, password: pass });
    if (error) setErr(error.message); else onClose();
  };
  return (
    <Modal title="👑 Panel de padres" onClose={onClose}>
      <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border-2 rounded-2xl px-4 py-3 mb-2" />
      <input placeholder="contraseña" type="password" value={pass} onChange={(e) => setPass(e.target.value)} className="w-full border-2 rounded-2xl px-4 py-3 mb-2" />
      {err && <p className="text-red-500 font-bold text-sm mb-2">{err}</p>}
      <Btn c="bg-slate-800" className="w-full" onClick={go}>Entrar</Btn>
    </Modal>
  );
}
