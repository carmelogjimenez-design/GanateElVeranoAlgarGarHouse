"use client";
import { useState, useEffect } from "react";
import { Avatar, Modal } from "@/components/ui/atoms";
import { rpc } from "@/lib/helpers";
import { sb } from "@/lib/supabase";
import { levelOf } from "@/lib/game";
import { AVATARS, badgeIcon } from "@/lib/icons";
import KidHome from "@/components/kid/KidHome";
import KidTasks from "@/components/kid/KidTasks";
import KidRewards from "@/components/kid/KidRewards";
import KidMarket from "@/components/kid/KidMarket";
import KidStudy from "@/components/kid/KidStudy";
import RankingList from "@/components/RankingList";
import Celebration from "@/components/Celebration";
import Footer from "@/components/Footer";
import TutorialKid from "@/components/kid/TutorialKid";
import type { Ctx } from "@/lib/types";
import { Home, ClipboardList, BookOpen, Trophy, ShoppingBag, Star, Bell, LogOut, Sparkles, Lock, Camera, Zap, Volume2, VolumeX } from "lucide-react";
import { isMuted, setMuted } from "@/lib/sfx";
import { dadSpeak } from "@/lib/voice";

type Celeb = { icon: React.ReactNode; title: string; subtitle?: string; color?: string };

export default function KidApp({ ctx }: { ctx: Ctx }) {
  const { db, kid, setScreen, isAdmin, refresh, flash, session, logout } = ctx;
  const exit = () => { if (isAdmin) setScreen("admin"); else if (session) logout(); else setScreen("lobby"); };
  const me = db.kids.find((k) => k.id === kid!.id) || kid!;
  const [tab, setTab] = useState("inicio");
  const [mercado, setMercado] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [celeb, setCeleb] = useState<Celeb | null>(null);
  const [tut, setTut] = useState(true);
  const [muted, setMutedState] = useState(false);
  const myAsg = db.assignments.filter((a) => a.kid_id === me.id);
  const bell = myAsg.filter((a) => a.status === "pending").length;
  const myLevel = levelOf(me.total_points);
  const now = Date.now();
  const dxp = db.events.find((e) => e.kind === "double_xp" && e.active && new Date(e.starts_at).getTime() <= now && new Date(e.ends_at).getTime() >= now);

  // Detección de subida de nivel / nueva medalla (con confeti)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const lk = `gev_lvl_${me.id}`;
    const prev = Number(localStorage.getItem(lk) || "0");
    if (prev && myLevel > prev) setCeleb({ icon: <Sparkles size={44} />, title: `¡Nivel ${myLevel}!`, subtitle: "Has subido de nivel", color: me.color });
    localStorage.setItem(lk, String(myLevel));

    const bk = `gev_badges_${me.id}`;
    const codes = db.kid_badges.filter((b) => b.kid_id === me.id).map((b) => b.badge_code);
    let prevB: string[] = [];
    try { prevB = JSON.parse(localStorage.getItem(bk) || "[]"); } catch { prevB = []; }
    const fresh = codes.filter((c) => !prevB.includes(c));
    if (prevB.length > 0 && fresh.length) {
      const b = db.badges_catalog.find((x) => x.code === fresh[0]);
      if (b) { const Icon = badgeIcon(b.icon); setCeleb((c) => c || { icon: <Icon size={44} />, title: "¡Nueva medalla!", subtitle: b.name, color: b.color }); }
    }
    localStorage.setItem(bk, JSON.stringify(codes));
  }, [me.total_points, me.id, myLevel, me.color, db.kid_badges, db.badges_catalog]);

  useEffect(() => { rpc("expire_overdue", {}).then(({ data }) => { if (data) refresh(); }); /* eslint-disable-next-line */ }, []);

  const chooseAvatar = async (key: string) => {
    const { error } = await rpc("set_avatar", { p_kid: me.id, p_pin: kid!.pin, p_avatar: key });
    if (error) flash(error.message); else { refresh(); setAvatarOpen(false); }
  };
  const uploadPhoto = async (file: File) => {
    const path = `${me.id}/${Date.now()}.jpg`;
    const { error: upErr } = await sb.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { flash("No se pudo subir la foto"); return; }
    const url = sb.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    await chooseAvatar(url);
  };

  const nav: [string, string, typeof Home][] = [["inicio", "Inicio", Home], ["tareas", "Misiones", ClipboardList]];
  if (me.study_enabled) nav.push(["estudio", "Estudio", BookOpen]);
  nav.push(["ranking", "Ranking", Trophy], ["tienda", "Tienda", ShoppingBag]);

  useEffect(() => {
    setMutedState(isMuted());
    const speak = () => { dadSpeak(); window.removeEventListener("pointerdown", speak); };
    const t = setTimeout(() => dadSpeak(), 600);
    window.addEventListener("pointerdown", speak, { once: true });
    return () => { clearTimeout(t); window.removeEventListener("pointerdown", speak); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const toggleMute = () => { const n = !muted; setMutedState(n); setMuted(n); };

  return (
    <>
      {tut && <TutorialKid kidName={me.name} onClose={() => setTut(false)} />}
    <div className="kidskin min-h-screen pb-28 relative">
      <div className="kid-canvas">
        <div className="kid-bg" />
        <span className="kid-blob" style={{ width: 360, height: 360, top: -100, right: -90, background: "#FF8A5B" }} />
        <span className="kid-blob" style={{ width: 340, height: 340, bottom: -110, left: -100, background: "#19D3AE" }} />
        <span className="kid-blob" style={{ width: 280, height: 280, top: "42%", left: "44%", background: "#FF7EB6", opacity: 0.32 }} />
      </div>
      <div className="relative z-10">
      <header className="sticky top-0 z-20" style={{ background: "rgba(255,255,255,.5)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", borderBottom: "1px solid rgba(255,255,255,.6)" }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
          <img src="/logo.png" alt="Gánate el Verano" className="w-10 h-10 rounded-xl object-contain shrink-0 gev-wiggle" />
          <div className="flex-1 min-w-0">
            <div className="font-black text-navy tracking-tight leading-none text-lg truncate">¡Hola, {me.name}!</div>
            <div className="text-xs text-navy/45 font-semibold hidden sm:block mt-0.5">Hoy es un gran día para sumar puntos</div>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-full text-white shadow-lg shrink-0" style={{ background: "linear-gradient(120deg,#FF6B5E,#FF9F45)", boxShadow: "0 8px 20px -6px rgba(255,107,94,.6)" }}>
            <Star size={15} className="fill-white" />
            <div className="font-black text-sm">{me.total_points}</div>
          </div>
          <button onClick={toggleMute} title={muted ? "Activar sonido" : "Silenciar"} className="w-9 h-9 rounded-full bg-white/60 hidden sm:flex items-center justify-center text-navy/60 active:scale-90 transition shrink-0">
            {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
          <button className="relative w-9 h-9 rounded-full bg-white/60 flex items-center justify-center text-navy/60 shrink-0">
            <Bell size={17} />{bell > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{bell}</span>}
          </button>
          <button onClick={() => setAvatarOpen(true)} title="Cambiar avatar" className="active:scale-90 transition shrink-0"><Avatar name={me.name} color={me.color} size={36} avatar={me.avatar} /></button>
          <button onClick={exit} className="w-9 h-9 rounded-full bg-white/60 flex items-center justify-center text-navy/60 active:scale-90 transition shrink-0" title="Salir"><LogOut size={16} /></button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5">
        {dxp && <div className="mb-4 rounded-xl px-3 py-2.5 text-sm font-bold text-white flex items-center gap-2" style={{ background: "linear-gradient(90deg,#FF8A00,#EAB308)" }}><Zap size={16} /> {dxp.title} · ¡x{dxp.multiplier} en tus misiones!</div>}
        {isAdmin && <div className="mb-4 bg-navy/5 border border-navy/10 rounded-xl px-3 py-2 text-xs font-semibold text-navy flex items-center justify-between"><span>🧪 Modo test (superadmin): estás viendo el panel de {me.name}</span><button onClick={() => setScreen("admin")} className="text-brand">Volver a padres</button></div>}
        {tab === "inicio" && <KidHome ctx={ctx} me={me} onTab={setTab} onMercado={() => setMercado(true)} />}
        {tab === "tareas" && <KidTasks ctx={ctx} me={me} asg={myAsg} onTab={setTab} />}
        {tab === "estudio" && <KidStudy ctx={ctx} me={me} />}
        {tab === "ranking" && <RankingList db={db} highlight={me.id} />}
        {tab === "tienda" && <KidRewards ctx={ctx} me={me} onCelebrate={() => setCeleb({ icon: <ShoppingBag size={42} />, title: "¡Canje solicitado!", subtitle: "A esperar el OK de los jefes", color: "#19D3AE" })} />}
      </main>

      <Footer />

      <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-2xl z-30 rounded-3xl" style={{ background: "rgba(255,255,255,.7)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,.8)", boxShadow: "0 14px 40px -12px rgba(255,107,94,.35)" }}>
        <div className="flex p-1.5">
          {nav.map(([k, label, Icon]) => {
            const on = tab === k;
            return (
              <button key={k} onClick={() => { setTab(k); }} className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-2xl transition active:scale-90" style={on ? { background: "linear-gradient(135deg,#FF6B5E,#FF9F45)", color: "#fff", boxShadow: "0 8px 18px -6px rgba(255,107,94,.6)" } : { color: "#0B1F3A99" }}>
                <Icon size={21} strokeWidth={on ? 2.6 : 2} /><span className="text-[10px] font-bold">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {mercado && <Modal title="Mercado de hermanos" onClose={() => setMercado(false)}><KidMarket ctx={ctx} me={me} /></Modal>}

      {avatarOpen && (
        <Modal title="Elige tu avatar" onClose={() => setAvatarOpen(false)}>
          <p className="text-sm text-slate-400 font-medium mb-3">Sube tu propia foto o elige un avatar (se desbloquean al subir de nivel). Estás en el nivel {myLevel}.</p>
          <label className="flex items-center justify-center gap-2 w-full mb-4 border-2 border-dashed border-slate-200 rounded-2xl py-3.5 text-sm font-semibold text-navy cursor-pointer hover:border-brand transition"><Camera size={18} /> Subir una foto<input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} /></label>
          <div className="grid grid-cols-4 gap-3">
            {AVATARS.map((a) => {
              const unlocked = myLevel >= a.level;
              const sel = me.avatar === a.key;
              return (
                <button key={a.key} disabled={!unlocked} onClick={() => chooseAvatar(a.key)} className="flex flex-col items-center gap-1">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${sel ? "ring-2 ring-offset-2 ring-navy" : ""}`} style={{ background: unlocked ? me.color : "#E2E8F0", color: unlocked ? "#fff" : "#94A3B8" }}>
                    {unlocked ? <a.Icon size={26} /> : <Lock size={20} />}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">{unlocked ? a.name : `Nv ${a.level}`}</span>
                </button>
              );
            })}
          </div>
        </Modal>
      )}

      {celeb && <Celebration icon={celeb.icon} title={celeb.title} subtitle={celeb.subtitle} color={celeb.color} onClose={() => setCeleb(null)} />}
      </div>
    </div>
    </>
  );
}
