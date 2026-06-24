# ☀️ Gánate el Verano — Next.js + TypeScript

App familiar gamificada de tareas + estudio. *"Disfruta del verano… o quédate en casa."*

Stack: **Next.js 15 · React 19 · TypeScript · Tailwind · Supabase** (mismo backend que ya desplegaste).

## Subirla
1. **GitHub:** sube TODO el contenido de esta carpeta a la raíz del repo (archivos y carpetas sueltos: `app/`, `components/`, `lib/`, `package.json`, etc. — NO la carpeta envoltorio).
2. **Vercel:** Import del repo. Detecta Next.js solo. Deploy.
3. Las credenciales de Supabase ya van por defecto en `lib/supabase.ts`. Si prefieres variables de entorno, define en Vercel `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Estructura
- `app/` — layout + página raíz (router lobby/hijo/padres).
- `components/` — Lobby, Pin/Login, `kid/*`, `admin/*`, `ui/atoms`.
- `lib/` — cliente Supabase, tipos, helpers, textos.
