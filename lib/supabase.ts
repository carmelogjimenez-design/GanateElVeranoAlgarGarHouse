import { createClient } from "@supabase/supabase-js";

// Valores por defecto = tu proyecto. Puedes sobreescribirlos con variables de
// entorno en Vercel (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://ruhqgglinqkwruahvrrc.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "sb_publishable_uHB7b3Z_uRXfRv2qGOhanQ_J89uqWcO";

export const sb = createClient(url, key);
