export default function Home() {
  return (
    <div className="home">
      <h1>See what sound looks like.</h1>
      <p className="lede">
        A spectrogram turns a sound into a picture — time across, frequency up, brightness
        for energy. Drop in your own clip, or explore a gallery of example sounds with the
        audio locked to the visual.
      </p>
      <div className="cards">
        <a className="card" href="/spectrogram">
          <span className="num">01</span>
          <h3>Upload a sound</h3>
          <p>Send any clip to the librosa engine and view its spectrogram, with a playhead and hover readout.</p>
        </a>
        <a className="card" href="/gallery">
          <span className="num">02</span>
          <h3>Explore the gallery</h3>
          <p>Curated sounds — tones, a sweep, percussion, voiced vs. unvoiced — each synced to its spectrogram.</p>
        </a>
      </div>
    </div>
  );
}
