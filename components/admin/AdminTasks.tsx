"use client";
import { useState } from "react";
import { Btn, Modal } from "@/components/ui/atoms";
import { sb } from "@/lib/supabase";
import { todayStr } from "@/lib/helpers";
import type { Ctx, Task } from "@/lib/types";

function AssignModal({ ctx, task, onClose }: { ctx: Ctx; task: Task; onClose: () => void }) {
  const { db, refresh, flash } = ctx;
  const [sel, setSel] = useState<string[]>([]);
  const [due, setDue] = useState(todayStr());
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const assign = async () => {
    const rows = sel.map((kid_id) => ({
      task_id: task.id, kid_id, title: task.title, points: task.points,
      photo_required: task.photo_required, due_date: due,
      team_id: db.kids.find((k) => k.id === kid_id)?.team_id ?? null,
    }));
    const { error } = await sb.from("assignments").insert(rows);
    flash(error ? error.message : `Asignada a ${rows.length} hijo(s)`);
    if (!error) { refresh(); onClose(); }
  };
  return (
    <Modal title={`Asignar: ${task.title}`} onClose={onClose}>
      <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="w-full border-2 rounded-2xl px-3 py-2.5 mb-3" />
      <div className="flex flex-wrap gap-2 mb-3">
        {db.teams.map((t) => (
          <button key={t.id} onClick={() => {
            const ids = db.kids.filter((k) => k.team_id === t.id).map((k) => k.id);
            setSel((s) => [...new Set([...s, ...ids])]);
          }} className="text-xs font-bold px-2 py-1 rounded-full text-white" style={{ background: t.color }}>+ {t.name}</button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {db.kids.map((k) => (
          <button key={k.id} onClick={() => toggle(k.id)}
            className={`rounded-2xl p-2 text-sm font-bold border-2 ${sel.includes(k.id) ? "border-orange-500 bg-orange-50" : "border-transparent bg-slate-100"}`}>
            {k.emoji} {k.name}
          </button>
        ))}
      </div>
      <Btn className="w-full" onClick={() => sel.length && assign()}>Asignar a {sel.length}</Btn>
    </Modal>
  );
}

export default function AdminTasks({ ctx }: { ctx: Ctx }) {
  const { db, refresh, flash } = ctx;
  const [f, setF] = useState({ title: "", description: "", points: 3, difficulty: "media", frequency: "diaria" });
  const [asgTask, setAsgTask] = useState<Task | null>(null);
  const create = async () => {
    if (!f.title) return;
    const { error } = await sb.from("tasks").insert(f);
    flash(error ? error.message : "Tarea creada");
    if (!error) { setF({ ...f, title: "", description: "" }); refresh(); }
  };
  return (
    <div className="pb-6">
      <div className="bg-white rounded-3xl p-4 shadow-sm space-y-2">
        <h3 className="font-black">Nueva tarea</h3>
        <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Título" className="w-full border-2 rounded-2xl px-3 py-2.5" />
        <input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Descripción / pulla" className="w-full border-2 rounded-2xl px-3 py-2.5" />
        <div className="flex gap-2">
          <input type="number" value={f.points} onChange={(e) => setF({ ...f, points: +e.target.value })} className="w-20 border-2 rounded-2xl px-3 py-2.5" placeholder="pts" />
          <select value={f.difficulty} onChange={(e) => setF({ ...f, difficulty: e.target.value })} className="flex-1 border-2 rounded-2xl px-2 py-2.5">
            <option value="facil">Fácil</option><option value="media">Media</option><option value="dificil">Difícil</option>
          </select>
          <select value={f.frequency} onChange={(e) => setF({ ...f, frequency: e.target.value })} className="flex-1 border-2 rounded-2xl px-2 py-2.5">
            {["diaria", "2/semana", "semanal", "quincenal", "mensual", "personalizada"].map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>
        <Btn className="w-full" onClick={create}>Crear tarea</Btn>
      </div>
      <h3 className="font-black mt-4 mb-2">Tareas ({db.tasks.length})</h3>
      {db.tasks.map((t) => (
        <div key={t.id} className="bg-white rounded-3xl p-3 mb-2 flex justify-between items-center shadow-sm">
          <div><div className="font-bold">{t.title}</div><div className="text-xs text-slate-500">{t.frequency} · {t.points} pts · {t.difficulty}</div></div>
          <div className="flex gap-2">
            <Btn c="bg-orange-500" className="text-sm px-3 py-2" onClick={() => setAsgTask(t)}>Asignar</Btn>
            <button onClick={async () => { await sb.from("tasks").delete().eq("id", t.id); refresh(); }} className="text-red-400 font-black px-2">🗑</button>
          </div>
        </div>
      ))}
      {asgTask && <AssignModal ctx={ctx} task={asgTask} onClose={() => setAsgTask(null)} />}
    </div>
  );
}
