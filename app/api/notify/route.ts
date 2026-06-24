import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const PUB = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BFIjrhQp2EnmiTYJC-sC3nUe6CBVNtT3tijp4-k1ko2haea8L24L2HebpnUo50skTUcvE3kYTWJDZcDa8gf38oM";
const PRIV = process.env.VAPID_PRIVATE_KEY || "";
const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ruhqgglinqkwruahvrrc.supabase.co";
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export async function POST(req: Request) {
  // Degradación elegante: si no hay claves configuradas, no hace nada (la app sigue funcionando).
  if (!PRIV || !SERVICE) return NextResponse.json({ skipped: true });
  try {
    const { title, body } = await req.json();
    webpush.setVapidDetails("mailto:carmelogjimenez@gmail.com", PUB, PRIV);
    const admin = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false } });
    const { data } = await admin.from("push_subscriptions").select("*");
    const subs = data || [];
    await Promise.all(subs.map(async (s: { endpoint: string; p256dh: string; auth: string }) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify({ title: title || "Gánate el Verano", body: body || "", url: "/" }));
      } catch (e: unknown) {
        const code = (e as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) await admin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
      }
    }));
    return NextResponse.json({ ok: true, sent: subs.length });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
