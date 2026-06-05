// Proxies an uploaded file to the Python/librosa service (keeps its URL server-side, avoids CORS).
export async function POST(req) {
  const base = process.env.SPECTRO_URL || "http://localhost:8000";
  try {
    const inForm = await req.formData();
    const file = inForm.get("file");
    if (!file) return Response.json({ error: "no file" }, { status: 400 });
    const out = new FormData();
    out.append("file", file, file.name || "upload.wav");
    const res = await fetch(`${base}/spectrogram`, { method: "POST", body: out });
    const text = await res.text();
    return new Response(text, { status: res.status, headers: { "content-type": "application/json" } });
  } catch (e) {
    return Response.json({ error: `service unreachable at ${base}: ${e.message}` }, { status: 502 });
  }
}
