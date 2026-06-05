import GalleryExplorer from "@/components/GalleryExplorer";
export default function GalleryPage() {
  return (
    <div className="gallery">
      <h2>Sound gallery</h2>
      <p className="sub">Pick a sound — it plays with a playhead sweeping its spectrogram.</p>
      <GalleryExplorer />
    </div>
  );
}
