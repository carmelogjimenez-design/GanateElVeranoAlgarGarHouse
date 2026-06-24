"use client";

export default function Footer({ dark = false }: { dark?: boolean }) {
  const toTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  return (
    <footer className="text-center px-4 py-6">
      <p className={`text-[11px] font-semibold leading-relaxed ${dark ? "text-white/45" : "text-navy/40"}`}>
        © 2026 GÁNATE EL VERANO · Todos los derechos pertenecen al puto amo de Carmelo García
        <button onClick={toTop} aria-label="Subir arriba" title="Subir arriba" className="ml-1.5 align-middle hover:scale-125 transition inline-block">🔝</button>
      </p>
    </footer>
  );
}
