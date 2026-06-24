"use client";
import { useState } from "react";
import { Card, Btn, Modal, Input, Chip, IconTile } from "@/components/ui/atoms";
import { sb } from "@/lib/supabase";
import { todayStr } from "@/lib/helpers";
import { missionIcon } from "@/lib/icons";
import type { Ctx, Task } from "@/lib/types";
import { Plus, Trash2 } from "lucide-react";

function AssignModal({ ctx, task, onClose }: { ctx: Ctx; task: Task; onClose: () => void }) {
  const { db, refresh, flash } = ctx;
  const [sel, setSel] = useState<string[]>([]);
  const [due, setDue] = useState(todayStr());
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const assign = async () => {
    const rows = sel.map((kid_id) => ({
      task_id: task.id, kid_id, title: task.title, points: task.points,
      photo_required: task.photo_required, due_date: due, team_id: db.kids.find((k) => k.id === kid_id)?.team_id ?? null,
    }));
    const { error } = await sb.from("assignments").insert(rows);
    flash(error ? error.message : `Asignada a ${rows.length} hijo(s)`);
    if (!error) { refresh(); onClose(); }
  };
  return (
    <Modal title={`Asignar: ${task.title}`} onClose={onClose}>
      <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="mb-3" />
      <div className="flex flex-wrap gap-2 mb-3">
        {db.teams.map((t) => (
          <button key={t.id} onClick={() => { const ids = db.kids.filter((k) => k.team_id === t.id).map((k) => k.id); setSel((s) => [...new Set([...s, ...ids])]); }}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-white" style={{ background: t.color }}>+ {t.name}</button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {db.kids.map((k) => (
          <button key={k.id} onClick={() => toggle(k.id)}
            className={`rounded-xl p-2 text-sm font-semibold border ${sel.includes(k.id) ? "border-brand bg-orange-50 text-navy" : "border-slate-200 bg-slate-50 text-slate-500"}`}>{k.name}</button>
        ))}
      </div>
      <Btn variant="primary" className="w-full" onClick={() => sel.length && assign()}>Asignar a {sel.length}</Btn>
    </Modal>
  );
}

export default function AdminTasks({ ctx }: { ctx: Ctx }) {
  const { db, refresh, flash } = ctx;
  const [f, setF] = useState({ title: "", description: "", points: 20, difficulty: "media", frequency: "diaria" });
  const [asgTask, setAsgTask] = useState<Task | null>(null);
  const create = async () => {
    if (!f.title) return;
    const { error } = await sb.from("tasks").insert(f);
    flash(error ? error.message : "Misión creada");
    if (!error) { setF({ ...f, title: "", description: "" }); refresh(); }
  };
  return (
    <div className="pb-6">
      <Card className="p-4 space-y-2.5 mb-4">
        <h3 className="font-bold text-navy tracking-tight">Nueva misión</h3>
        <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Título (ej. Conquista la cocina)" />
        <Input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Descripción" />
        <div className="flex gap-2">
          <Input type="number" value={f.points} onChange={(e) => setF({ ...f, points: +e.target.value })} className="w-24" placeholder="XP" />
          <select value={f.difficulty} onChange={(e) => setF({ ...f, difficulty: e.target.value })} className="flex-1 border border-slate-200 bg-slate-50 rounded-xl px-2 py-3 text-[15px]">
            <option value="facil">Fácil</option><option value="media">Media</option><option value="dificil">Difícil</option>
          </select>
          <select value={f.frequency} onChange={(e) => setF({ ...f, frequency: e.target.value })} className="flex-1 border border-slate-200 bg-slate-50 rounded-xl px-2 py-3 text-[15px]">
            {["diaria", "2/semana", "semanal", "quincenal", "mensual", "personalizada"].map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>
        <Btn variant="primary" className="w-full flex items-center justify-center gap-1.5" onClick={create}><Plus size={17} /> Crear misión</Btn>
      </Card>
      <h3 className="font-bold text-navy tracking-tight px-0.5 mb-2">Misiones ({db.tasks.length})</h3>
      <div className="space-y-2.5">
        {db.tasks.map((t) => {
          const Icon = missionIcon(t.title);
          return (
            <Card key={t.id} className="p-3.5 flex items-center gap-3">
              <IconTile color="#0B1F3A"><Icon size={18} /></IconTile>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-navy truncate">{t.title}</div>
                <div className="text-xs text-slate-400">{t.frequency} · {t.difficulty}</div>
              </div>
              <Chip tone="brand">+{t.points} XP</Chip>
              <Btn variant="primary" className="text-sm px-3 py-2" onClick={() => setAsgTask(t)}>Asignar</Btn>
              <button onClick={async () => { await sb.from("tasks").delete().eq("id", t.id); refresh(); }} className="text-slate-300 hover:text-red-400 px-1"><Trash2 size={17} /></button>
            </Card>
          );
        })}
      </div>
      {asgTask && <AssignModal ctx={ctx} task={asgTask} onClose={() => setAsgTask(null)} />}
    </div>
  );
}
