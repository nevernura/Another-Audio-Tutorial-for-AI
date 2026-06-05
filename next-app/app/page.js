export default function Home() {
  return (
    <div className="home">
      <h1>See what sound looks like.</h1>
      <p className="lede">
        A spectrogram turns a sound into a picture — time across, frequency up, brightness
        for energy. Walk through the lessons, then explore a gallery of example sounds with
        the audio locked to the visual.
      </p>
      <div className="cards">
        <a className="card" href="/learn">
          <span className="num">01</span>
          <h3>Start the lessons</h3>
          <p>Nine guided steps from a single wave to spectrograms, mel scale, and reading real sounds.</p>
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
