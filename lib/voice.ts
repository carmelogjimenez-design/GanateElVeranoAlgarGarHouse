// Voz canalla de papá (TTS del navegador). Reemplazable por audios reales más adelante.
const VKEY = "gev_voice_off";
export function voiceOff(): boolean { if (typeof window === "undefined") return false; try { return localStorage.getItem(VKEY) === "1"; } catch { return false; } }
export function setVoiceOff(v: boolean) { try { localStorage.setItem(VKEY, v ? "1" : "0"); } catch {} }
import { isMuted } from "@/lib/sfx";

const LINES = [
  "¡Eh! Las tareas no se hacen solas. A currar.",
  "Papá te está viendo. Más te vale ganar puntos hoy.",
  "Buenas, campeón. ¿Hoy toca trabajar o quedarse en casa?",
  "El que no curra, no juega. Tú decides.",
  "Venga, que el verano se gana hoy. ¡A por ello!",
  "¿Otra vez por aquí? Demuestra que vales esos puntos.",
  "Espabila, que tus hermanos te están adelantando.",
  "Hoy te quiero el primero del ranking. Sin excusas.",
];

export function dadSpeak(text?: string) {
  if (typeof window === "undefined" || voiceOff() || isMuted()) return;
  try {
    const synth = window.speechSynthesis; if (!synth) return;
    const line = text || LINES[Math.floor(Math.random() * LINES.length)];
    const u = new SpeechSynthesisUtterance(line);
    u.lang = "es-ES"; u.rate = 0.98; u.pitch = 0.8; u.volume = 1;
    const voices = synth.getVoices();
    const es = voices.find((v) => v.lang.toLowerCase().startsWith("es"));
    if (es) u.voice = es;
    synth.cancel(); synth.speak(u);
  } catch {}
}
