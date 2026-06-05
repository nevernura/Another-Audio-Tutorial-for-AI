// Seed Supabase from precompute/gallery: uploads files to the 'gallery' bucket and
// inserts manifest rows. Needs a SERVICE ROLE key (never ship this in the browser).
//
//   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node scripts/seed-supabase.mjs ../audio_app_backend/precompute/gallery
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";

const dir = process.argv[2] || "../audio_app_backend/precompute/gallery";
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const manifest = JSON.parse(readFileSync(join(dir, "manifest.json")));
for (const f of readdirSync(dir)) {
  if (f === "manifest.json") continue;
  const type = f.endsWith(".png") ? "image/png" : f.endsWith(".wav") ? "audio/wav" : "application/json";
  const { error } = await sb.storage.from("gallery").upload(f, readFileSync(join(dir, f)),
    { contentType: type, upsert: true });
  if (error) console.error("upload", f, error.message); else console.log("uploaded", f);
}
const { error } = await sb.from("gallery").upsert(manifest);
console.log(error ? "rows error: " + error.message : `inserted ${manifest.length} rows`);
