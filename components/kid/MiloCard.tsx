"use client";
import { useEffect, useState } from "react";
import { Card, Chip } from "@/components/ui/atoms";
import { sb } from "@/lib/supabase";
import { rpc, todayStr } from "@/lib/helpers";
import { sfx } from "@/lib/sfx";
import type { Ctx, Kid } from "@/lib/types";
import { PawPrint, Camera, Send, ChevronDown, Footprints, DoorOpen, DoorClosed } from "lucide-react";

const TIERS: [number, number][] = [[20, 1], [35, 2], [60, 3], [90, 5]];
const pointsFor = (min: number) => TIERS.reduce((acc, [m, p]) => (min >= m ? p : acc), 0);
const nextTier = (min: number) => TIERS.find(([m]) => min < m);

export default function MiloCard({ ctx, me }: { ctx: Ctx; me: Kid }) {
  const { db, flash, refresh, kid } = ctx;
  const today = todayStr();
  const walks = db.milo_walks || [];
  const todays = walks.filter((w) => w.day === today);
  const doneToday = todays.filter((w) => ["pending", "approved", "done"].includes(w.status)).length;
  const pendingReview = todays.some((w) => w.status === "pending");
  const active = walks.find((w) => w.status === "in_progress") || null;
  const activeKid = active ? db.kids.find((k) => k.id === active.kid_id) : null;

  const [busy, setBusy] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [shareFile, setShareFile] = useState<File | null>(null);
  const [done, setDone] = useState<{ mins: number; pts: number } | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);

  const elapsedMs = active ? Math.max(0, now - new Date(active.started_at).getTime()) : 0;
  const elapsedMin = Math.floor(elapsedMs / 60000);
  const clock = () => {
    const s = Math.floor(elapsedMs / 1000);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return h > 0 ? `${h}:${pad(m)}:${pad(ss)}` : `${pad(m)}:${pad(ss)}`;
  };
  const livePts = pointsFor(elapsedMin);
  const nt = nextTier(elapsedMin);

  const up = async (file: File, tag: string) => {
    const path = `milo/${me.id}/${tag}-${Date.now()}.jpg`;
    const { error } = await sb.storage.from("evidencias").upload(path, file, { upsert: true });
    if (error) { flash("No se pudo subir la foto"); return null; }
    return sb.storage.from("evidencias").getPublicUrl(path).data.publicUrl;
  };

  const start = async (file: File) => {
    setBusy(true); setDone(null);
    const url = await up(file, "salida");
    if (!url) { setBusy(false); return; }
    const { error } = await rpc("start_milo", { p_kid: me.id, p_photo: url, p_pin: kid?.pin });
    setBusy(false);
    if (error) { flash(error.message); sfx("reject"); return; }
    sfx("claim"); setShareFile(file); flash("¡En marcha! El cronómetro ya corre 🐶"); refresh();
  };

  const finish = async (file: File) => {
    if (!active) return;
    setBusy(true);
    const url = await up(file, "vuelta");
    if (!url) { setBusy(false); return; }
    const mins = Math.max(0, Math.round((Date.now() - new Date(active.started_at).getTime()) / 60000));
    const pts = pointsFor(mins);
    const { error } = await rpc("finish_milo", { p_walk: active.id, p_photo: url, p_pin: kid?.pin });
    setBusy(false);
    if (error) { flash(error.message); sfx("reject"); return; }
    sfx("complete"); setShareFile(file); setDone({ mins, pts });
    flash(pts > 0 ? `Paseo enviado (${mins} min · +${pts} pts) · lo validan los padres` : `Paseo de ${mins} min (muy corto para puntuar)`); refresh();
  };

  const shareWhatsApp = async (file: File | null) => {
    const text = done ? `🐶 Milo paseado por ${me.name} · ${done.mins} min (+${done.pts} pts)` : `🐶 ${me.name} sale a pasear a Milo`;
    const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean; share?: (d: unknown) => Promise<void> };
    try {
      if (file && nav.canShare && nav.canShare({ files: [file] }) && nav.share) {
        await nav.share({ files: [file], text });
        return;
      }
    } catch { /* usuario canceló o no soportado */ }
    window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
  };

  const PhotoBtn = ({ label, tag, onPick, variant }: { label: string; tag: string; onPick: (f: File) => void; variant: string }) => (
    <label className={`w-full font-bold rounded-xl px-4 py-3.5 text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition text-white ${busy ? "opacity-50 pointer-events-none" : ""}`} style={{ background: variant }}>
      <Camera size={18} /> {label}
      <input type="file" accept="image/*" capture="environment" hidden disabled={busy} onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])} />
    </label>
  );

  return (
    <Card className="p-4 mb-1" style={{ borderLeft: "5px solid #16A34A" }}>
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0" style={{ background: "linear-gradient(135deg,#16A34A,#19D3AE)" }}><PawPrint size={20} /></div>
        <div className="flex-1 min-w-0">
          <div className="font-black text-navy flex items-center gap-2">Sacar a Milo <Chip tone="green">especial</Chip></div>
          <div className="text-xs font-semibold text-navy/45">Obligatoria · la puede hacer cualquiera</div>
        </div>
        <div className="text-right shrink-0">
          <div className={`font-black ${doneToday >= 2 ? "text-teal" : "text-brand"}`}>{doneToday}/2</div>
          <div className="text-[10px] font-bold text-navy/40">HOY</div>
        </div>
      </div>

      <div className={`rounded-xl px-3 py-2 text-xs font-semibold mb-3 ${doneToday >= 2 ? "bg-teal/10 text-teal" : "bg-amber-50 text-amber-700"}`}>
        {doneToday >= 2 ? "¡Hecho! Milo ya ha salido 2 veces hoy. Cualquier paseo extra suma igual." : `Hay que sacarle MÍNIMO 2 veces al día para que TODOS podáis jugar. Faltan ${2 - doneToday}.`}
      </div>

      {pendingReview && (
        <div className="rounded-xl px-3 py-2 text-xs font-semibold mb-3 bg-amber-50 text-amber-700">🕒 Tienes un paseo en revisión por los padres.</div>
      )}

      <button onClick={() => setShowRules((v) => !v)} className="w-full flex items-center justify-between text-sm font-bold text-navy/70 mb-2">
        <span className="flex items-center gap-1.5"><Footprints size={15} /> ¿Cómo funciona? (léelo para no liarla)</span>
        <ChevronDown size={16} className={`transition ${showRules ? "rotate-180" : ""}`} />
      </button>
      {showRules && (
        <div className="text-xs text-navy/70 font-medium space-y-1.5 bg-white/50 rounded-xl p-3 mb-3">
          <p>1️⃣ Pulsa <b>«Salgo con Milo»</b> y haz una <b>foto al salir</b>. El cronómetro arranca solo.</p>
          <p>2️⃣ Cuando vuelvas, pulsa <b>«He vuelto»</b> y haz una <b>foto al entrar</b>. ⚠️ Son <b>DOS pulsaciones</b>: una al salir y otra al volver.</p>
          <p>3️⃣ Los puntos dependen del tiempo: <b>20 min → 1</b> · <b>35 min → 2</b> · <b>1 h → 3</b> · <b>1 h 30 → 5</b>.</p>
          <p>4️⃣ <b>Envía la foto al grupo de WhatsApp</b> de la familia. 📲 Después, <b>los padres validan</b> el paseo y se suman los puntos.</p>
        </div>
      )}

      {active ? (
        <div>
          <div className="rounded-2xl p-4 text-white text-center mb-3" style={{ background: "linear-gradient(135deg,#16A34A,#19D3AE)" }}>
            <div className="text-[11px] font-bold uppercase tracking-wider opacity-85 flex items-center justify-center gap-1.5"><DoorOpen size={14} /> Paseo en marcha{activeKid ? ` · ${activeKid.name}` : ""}</div>
            <div className="text-4xl font-black tabular-nums my-1">{clock()}</div>
            <div className="text-sm font-semibold opacity-90">
              {livePts > 0 ? `Ahora mismo: +${livePts} pts` : "Aún 0 pts"}
              {nt ? ` · aguanta a ${nt[0]} min para +${nt[1]}` : " · ¡máximo!"}
            </div>
          </div>
          <PhotoBtn label="He vuelto · foto al entrar" tag="vuelta" onPick={finish} variant="linear-gradient(135deg,#EF4444,#FF8A5B)" />
          <p className="text-[11px] text-navy/45 font-semibold text-center mt-2 flex items-center justify-center gap-1"><DoorClosed size={12} /> No olvides pulsar al volver para cerrar el paseo</p>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-4 gap-1.5 mb-3 text-center">
            {TIERS.map(([m, p]) => (
              <div key={m} className="rounded-xl bg-white/50 py-2">
                <div className="text-sm font-black text-navy">{m < 60 ? `${m}m` : m === 60 ? "1h" : "1h½"}</div>
                <div className="text-[11px] font-bold text-teal">+{p}</div>
              </div>
            ))}
          </div>
          <PhotoBtn label="Salgo con Milo · foto al salir" tag="salida" onPick={start} variant="linear-gradient(135deg,#16A34A,#19D3AE)" />
          <p className="text-[11px] text-navy/45 font-semibold text-center mt-2">Al pulsar arranca el cronómetro. Luego, al volver, púlsalo otra vez.</p>
        </div>
      )}

      {done && (
        <div className="mt-3 text-center text-sm font-bold text-teal">Enviado · {done.mins} min{done.pts > 0 ? ` · +${done.pts} pts si lo validan los padres` : " (muy corto para puntuar)"}</div>
      )}
      {shareFile && (
        <button onClick={() => shareWhatsApp(shareFile)} className="mt-2 w-full font-bold rounded-xl px-4 py-3 text-sm flex items-center justify-center gap-2 active:scale-95 transition" style={{ background: "#25D366", color: "#fff" }}>
          <Send size={16} /> Enviar foto al grupo de WhatsApp
        </button>
      )}
    </Card>
  );
}
