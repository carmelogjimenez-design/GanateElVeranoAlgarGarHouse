"use client";
import { useState } from "react";
import { Card, Btn, Modal, Input, Avatar } from "@/components/ui/atoms";
import { sb } from "@/lib/supabase";
import { levelOf } from "@/lib/game";
import type { Ctx, Kid } from "@/lib/types";
import { UserPlus, FlagTriangleRight, Trash2 } from "lucide-react";

const SWATCHES = ["#FF8A00", "#19D3AE", "#3B82F6", "#A855F7", "#EC4899", "#22C55E", "#EAB308", "#EF4444", "#06B6D4", "#8B5CF6"];

function KidEditModal({ ctx, kid, onClose }: { ctx: Ctx; kid: Kid; onClose: () => void }) {
  const { db, refresh, flash } = ctx;
  const [f, setF] = useState({ name: kid.name, pin: "", color: kid.color, team_id: kid.team_id || "" });
  const [subj, setSubj] = useState({ name: "Matemáticas", level: "ESO" });
  const mySubj = db.subjects.filter((s) => s.kid_id === kid.id);
  const save = async () => {
    const patch: Record<string, unknown> = { name: f.name, color: f.color, team_id: f.team_id || null };
    if (f.pin && f.pin.length === 4) patch.pin = f.pin;
    await sb.from("kids").update(patch).eq("id", kid.id); flash("Guardado"); refresh(); onClose();
  };
  const addSubj = async () => { await sb.from("subjects").insert({ kid_id: kid.id, ...subj }); refresh(); };
  return (
    <Modal title={`Editar ${kid.name}`} onClose={onClose}>
      <div className="flex items-center gap-3 mb-3"><Avatar name={f.name} color={f.color} size={48} /><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
      <label className="text-sm font-semibold text-navy">Color</label>
      <div className="flex flex-wrap gap-2 mt-1.5 mb-3">
        {SWATCHES.map((c) => <button key={c} onClick={() => setF({ ...f, color: c })} style={{ background: c }} className={`w-8 h-8 rounded-lg ${f.color === c ? "ring-2 ring-offset-2 ring-navy" : ""}`} />)}
      </div>
      <label className="text-sm font-semibold text-navy">PIN nuevo (4 dígitos · vacío = no cambiar)</label>
      <Input value={f.pin} maxLength={4} inputMode="numeric" placeholder="••••" onChange={(e) => setF({ ...f, pin: e.target.value })} className="mt-1.5 mb-3" />
      <label className="text-sm font-semibold text-navy">Equipo</label>
      <select value={f.team_id} onChange={(e) => setF({ ...f, team_id: e.target.value })} className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-[15px] mt-1.5 mb-4">
        <option value="">Sin equipo</option>{db.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      <Btn variant="primary" className="w-full" onClick={save}>Guardar</Btn>

      {kid.study_enabled && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <h4 className="font-bold text-navy mb-2">Asignaturas</h4>
          {mySubj.map((s) => (
            <div key={s.id} className="flex justify-between items-center text-sm py-1.5">
              <span className="font-medium text-navy">{s.name} · <span className="text-slate-400">{s.level}</span></span>
              <button onClick={async () => { await sb.from("subjects").delete().eq("id", s.id); refresh(); }} className="text-slate-300 hover:text-red-400"><Trash2 size={15} /></button>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <Input value={subj.name} onChange={(e) => setSubj({ ...subj, name: e.target.value })} placeholder="Asignatura" />
            <select value={subj.level} onChange={(e) => setSubj({ ...subj, level: e.target.value })} className="border border-slate-200 bg-slate-50 rounded-xl px-2 text-sm">
              {["Primaria", "1º ESO", "2º ESO", "3º ESO", "4º ESO", "Bachillerato"].map((x) => <option key={x}>{x}</option>)}
            </select>
            <Btn variant="dark" className="px-4" onClick={addSubj}>+</Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function AdminKids({ ctx }: { ctx: Ctx }) {
  const { db, refresh, flash } = ctx;
  const [edit, setEdit] = useState<Kid | null>(null);
  const addTeam = async () => { const n = prompt("Nombre del equipo:"); if (n) { await sb.from("teams").insert({ name: n }); refresh(); } };
  const addKid = async () => { const n = prompt("Nombre del hijo:"); if (n) { await sb.from("kids").insert({ name: n, pin: "1111", color: SWATCHES[Math.floor(Math.random() * SWATCHES.length)] }); flash("Creado con PIN 1111"); refresh(); } };
  return (
    <div className="pb-6">
      <div className="flex gap-2 mb-4">
        <Btn variant="primary" className="flex-1 flex items-center justify-center gap-1.5" onClick={addKid}><UserPlus size={17} /> Hijo</Btn>
        <Btn variant="dark" className="flex-1 flex items-center justify-center gap-1.5" onClick={addTeam}><FlagTriangleRight size={17} /> Equipo</Btn>
      </div>
      <div className="space-y-2.5">
        {db.kids.map((k) => {
          const team = db.teams.find((t) => t.id === k.team_id);
          return (
            <Card key={k.id} className="p-3.5">
              <div className="flex items-center gap-3">
                <Avatar name={k.name} color={k.color} size={42} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-navy">{k.name}</div>
                  <div className="text-xs text-slate-400">Nv {levelOf(k.total_points)} · {k.total_points} XP · {team?.name || "sin equipo"}</div>
                </div>
                <button onClick={() => setEdit(k)} className="text-brand font-semibold text-sm">Editar</button>
              </div>
              <label className="flex items-center gap-2 mt-3 text-sm font-medium text-navy">
                <input type="checkbox" checked={k.study_enabled} onChange={async (e) => { await sb.from("kids").update({ study_enabled: e.target.checked }).eq("id", k.id); refresh(); }} className="accent-teal w-4 h-4" />
                Módulo de estudio activado
              </label>
            </Card>
          );
        })}
      </div>
      {edit && <KidEditModal ctx={ctx} kid={edit} onClose={() => setEdit(null)} />}
    </div>
  );
}
