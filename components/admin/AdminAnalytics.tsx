"use client";
import { Card, Btn, Avatar } from "@/components/ui/atoms";
import { levelOf } from "@/lib/game";
import { todayStr } from "@/lib/helpers";
import type { Ctx } from "@/lib/types";
import { FileSpreadsheet, FileText, TrendingUp, Trophy, BookOpen, Award, AlertTriangle } from "lucide-react";

export default function AdminAnalytics({ ctx }: { ctx: Ctx }) {
  const { db } = ctx;
  const name = (id: string) => db.kids.find((k) => k.id === id)?.name || "—";

  const days = [...Array(14)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (13 - i)); return d.toISOString().slice(0, 10); });
  const daily = days.map((day) => db.point_events.filter((e) => e.delta > 0 && e.created_at.slice(0, 10) === day).reduce((a, b) => a + b.delta, 0));
  const maxDaily = Math.max(1, ...daily);

  const perKid = db.kids.map((k) => ({
    k, points: k.total_points, level: levelOf(k.total_points),
    approved: db.assignments.filter((a) => a.kid_id === k.id && a.status === "approved").length,
    studyMin: Math.round(db.study_sessions.filter((s) => s.kid_id === k.id).reduce((a, b) => a + b.seconds, 0) / 60),
    badges: db.kid_badges.filter((b) => b.kid_id === k.id).length,
  })).sort((a, b) => b.points - a.points);
  const maxPts = Math.max(1, ...perKid.map((p) => p.points));

  const teams = db.teams.map((t) => { const ms = db.kids.filter((k) => k.team_id === t.id); return { t, members: ms.length, points: ms.reduce((a, b) => a + b.total_points, 0) }; }).sort((a, b) => b.points - a.points);

  const totalPoints = db.kids.reduce((a, b) => a + b.total_points, 0);
  const totalApproved = db.assignments.filter((a) => a.status === "approved").length;
  const totalStudyMin = Math.round(db.study_sessions.reduce((a, b) => a + b.seconds, 0) / 60);
  const activeKids = db.kids.filter((k) => k.active).length;

  const exportXlsx = async () => {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Métrica", "Valor"], ["Puntos totales", totalPoints], ["Misiones validadas", totalApproved], ["Minutos de estudio", totalStudyMin], ["Hijos activos", activeKids]]), "Resumen");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Hijo", "Puntos", "Nivel", "Misiones", "Min. estudio", "Medallas"], ...perKid.map((p) => [p.k.name, p.points, p.level, p.approved, p.studyMin, p.badges])]), "Por hijo");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Equipo", "Miembros", "Puntos"], ...teams.map((t) => [t.t.name, t.members, t.points])]), "Equipos");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Fecha", "Hijo", "Puntos", "Motivo"], ...db.point_events.slice().sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 500).map((e) => [e.created_at.slice(0, 10), name(e.kid_id), e.delta, e.reason])]), "Movimientos");
    XLSX.writeFile(wb, `ganate-el-verano-${todayStr()}.xlsx`);
  };

  const exportPdf = () => {
    const rows = perKid.map((p) => `<tr><td>${p.k.name}</td><td>${p.points}</td><td>${p.level}</td><td>${p.approved}</td><td>${p.studyMin}</td><td>${p.badges}</td></tr>`).join("");
    const teamRows = teams.map((t) => `<tr><td>${t.t.name}</td><td>${t.members}</td><td>${t.points}</td></tr>`).join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Informe Gánate el Verano</title><style>body{font-family:Arial,Helvetica,sans-serif;padding:28px;color:#0B1F3A}h1{margin:0 0 2px}small{color:#64748b}h2{margin:22px 0 6px;font-size:15px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #e2e8f0;padding:7px 9px;text-align:left;font-size:12px}th{background:#0B1F3A;color:#fff}.kpis{margin:14px 0;font-size:13px}.kpis b{color:#FF8A00}</style></head><body><h1>Gánate el Verano</h1><small>Informe del ${todayStr()}</small><div class="kpis">Puntos totales: <b>${totalPoints}</b> &nbsp;·&nbsp; Misiones validadas: <b>${totalApproved}</b> &nbsp;·&nbsp; Minutos de estudio: <b>${totalStudyMin}</b> &nbsp;·&nbsp; Hijos: <b>${activeKids}</b></div><h2>Por hijo</h2><table><thead><tr><th>Hijo</th><th>Puntos</th><th>Nivel</th><th>Misiones</th><th>Min. estudio</th><th>Medallas</th></tr></thead><tbody>${rows}</tbody></table><h2>Equipos</h2><table><thead><tr><th>Equipo</th><th>Miembros</th><th>Puntos</th></tr></thead><tbody>${teamRows}</tbody></table></body></html>`;
    const w = window.open("", "_blank"); if (!w) return;
    w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 300);
  };

  const KPI = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) => (
    <Card className="p-4"><div className="flex items-center gap-2 text-slate-400 mb-1">{icon}<span className="text-xs font-semibold">{label}</span></div><div className="text-2xl font-extrabold text-navy tabular-nums">{value}</div></Card>
  );

  return (
    <div className="space-y-5 pb-6 max-w-5xl">
      <div className="flex flex-wrap gap-2 justify-end">
        <Btn variant="teal" className="flex items-center gap-2 text-sm py-2.5" onClick={exportXlsx}><FileSpreadsheet size={16} /> Exportar Excel</Btn>
        <Btn variant="dark" className="flex items-center gap-2 text-sm py-2.5" onClick={exportPdf}><FileText size={16} /> Exportar PDF</Btn>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={<Trophy size={15} />} label="Puntos totales" value={totalPoints} />
        <KPI icon={<Award size={15} />} label="Misiones validadas" value={totalApproved} />
        <KPI icon={<BookOpen size={15} />} label="Min. de estudio" value={totalStudyMin} />
        <KPI icon={<TrendingUp size={15} />} label="Hijos activos" value={activeKids} />
      </div>

      <Card className="p-5">
        <h3 className="font-bold text-navy tracking-tight mb-4">Puntos por día (últimas 2 semanas)</h3>
        <div className="flex items-end gap-1.5 h-40">
          {daily.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 group">
              <div className="text-[9px] font-semibold text-slate-400 opacity-0 group-hover:opacity-100">{v}</div>
              <div className="w-full rounded-t-md transition-all" style={{ height: `${(v / maxDaily) * 100}%`, minHeight: v > 0 ? 4 : 0, background: "#FF8A00" }} />
              <div className="text-[9px] text-slate-300 font-medium">{days[i].slice(8, 10)}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-bold text-navy tracking-tight mb-4">Ranking por hijo</h3>
        <div className="space-y-3">
          {perKid.map((p) => (
            <div key={p.k.id} className="flex items-center gap-3">
              <Avatar name={p.k.name} color={p.k.color} size={34} avatar={p.k.avatar} />
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-2 text-sm mb-1"><span className="font-semibold text-navy truncate">{p.k.name}</span><span className="text-slate-400 font-medium tabular-nums text-xs sm:text-sm shrink-0">{p.points} pts · Nv {p.level} · {p.approved} mis · {p.studyMin}′</span></div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-2 rounded-full" style={{ width: `${(p.points / maxPts) * 100}%`, background: p.k.color }} /></div>
              </div>
            </div>
          ))}
          {perKid.length === 0 && <p className="text-slate-400 text-sm font-medium text-center py-4">Sin datos todavía.</p>}
        </div>
      </Card>

      {teams.length > 0 && (
        <Card className="p-5">
          <h3 className="font-bold text-navy tracking-tight mb-4">Equipos</h3>
          <div className="space-y-2">
            {teams.map((t) => (
              <div key={t.t.id} className="flex items-center justify-between text-sm py-1.5">
                <span className="font-semibold text-navy flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: t.t.color }} />{t.t.name}</span>
                <span className="text-slate-400 font-medium tabular-nums">{t.members} miembros · {t.points} pts</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {db.test_sessions.some((t) => t.suspicious) && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3"><AlertTriangle size={16} className="text-amber-500" /><h3 className="font-bold text-navy tracking-tight">Tests sospechosos (posible farmeo)</h3></div>
          <div className="space-y-1.5">
            {db.test_sessions.filter((t) => t.suspicious).slice().sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 10).map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm py-1">
                <span className="font-medium text-navy">{name(t.kid_id)} · {db.subjects.find((s) => s.id === t.subject_id)?.name || "—"}</span>
                <span className="text-slate-400 font-medium">{t.score}/{t.total} · {t.day}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 font-medium mt-3">Detectados por responder demasiado rápido. La recompensa de esos tests ya se redujo automáticamente.</p>
        </Card>
      )}
    </div>
  );
}
