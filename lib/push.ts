"use client";
import { sb } from "@/lib/supabase";

export const VAPID_PUBLIC =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BFIjrhQp2EnmiTYJC-sC3nUe6CBVNtT3tijp4-k1ko2haea8L24L2HebpnUo50skTUcvE3kYTWJDZcDa8gf38oM";

export async function registerSW() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try { return await navigator.serviceWorker.register("/sw.js"); } catch { return null; }
}

function urlB64ToUint8(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const b = (base64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export async function enablePush(userId: string): Promise<{ ok: boolean; msg: string }> {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator))
    return { ok: false, msg: "Este navegador no soporta avisos." };
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return { ok: false, msg: "Permiso de avisos denegado." };
  await registerSW();
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8(VAPID_PUBLIC) });
  const j = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
  const { error } = await sb.from("push_subscriptions").upsert(
    { user_id: userId, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth },
    { onConflict: "endpoint" });
  return error ? { ok: false, msg: error.message } : { ok: true, msg: "¡Avisos activados en este dispositivo!" };
}

export function notifyParents(title: string, body: string) {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (process.env.NEXT_PUBLIC_NOTIFY_KEY) headers["x-gev-key"] = process.env.NEXT_PUBLIC_NOTIFY_KEY;
    fetch("/api/notify", { method: "POST", headers, body: JSON.stringify({ title, body }) });
  } catch { /* silencioso */ }
}
