import { NextResponse } from "next/server";
export const runtime = "nodejs";

// Genera preguntas con IA SI hay ANTHROPIC_API_KEY; si no, devuelve [] y la app
// usa el banco curado/procedural (degradación elegante).
export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ questions: [] });
  try {
    const { subject, level, topic, n } = await req.json();
    const count = Math.min(8, Math.max(3, n || 5));
    const prompt = `Genera ${count} preguntas tipo test de "${subject}" para nivel "${level}"${topic ? ` sobre "${topic}"` : ""}, en español, claras y con una sola respuesta correcta. Devuelve SOLO JSON válido sin texto extra ni markdown, con esta forma exacta: {"questions":[{"q":"enunciado","options":["a","b","c","d"],"answer":0}]} donde answer es el índice (0-3) de la opción correcta.`;
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 1500, messages: [{ role: "user", content: prompt }] }),
    });
    const data = await r.json();
    const text = (data.content || []).filter((c: { type: string }) => c.type === "text").map((c: { text: string }) => c.text).join("");
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return NextResponse.json({ questions: parsed.questions || [] });
  } catch {
    return NextResponse.json({ questions: [] });
  }
}
