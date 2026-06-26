"use client";
import { useState, useMemo } from "react";
import { Card, Btn, Modal, Input, Chip } from "@/components/ui/atoms";
import { sb } from "@/lib/supabase";
import { rpc, todayStr } from "@/lib/helpers";
import { missionIcon, freqColor, FREQ_META } from "@/lib/icons";
import type { Ctx, Task } from "@/lib/types";
import { Plus, Trash2, Repeat, CalendarClock, Clock, Search, ChevronDown, Target, Layers, Sparkles, X } from "lucide-react";

function AssignModal({ ctx, task, onClose }: { ctx: Ctx; task: Task; onClose: () => void }) {
  const { db, refresh, flash } = ctx;
  const [sel, setSel] = useState<string[]>([]);
  const [due, setDue] = useState(todayStr());
  const [grupal, setGrupal] = useState(false);
  const [team, setTeam] = useState("");
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const assign = async () => {
    if (grupal) {
      const members = db.kids.filter((k) => k.team_id === team && k.active);
      if (!team || !members.length) { flash("Elige un equipo con miembros"); return; }
      const gid = crypto.randomUUID();
      const rows = members.map((k) => ({ task_id: task.id, kid_id: k.id, title: task.title, points: task.points, photo_required: task.photo_required, due_date: due, team_id: team, group_id: gid, grupal: true }));
      const { error } = await sb.from("assignments").insert(rows);
      flash(error ? error.message : `Misión de equipo asignada · suma a ${rows.length}`);
      if (!error) { refresh(); onClose(); }
      return;
    }
    const rows = sel.map((kid_id) => ({ task_id: task.id, kid_id, title: task.title, points: task.points, photo_required: task.photo_required, due_date: due, team_id: db.kids.find((k) => k.id === kid_id)?.team_id ?? null }));
    const { error } = await sb.from("assignments").insert(rows);
    flash(error ? error.message : `Asignada a ${rows.length} hijo(s)`);
    if (!error) { refresh(); onClose(); }
  };
  return (
    <Modal title={`Asignar: ${task.title}`} onClose={onClose}>
      <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="mb-3" />
      <label className="flex items-center gap-2 text-sm font-medium text-navy mb-3 bg-slate-50 rounded-xl px-3 py-2.5">
        <input type="checkbox" checked={grupal} onChange={(e) => setGrupal(e.target.checked)} className="accent-brand w-4 h-4" />
        Misión de equipo (al validarla suma a todo el equipo)
      </label>
      {grupal ? (
        <>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {db.teams.map((t) => {
              const n = db.kids.filter((k) => k.team_id === t.id && k.active).length;
              return <button key={t.id} onClick={() => setTeam(t.id)} className={`rounded-xl p-3 text-sm font-semibold border text-left ${team === t.id ? "border-brand bg-orange-50 text-navy" : "border-slate-200 bg-slate-50 text-slate-500"}`}><span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: t.color }} />{t.name}</span><span className="text-xs text-slate-400">{n} miembros</span></button>;
            })}
          </div>
          <Btn variant="primary" className="w-full" onClick={assign}>Asignar al equipo</Btn>
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-3">
            {db.teams.map((t) => <button key={t.id} onClick={() => { const ids = db.kids.filter((k) => k.team_id === t.id).map((k) => k.id); setSel((s) => [...new Set([...s, ...ids])]); }} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-white" style={{ background: t.color }}>+ {t.name}</button>)}
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {db.kids.map((k) => <button key={k.id} onClick={() => toggle(k.id)} className={`rounded-xl p-2 text-sm font-semibold border ${sel.includes(k.id) ? "border-brand bg-orange-50 text-navy" : "border-slate-200 bg-slate-50 text-slate-500"}`}>{k.name}</button>)}
          </div>
          <Btn variant="primary" className="w-full" onClick={() => sel.length && assign()}>Asignar a {sel.length}</Btn>
        </>
      )}
    </Modal>
  );
}

function RecurringModal({ ctx, task, onClose }: { ctx: Ctx; task: Task; onClose: () => void }) {
  const { db, refresh } = ctx;
  const targetIds = db.task_targets.filter((tt) => tt.task_id === task.id).map((tt) => tt.kid_id);
  const toggle = async (kidId: string) => {
    const existing = db.task_targets.find((tt) => tt.task_id === task.id && tt.kid_id === kidId);
    if (existing) await sb.from("task_targets").delete().eq("id", existing.id);
    else await sb.from("task_targets").insert({ task_id: task.id, kid_id: kidId });
    refresh();
  };
  return (
    <Modal title={`Recurrente: ${task.title}`} onClose={onClose}>
      <div className="bg-slate-50 rounded-xl p-3 mb-3 text-sm text-slate-500 font-medium flex items-center gap-2"><CalendarClock size={18} className="text-brand shrink-0" /> Se generará sola según su frecuencia (<b>{task.frequency}</b>) para los hijos marcados.</div>
      <div className="grid grid-cols-3 gap-2">
        {db.kids.map((k) => {
          const on = targetIds.includes(k.id);
          return <button key={k.id} onClick={() => toggle(k.id)} className={`rounded-xl p-2 text-sm font-semibold border ${on ? "border-teal bg-teal/10 text-navy" : "border-slate-200 bg-slate-50 text-slate-500"}`}>{k.name}</button>;
        })}
      </div>
      <Btn variant="teal" className="w-full mt-4" onClick={onClose}>Hecho</Btn>
    </Modal>
  );
}

const FREQ_ORDER: [string, string][] = [["diaria", "Diarias"], ["2/semana", "2 por semana"], ["semanal", "Semanales"], ["quincenal", "Quincenales"], ["mensual", "Mensuales"], ["personalizada", "Personalizadas"]];

function MiniStat({ icon, value, label, accent }: { icon: React.ReactNode; value: React.ReactNode; label: string; accent: string }) {
  return (
    <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-card px-3 py-2.5 flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${accent}15`, color: accent }}>{icon}</div>
      <div className="min-w-0">
        <div className="text-xl font-extrabold text-navy leading-none tracking-tight">{value}</div>
        <div className="text-[11px] font-semibold text-slate-400 truncate">{label}</div>
      </div>
    </div>
  );
}

export default function AdminTasks({ ctx }: { ctx: Ctx }) {
  const { db, refresh, flash } = ctx;
  const [f, setF] = useState({ title: "", description: "", points: 20, difficulty: "media", frequency: "diaria", photo_required: false });
  const [asgTask, setAsgTask] = useState<Task | null>(null);
  const [recTask, setRecTask] = useState<Task | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [q, setQ] = useState("");
  const [filterFreq, setFilterFreq] = useState<string>("all");

  const recurringCount = useMemo(() => new Set(db.task_targets.map((tt) => tt.task_id)).size, [db.task_targets]);
  const generatedToday = useMemo(() => db.assignments.filter((a) => a.due_date === todayStr()).length, [db.assignments]);

  const create = async () => {
    if (!f.title) return;
    const scope = ["quincenal", "mensual"].includes(f.frequency) ? "open" : "team";
    const { error } = await sb.from("tasks").insert({ ...f, scope });
    flash(error ? error.message : "Misión creada");
    if (!error) { setF({ ...f, title: "", description: "" }); setShowForm(false); refresh(); }
  };
  const generate = async () => {
    const { data, error } = await rpc("generate_missions", { p_date: todayStr() });
    flash(error ? error.message : `${data ?? 0} misiones generadas para hoy`); refresh();
  };
  const savePoints = async (id: string, points: number) => {
    if (!Number.isFinite(points) || points < 0) return;
    await sb.from("tasks").update({ points }).eq("id", id);
    flash("Puntos actualizados"); refresh();
  };
  const saveDeadline = async (id: string, val: string) => {
    await sb.from("tasks").update({ deadline_time: val || null }).eq("id", id);
    flash(val ? `Hora tope: ${val} (España)` : "Hora tope quitada"); refresh();
  };

  const ql = q.trim().toLowerCase();
  const groups = FREQ_ORDER
    .filter(([freq]) => filterFreq === "all" || filterFreq === freq)
    .map(([freq, label]) => {
      const group = db.tasks.filter((t) => t.frequency === freq && (!ql || t.title.toLowerCase().includes(ql) || (t.description || "").toLowerCase().includes(ql)));
      return { freq, label, group };
    })
    .filter((g) => g.group.length > 0);
  const visibleCount = groups.reduce((acc, g) => acc + g.group.length, 0);

  return (
    <div className="pb-6">
      {/* Resumen + acción principal */}
      <div className="flex flex-wrap items-stretch gap-2 mb-3">
        <MiniStat icon={<Layers size={17} />} value={db.tasks.length} label="Misiones" accent="#FF8A00" />
        <MiniStat icon={<Repeat size={17} />} value={recurringCount} label="Recurrentes" accent="#14B8A6" />
        <MiniStat icon={<Sparkles size={17} />} value={generatedToday} label="Generadas hoy" accent="#3B82F6" />
        <button onClick={generate} className="shrink-0 bg-teal text-white font-bold rounded-2xl px-4 py-2.5 text-sm flex items-center gap-1.5 shadow-card active:scale-95 transition">
          <CalendarClock size={16} /> Generar hoy
        </button>
      </div>

      {/* Nueva misión (plegable) */}
      <Card className="mb-3 overflow-hidden">
        <button onClick={() => setShowForm((v) => !v)} className="w-full flex items-center justify-between px-4 py-3.5 text-left">
          <span className="flex items-center gap-2 font-bold text-navy tracking-tight">
            <span className="w-7 h-7 rounded-xl bg-brand text-white flex items-center justify-center"><Plus size={16} /></span>
            Nueva misión
          </span>
          <ChevronDown size={18} className={`text-slate-400 transition ${showForm ? "rotate-180" : ""}`} />
        </button>
        {showForm && (
          <div className="px-4 pb-4 space-y-2.5 border-t border-slate-100 pt-3">
            <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Título (ej. Conquista la cocina)" />
            <Input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Descripción (opcional)" />
            <div className="flex gap-2">
              <Input type="number" value={f.points} onChange={(e) => setF({ ...f, points: +e.target.value })} className="w-24" placeholder="pts" />
              <select value={f.difficulty} onChange={(e) => setF({ ...f, difficulty: e.target.value })} className="flex-1 border border-slate-200 bg-slate-50 rounded-xl px-2 py-3 text-[15px]"><option value="facil">Fácil</option><option value="media">Media</option><option value="dificil">Difícil</option></select>
              <select value={f.frequency} onChange={(e) => setF({ ...f, frequency: e.target.value })} className="flex-1 border border-slate-200 bg-slate-50 rounded-xl px-2 py-3 text-[15px]">{["diaria", "2/semana", "semanal", "quincenal", "mensual", "personalizada"].map((x) => <option key={x}>{x}</option>)}</select>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-navy"><input type="checkbox" checked={f.photo_required} onChange={(e) => setF({ ...f, photo_required: e.target.checked })} className="accent-brand w-4 h-4" /> Requiere foto de evidencia</label>
            <Btn variant="primary" className="w-full flex items-center justify-center gap-1.5" onClick={create}><Plus size={17} /> Crear misión</Btn>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] font-medium text-slate-500 pt-1">
              {FREQ_ORDER.slice(0, 5).map(([freq]) => (
                <span key={freq} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: freqColor(freq) }} />{FREQ_META[freq]?.label} · {FREQ_META[freq]?.diff}</span>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Buscador + filtros por frecuencia */}
      <div className="relative mb-2.5">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar misión…" className="w-full border border-slate-200 bg-white rounded-xl pl-10 pr-9 py-2.5 text-[15px] outline-none focus:border-brand transition" />
        {q && <button onClick={() => setQ("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"><X size={16} /></button>}
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-1 -mx-1 px-1">
        <FilterChip active={filterFreq === "all"} onClick={() => setFilterFreq("all")} color="#0B1F3A" label={`Todas · ${db.tasks.length}`} />
        {FREQ_ORDER.map(([freq, label]) => {
          const n = db.tasks.filter((t) => t.frequency === freq).length;
          if (!n) return null;
          return <FilterChip key={freq} active={filterFreq === freq} onClick={() => setFilterFreq(freq)} color={freqColor(freq)} label={`${label} · ${n}`} />;
        })}
      </div>

      {/* Catálogo */}
      {groups.map(({ freq, label, group }) => {
        const col = freqColor(freq);
        return (
          <div key={freq} className="mb-5">
            <div className="flex items-center gap-2 mb-2 px-0.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: col }} />
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
              <span className="text-xs font-semibold text-slate-300">· {group.length}</span>
            </div>
            <div className="space-y-2.5">
              {group.map((t) => {
                const Icon = missionIcon(t.title);
                const targets = db.task_targets.filter((tt) => tt.task_id === t.id).length;
                const open = t.scope === "open";
                return (
                  <Card key={t.id} className="p-3.5 relative overflow-hidden" style={{ borderLeft: `4px solid ${col}` }}>
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm" style={{ background: col }}><Icon size={22} /></div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-navy leading-tight">{t.title}</div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <div className="flex items-center gap-1 rounded-lg pl-1.5 pr-1 py-0.5" style={{ background: `${col}18`, border: `1px solid ${col}55` }}>
                            <span className="font-bold text-xs" style={{ color: col }}>+</span>
                            <input type="number" defaultValue={t.points} onBlur={(e) => savePoints(t.id, +e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} className="w-10 bg-transparent font-bold text-sm text-center outline-none" style={{ color: col }} />
                            <span className="font-bold text-xs" style={{ color: col }}>XP</span>
                          </div>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md" style={{ background: open ? "#EFF6FF" : "#F1F5F9", color: open ? "#2563EB" : "#64748B" }}>{open ? "Cualquiera" : "Por equipo"}</span>
                          <label title="Hora tope (hora de España). Si no se hace a tiempo, resta los puntos." className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 border ${t.deadline_time ? "bg-red-50 border-red-200" : "bg-slate-100 border-slate-200"}`}>
                            <Clock size={12} className={t.deadline_time ? "text-red-500" : "text-slate-400"} />
                            <input type="time" defaultValue={t.deadline_time ? t.deadline_time.slice(0, 5) : ""} onBlur={(e) => saveDeadline(t.id, e.target.value)} className="bg-transparent text-[11px] font-bold outline-none w-[62px]" style={{ color: t.deadline_time ? "#DC2626" : "#64748B" }} />
                          </label>
                          {t.photo_required && <Chip tone="amber">foto</Chip>}
                          {targets > 0 && <Chip tone="teal">recurrente · {targets}</Chip>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Btn variant="ghost" className="flex-1 text-sm py-2 flex items-center justify-center gap-1.5" onClick={() => setRecTask(t)}><Repeat size={15} /> Recurrente</Btn>
                      <Btn variant="primary" className="flex-1 text-sm py-2 flex items-center justify-center gap-1.5" onClick={() => setAsgTask(t)}><Target size={15} /> Asignar</Btn>
                      <button onClick={async () => { if (confirm(`¿Eliminar "${t.title}"?`)) { await sb.from("tasks").delete().eq("id", t.id); refresh(); } }} className="text-slate-300 hover:text-red-400 px-2"><Trash2 size={17} /></button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {db.tasks.length === 0 && <Card className="p-6 text-center text-slate-400 text-sm font-medium">Aún no hay misiones. Pulsa «Nueva misión» para crear la primera.</Card>}
      {db.tasks.length > 0 && visibleCount === 0 && <Card className="p-6 text-center text-slate-400 text-sm font-medium">Ninguna misión coincide con el filtro. <button onClick={() => { setQ(""); setFilterFreq("all"); }} className="text-brand font-semibold">Quitar filtros</button></Card>}

      {asgTask && <AssignModal ctx={ctx} task={asgTask} onClose={() => setAsgTask(null)} />}
      {recTask && <RecurringModal ctx={ctx} task={recTask} onClose={() => setRecTask(null)} />}
    </div>
  );
}

function FilterChip({ active, onClick, color, label }: { active: boolean; onClick: () => void; color: string; label: string }) {
  return (
    <button onClick={onClick} className={`shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition ${active ? "text-white border-transparent" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`} style={active ? { background: color } : undefined}>
      {!active && <span className="w-2 h-2 rounded-full" style={{ background: color }} />}{label}
    </button>
  );
}
