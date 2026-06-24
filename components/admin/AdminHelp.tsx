"use client";
import { Card } from "@/components/ui/atoms";
import { LayoutDashboard, ClipboardCheck, Target, Users, Gift, BarChart3, Settings, Zap, Crown, HelpCircle } from "lucide-react";

const SECTIONS = [
  { Icon: LayoutDashboard, color: "#FF8A00", title: "Resumen", text: "Tu centro de mando: ranking de equipos e individual, misiones del día por frecuencia, hijo de la semana y lo que tienes pendiente de validar. Activa el modo test (🧪) para entrar como un hijo y verlo todo desde su lado." },
  { Icon: ClipboardCheck, color: "#19D3AE", title: "Validar", text: "Aquí aterriza todo lo que los hijos completan: misiones (con su foto si la pediste), canjes de la tienda, recompensas de estudio y regalos de puntos. Aprueba o rechaza con un toque. También autorizas a los hijos nuevos que se registren, asignándoles equipo." },
  { Icon: Target, color: "#3B82F6", title: "Misiones", text: "Crea tareas con su frecuencia (diaria, 2/semana, quincenal, mensual…) y sus puntos. El catálogo va agrupado por frecuencia y puedes editar los puntos de cualquier tarea al vuelo. 'Generar hoy' crea las misiones del día para quien toque." },
  { Icon: Users, color: "#A855F7", title: "Hijos", text: "Añade hijos y equipos, mueve a cada uno a su equipo, ajústale el PIN, su meta semanal o si puede tutorizar. Desde la ficha también otorgas o penalizas puntos a mano y completas una misión por él. Puedes borrar equipos de prueba con la papelera." },
  { Icon: Gift, color: "#EC4899", title: "Tienda", text: "Define los premios que tus hijos pueden canjear con su XP (una peli, elegir cena, una hora extra de piscina…) y el coste de cada uno. Ellos los piden y tú los validas en Validar." },
  { Icon: BarChart3, color: "#0EA5E9", title: "Analytics", text: "Evolución de puntos, ranking detallado, rendimiento por equipos y tests sospechosos. Puedes exportar a Excel o PDF para guardar el resumen del verano." },
  { Icon: Zap, color: "#EAB308", title: "Eventos · Doble XP", text: "En Ajustes puedes lanzar un evento de Doble XP por unas horas. Mientras esté activo, todas las misiones que valides multiplican sus puntos, y a los hijos les sale un cartel avisando. Perfecto para un finde de empujón." },
  { Icon: Crown, color: "#F59E0B", title: "Administradores", text: "Como superadmin, en Ajustes decides quién más es administrador (p. ej. el otro progenitor) con un botón. Los admin ven este panel; los hijos, el suyo." },
  { Icon: Settings, color: "#64748B", title: "Ajustes", text: "Tu foto de perfil, notificaciones push, recompensa por estudiar, meta semanal por defecto y el reto de equipo. Todo lo que afina cómo se juega." },
];

export default function AdminHelp() {
  return (
    <div className="max-w-3xl pb-6">
      <Card className="p-5 mb-4" >
        <div className="flex items-center gap-2 mb-1"><HelpCircle size={18} className="text-brand" /><h3 className="font-bold text-navy tracking-tight">Cómo funciona el juego</h3></div>
        <p className="text-sm text-slate-400 font-medium">Una guía rápida de cada sección del panel. La idea es simple: los hijos hacen tareas y estudian → ganan XP → tú validas → suben en el ranking y se ganan el verano.</p>
      </Card>
      <div className="space-y-3">
        {SECTIONS.map((s) => (
          <Card key={s.title} className="p-4">
            <div className="flex gap-3.5">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0" style={{ background: s.color }}><s.Icon size={20} /></div>
              <div>
                <div className="font-bold text-navy">{s.title}</div>
                <p className="text-sm text-slate-500 font-medium leading-relaxed mt-0.5">{s.text}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Card className="p-5 mt-4 bg-navy border-navy text-white">
        <div className="font-bold mb-1">Flujo del día a día</div>
        <p className="text-sm text-white/70 font-medium leading-relaxed">1) Los hijos marcan sus misiones (y suben foto si toca). 2) Te llega a <b>Validar</b> (la campanita avisa). 3) Apruebas → se reparten los puntos. 4) El ranking y los equipos se actualizan solos. Repite, y que gane el más currante.</p>
      </Card>
    </div>
  );
}
