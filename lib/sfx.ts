// Motor de sonido (Web Audio) + haptics + mute persistente
const KEY = "gev_muted";
export function isMuted(): boolean { if (typeof window === "undefined") return false; try { return localStorage.getItem(KEY) === "1"; } catch { return false; } }
export function setMuted(m: boolean) { try { localStorage.setItem(KEY, m ? "1" : "0"); } catch {} }

let ac: AudioContext | null = null;
function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ac) { const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext; ac = new C(); }
    if (ac.state === "suspended") ac.resume();
    return ac;
  } catch { return null; }
}
function note(a: AudioContext, freq: number, start: number, dur: number, type: OscillatorType = "triangle", vol = 0.18) {
  const o = a.createOscillator(); const g = a.createGain();
  o.type = type; o.frequency.value = freq; o.connect(g); g.connect(a.destination);
  const t = a.currentTime + start;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.start(t); o.stop(t + dur + 0.02);
}
export function haptic(pattern: number | number[] = 20) { try { navigator.vibrate?.(pattern); } catch {} }

export type Sfx = "complete" | "claim" | "xp" | "level" | "badge" | "reject" | "tap";
export function sfx(name: Sfx) {
  if (isMuted()) return;
  const a = ctx(); if (!a) return;
  try {
    switch (name) {
      case "complete": note(a, 659.25, 0, 0.18); note(a, 987.77, 0.08, 0.22); haptic(25); break;
      case "claim": note(a, 784, 0, 0.12, "square", 0.12); note(a, 1046.5, 0.06, 0.16); haptic([15, 25, 15]); break;
      case "xp": note(a, 880, 0, 0.1, "square", 0.1); haptic(10); break;
      case "level": [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => note(a, f, i * 0.1, 0.32, "triangle", 0.2)); haptic([30, 40, 60]); break;
      case "badge": [659.25, 830.6, 987.77, 1318.5].forEach((f, i) => note(a, f, i * 0.09, 0.3)); haptic([20, 30, 20, 30]); break;
      case "reject": note(a, 220, 0, 0.2, "sawtooth", 0.12); note(a, 175, 0.12, 0.22, "sawtooth", 0.1); haptic(60); break;
      case "tap": note(a, 660, 0, 0.06, "sine", 0.08); haptic(8); break;
    }
  } catch {}
}
