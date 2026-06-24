"use client";
import { useState } from "react";
import { Modal, Btn } from "@/components/ui/atoms";
import { rpc } from "@/lib/helpers";
import type { Kid } from "@/lib/types";

export default function PinModal({ kid, onClose, onOk }: { kid: Kid; onClose: () => void; onOk: (pin: string) => void }) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const check = async () => {
    const { data } = await rpc("kid_pin_ok", { p_kid: kid.id, p_pin: pin });
    if (data) onOk(pin); else setErr("PIN incorrecto. Buen intento.");
  };
  return (
    <Modal title={`${kid.emoji} ${kid.name}`} onClose={onClose}>
      <p className="text-slate-500 font-semibold mb-3 text-sm">Mete tu PIN de 4 dígitos.</p>
      <input value={pin} onChange={(e) => setPin(e.target.value)} inputMode="numeric" maxLength={4}
        className="w-full text-center text-3xl tracking-[.5em] font-black border-2 rounded-2xl py-3 mb-2" />
      {err && <p className="text-red-500 font-bold text-sm mb-2">{err}</p>}
      <Btn className="w-full" onClick={check}>Entrar</Btn>
    </Modal>
  );
}
