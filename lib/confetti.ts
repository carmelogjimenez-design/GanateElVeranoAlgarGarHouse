export function confetti(durationMs = 1400) {
  if (typeof window === "undefined") return;
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9999";
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) { canvas.remove(); return; }
  const colors = ["#FF8A00", "#19D3AE", "#3B82F6", "#A855F7", "#EAB308", "#EF4444"];
  const N = 140;
  const parts = Array.from({ length: N }, () => ({
    x: canvas.width / 2 + (Math.random() - 0.5) * 120,
    y: canvas.height / 3,
    vx: (Math.random() - 0.5) * 14,
    vy: Math.random() * -12 - 4,
    s: Math.random() * 7 + 4,
    c: colors[(Math.random() * colors.length) | 0],
    r: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.4,
  }));
  const start = performance.now();
  const tick = (t: number) => {
    const el = t - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    parts.forEach((p) => {
      p.vy += 0.35; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
      ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); ctx.restore();
    });
    if (el < durationMs) requestAnimationFrame(tick); else canvas.remove();
  };
  requestAnimationFrame(tick);
}

export function chime() {
  if (typeof window === "undefined") return;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ac = new Ctx();
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const o = ac.createOscillator(); const g = ac.createGain();
      o.type = "triangle"; o.frequency.value = freq; o.connect(g); g.connect(ac.destination);
      const t = ac.currentTime + i * 0.11;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      o.start(t); o.stop(t + 0.26);
    });
    setTimeout(() => ac.close(), 1300);
  } catch { /* sin sonido */ }
}
