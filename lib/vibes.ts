// Frases canallas de padre para la portada (rotan en el hero)
export const DAD_TAGLINES = [
  "De vosotros depende no quedaros en casa este verano.",
  "Los puntos no se heredan. Se sudan.",
  "Papá y mamá lo ven TODO. Hasta el polvo de debajo de la cama.",
  "El sofá se gana. Las tareas también.",
  "¿Piscina o fregona? Spoiler: tú decides.",
  "Aquí no hay paga sin gloria.",
  "El que no curra… mira cómo los demás se divierten.",
  "Cero excusas. Mil puntos por ganar.",
  "El ranking no miente. La pereza, tampoco.",
  "Que empiece el juego. Y que gane el más currante.",
];

const WEEK = [
  "Eres el hijo favorito de papá y mamá esta semana 👑",
  "Esta semana mandas tú. Disfruta el trono.",
  "Número uno. Papá presume de ti en el grupo de WhatsApp.",
  "El rey/la reina de la casa esta semana eres TÚ.",
];
const DONE = [
  "¡Máquina! Hoy lo has petado.",
  "Tareas hechas. Papá está orgulloso (no se lo digas).",
  "Cero pendientes. Hoy te has ganado el verano.",
  "Hecho y derecho. Así se juega.",
];
const PEND = [
  "Tienes faena pendiente… el sofá puede esperar.",
  "Esas misiones no se hacen solas, crack.",
  "Aún quedan puntos por ganar. ¿A qué esperas?",
  "Papá lo está viendo. Mejor termina esas tareas 👀",
];
const IDLE = [
  "Hoy toca brillar. ¿A por los puntos?",
  "El verano se gana hoy. Empieza fuerte.",
  "Nuevo día, nuevos puntos. Demuestra de qué vas.",
  "Sin misiones aún… pero el ranking espera.",
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Mensaje diario estable (sin parpadeos de hidratación): depende del nombre + el día
export function kidVibe(o: { name: string; isWeekKid: boolean; doneToday: number; pendingToday: number }): string {
  const seed = hash(o.name + new Date().toISOString().slice(0, 10));
  const pick = (arr: string[]) => arr[seed % arr.length];
  if (o.isWeekKid) return pick(WEEK);
  if (o.pendingToday === 0 && o.doneToday > 0) return pick(DONE);
  if (o.pendingToday > 0) return pick(PEND);
  return pick(IDLE);
}
