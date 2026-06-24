"use client";
import { useState, useEffect } from "react";
import { sb } from "@/lib/supabase";
import { loadAll } from "@/lib/helpers";
import type { DB, Kid, Ctx, Screen } from "@/lib/types";
import Lobby from "@/components/Lobby";
import PinModal from "@/components/PinModal";
import LoginModal from "@/components/LoginModal";
import KidApp from "@/components/kid/KidApp";
import AdminApp from "@/components/admin/AdminApp";

export default function Page() {
  const [screen, setScreen] = useState<Screen>("lobby");
  const [db, setDb] = useState<DB | null>(null);
  const [session, setSession] = useState<unknown>(null);
  const [kid, setKid] = useState<Kid | null>(null);
  const [pinModal, setPinModal] = useState<Kid | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [toast, setToast] = useState("");

  const refresh = async () => setDb(await loadAll());
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2600); };

  useEffect(() => {
    refresh();
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  useEffect(() => { if (session) setScreen("admin"); }, [session]);

  if (!db) return <div className="p-10 text-center text-2xl">Cargando el cuartel general… 🏠</div>;

  const ctx: Ctx = {
    db, refresh, flash, setScreen, setKid, kid, session,
    logout: async () => { await sb.auth.signOut(); setSession(null); setScreen("lobby"); },
  };

  return (
    <div className="max-w-md mx-auto min-h-screen pb-10">
      {screen === "lobby" && <Lobby ctx={ctx} onKid={(k) => setPinModal(k)} onLogin={() => setLoginOpen(true)} />}
      {screen === "kid" && kid && <KidApp ctx={ctx} />}
      {screen === "admin" && <AdminApp ctx={ctx} />}

      {pinModal && (
        <PinModal kid={pinModal} onClose={() => setPinModal(null)}
          onOk={(p) => { setKid({ ...pinModal, pin: p }); setPinModal(null); setScreen("kid"); }} />
      )}
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}

      {toast && (
        <div className="fixed bottom-5 inset-x-0 flex justify-center z-50 px-4">
          <div className="bg-slate-900 text-white font-bold px-4 py-3 rounded-2xl shadow-xl text-center">{toast}</div>
        </div>
      )}
    </div>
  );
}
