import { supabase } from "./supabase";

// Returns [{id,title,category,description,duration,audioUrl,dataUrl,pngUrl}]
export async function loadGallery() {
  if (supabase) {
    const { data, error } = await supabase.from("gallery").select("*").order("id");
    if (error) throw error;
    const pub = (p) => supabase.storage.from("gallery").getPublicUrl(p).data.publicUrl;
    return data.map((r) => ({
      ...r,
      audioUrl: pub(r.audio),
      dataUrl: pub(r.data),
      pngUrl: pub(r.png),
    }));
  }
  // local fallback: assets bundled in /public/gallery
  const items = await (await fetch("/gallery/manifest.json")).json();
  return items.map((it) => ({
    ...it,
    audioUrl: `/gallery/${it.audio}`,
    dataUrl: `/gallery/${it.data}`,
    pngUrl: `/gallery/${it.png}`,
  }));
}

export async function loadSpectrogramData(url) {
  return (await fetch(url)).json();
}
