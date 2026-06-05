import LiveSpectrogram from "@/components/LiveSpectrogram";

export default function LivePage() {
  return (
    <div className="gallery">
      <h2>Live spectrogram</h2>
      <p className="sub">
        Allow microphone access, then make some sound — whistle a glide, hum, or speak.
        New audio enters at the right and scrolls left; frequency runs bottom (low) to top (high).
      </p>
      <LiveSpectrogram title="Live microphone" />
    </div>
  );
}
