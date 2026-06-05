
# TUTORIAL ON AUDIO PROCESSING

Web-app link: https://another-audio-tutorial-jxafwrm71-nevernuras-projects.vercel.app/

More details: https://www.kaggle.com/code/nurafreeccss/audio-preprocessing/edit/run/307626528

# What is a Signal?

In simple words, signal is anything that has some message. Be it physical stimuli, some eye-to-eye contact, some action, everything that gives a message can become a signal.

It's hard to broadly define what it is, because it has such a vast domain.
Signal can mean various kinds of signals - traffic signal, digital signal, analog signal, a beacon, a code - but it all boils down to the same fundamental thing. Signals convey messages. Can be between people, between computers, between machines and humans, between animals, animals and humans - anything.

## Technical definition of Signal

A Signal is any "entity" that changes over a certain measurable "parameter". That entity is usually represented as a function of the parameter which can be time, space or anything that is quantifiable.

For example, we sin(wt) is a function of t which can represented as a signal. An image is also a signal, which is represented in a 2D grid of numeric (pixel) values as a function of space.

**Is a Audio a Signal**?
Yes, Audio is a Signal. It is a continuous variation of sound, this variation when measured creates waves also called sound waves.

# What is an Audio Signal?
Audio signals are sound signals, defined as pressure variations travelling through the air. These variations in pressure can be described as waves and correspondingly they are often called sound waves.

librosa.load() reads the audio path and returns two variable:
* y - Number of samples (ndarray of floating point values)
* sr - Sampling rate

These properties tell us:

Duration: The length of the audio in seconds

Sample rate: The number of samples per second (typically 22050 Hz for librosa)

Number of samples: Total data points in the audio signal

Shape: The dimensions of the numpy array (should be 1D for mono audio)

## What is Sampling rate?
Sampling rate is the number of samples we take of the audio signal per second. In simpler words, it is the number of snapshots or peeks we take at the signal. The more snapshots you take, the more accurately the discrete 0s and 1s of the digital representation correspond to the infinitely smooth and continuous original analog wave front.

## Sample Rate (Along the X-axis)
Determines the **width of your digital steps**.
If the sample rate is low, the steps are wide. This means the system is ''blind'' to what happens between those snapshots. Fast, high-frequency oscillations (like a hi-hat in music or a quick spike in data) are completely missed because they occur and disappear between the samples.

## Amplitude (Along the Y-axis)
Amplitude precision (often called Bit Depth) determines the **height of your digital steps**.
It defines how many "levels" or "slots" are available to measure the vertical height of the wave.
If you have low amplitude precision, the system has to "round" the wave’s true height to the nearest available level. This rounding creates the vertical "staircase" jumps. The difference between the actual wave and the rounded digital level is called quantization error, which appears as noise or distortion in the final signal.

### Key Takeaway: Take a high enough sampling rate! :)

### Listening to the audio
We can use IPython.display.Audio to play the audio in our notebook as shown below.

### Listening to the effects that sampling rate has

## Visualize the waveform
Now, we will check the basic representation of the audio signal with respect to time.

An audio signal is then represented by a sequence of numbers $x_n$ which represent the relative air pressure at time-instant $n \in N$



For that, we will use librosa.display.waveshow(sample, sampling_rate)

Interpretation of  the waveform:
* x-axis represents time
* y-axis represents the amplitude of the signal
* Louder parts of the audio will have larger amplitudes (taller waves)
* Quiet parts will be closer to the center line

# What is Windowing? And why?
Let's first understand the why.
Our audio signal is a continuous variation of numbers (amplitude) with respect to time. To extract information from this signal, we must therefore split the signal into sufficiently short segments. In other words, we want to extract segments which are short enough that the properties of the speech signal does not have time change within that segment.

A classical method to split the input into temporal segments is known as **Windowing**

# Spectrogram
## What is a Spectrogram?
A Spectrogram is a visual representation of an audio signal. This representation shows how the frequency-domain content of the signal changes over time. The graph's x-axis denotes the time and the y-axis denotes the frequency of the signal.

**Note**: Frequency domain content is also referred to as Spectral content


### What are the steps involved in Spectrogram?

1. Short Time Fourier Transform (**STFT**) - Converts the signal from time-domain to the frequency domain.
2. Windowing
3. FT each frame

## Fourier Transform

### Discrete Fourier Transform (DFT)
The DFT transforms our signal from the time-domain to the frequency domain. We use the formula:

$ X_{k}=\sum _{n=0}^{N-1}x_{n}\cdot e^{-i\cdot 2\pi \cdot k\cdot n/N}$

where:

$k$: Current frequency index $ 0\le k\le N-1 $

$N$: Total number of samples

$n$: Current sample index

$x_{n}$: Value of the signal in the time domain at index $n$

$X_{k}$: Frequency-domain coefficient (complex number containing amplitude and phase)

$i$: Imaginary unit $\sqrt{-1}$.


Another form of the DFT (using Euler's formula)

$ X_{k}=\sum _{n=0}^{N-1}x_{n} \cdot \cos(2\pi \cdot k\cdot n/N) - i\sin(2\pi \cdot k\cdot n/N)$

The DFT has a time complexity of $O(n^2)$ which makes it extremely slow for larger number of samples (Say, 10000).  Due to this, we move on to Fast Fourier Transform (FFT).

## Fast Fourier Transform (FFT).

**FFT** relies on the fact that a DFT of size $N$ can be rewritten as the sum of two DFTs of size $N/2$.

$$X_k = E_k + e^{-\frac{i 2\pi}{N} k} \cdot O_k$$

Where:

$E_k$ is the DFT of the even-indexed elements.

$O_k$ is the DFT of the odd-indexed elements.

$e^{-\frac{i 2\pi}{N} k}$ is called the Twiddle Factor.

### Short Time Fourier Transform (STFT)

## Mel Spectrogram

Studies have shown that humans do not perceive frequencies on a linear scale. We are better at detecting differences in lower frequencies than higher frequencies. For example, we can easily tell the difference between 500 and 1000 Hz, but we will hardly be able to tell a difference between 10,000 and 10,500 Hz, even though the distance between the two pairs are the same.

In 1937, Stevens, Volkmann, and Newmann proposed a unit of pitch such that equal distances in pitch sounded equally distant to the listener. This is called the mel scale. We perform a mathematical operation on frequencies to convert them to the mel scale.

Mathematically, $$ m = 2595 \times log_{10}(1 + \frac{f}{700}) $$

**Mel Spectrogram**

Similar to the spectrogram for visual representation, the Mel Spectrogram is a visual representation of the audio signal in the Mel scale.

---
# Interlude — A Gallery of Sounds

Now that we can read a spectrogram, let's tour several *kinds* of sound and see how each one looks. Different sounds make different features stand out, which is exactly why we have so many features. Each entry below is **layered**: a plain-English *intuition* line, then a short **"The math"** block for the formal grounding.

### 1. Pure tone — 440 Hz (the note "A")
**Intuition.** The simplest sound: one steady frequency, a plain hum.
**The math.** A sampled sinusoid $x[n]=A\sin(2\pi f n/f_s+\varphi)$ has a spectrum that is a single line at $f$ — one flat horizontal stripe.

### 2. Two tones together
**Intuition.** Add a second frequency (660 Hz) and the sound gets richer, chord-like.
**The math.** The Fourier transform is **linear**, so the spectrum of a sum is the sum of the spectra — *two* lines. Any sound is a stack of simple tones like these.

### 3. Chirp — a frequency sweep
**Intuition.** The pitch slides up from 200 Hz to 8 kHz — a rising "wheeee", a clean diagonal line.
**The math.** Instantaneous frequency is the derivative of phase. With $\phi(t)=2\pi(f_0 t+\tfrac{f_1-f_0}{2T}t^2)$, $\ f(t)=\tfrac{1}{2\pi}\tfrac{d\phi}{dt}=f_0+\tfrac{f_1-f_0}{T}t$ — a straight line. This is the ideal signal for **aliasing**: by the **Nyquist limit**, anything above $f_s/2$ folds back to a lower frequency.

### 4. Percussion — kick & snare
**Intuition.** Thump, *tss*, thump, *tss* — kicks are low blobs, snares are tall broadband streaks.
**The math.** Percussion is dominated by **transients**. The time–frequency **uncertainty principle** ($\Delta t\,\Delta f \gtrsim \tfrac{1}{4\pi}$) says a sound sharp in *time* must be spread in *frequency* — which is why a snare smears across the band, and why ZCR and RMS react so strongly to it.

### 5. A real instrument — trumpet
**Intuition.** A real recording shows a *ladder* of evenly spaced lines plus a little breath noise.
**The math.** A sustained pitched instrument is **harmonic**: energy at integer multiples $f_k=k f_0$. The relative heights of those harmonics are what we hear as **timbre**.

### 6. Nature — birdsong
**Intuition.** A solo robin: rapid swooping curves high up, unlike steady instrument stripes.
**The math.** Birdsong is **non-stationary** and strongly **frequency-modulated** — only a time–frequency view (the spectrogram) captures it; a single transform of the whole clip would blur it away.

### 7. Singing voice
**Intuition.** A sustained "ahh" with a gentle wobble; a tall stack of harmonics, each *wiggling*.
**The math.** The wiggle is **vibrato** — a slow frequency modulation $F_0(t)=F_0(1+d\sin 2\pi f_{\text{vib}}t)$. Each harmonic at $kF_0$ wiggles $k$ times as much, so the wobble grows toward the top. Singing is a sustained, musical version of the voiced speech we look at next.

# Time-domain Features

Time-domain features are extracted directly from the audio waveform. These features capture temporal characteristics of the audio signal and are often computationally efficient to calculate. In this section, we’ll explore two important time-domain features: Root Mean Square (RMS) Energy and Zero Crossing Rate (ZCR).

## RMS Energy - The square root of the mean of the square.

RMS is (to engineers anyway) a meaningful way of calculating the average of values over a period of time. With audio, the signal value (amplitude) is squared, averaged over a period of time, then the square root of the result is calculated. The result is a value, that when squared, is related (proportional) to the effective power of the signal.

## Zero Crossing Rate

The Zero-Crossing Rate (ZCR) of an audio frame is the rate of sign-changes of the signal during the frame. In other words, it is the number of times the signal changes value, from positive to negative and vice versa, divided by the length of the frame.

In more simpler words, it is the rate at which the signal crosses zero.

### RMS + ZCR Combined

#### Feature Statistics

We often need to summarize these data for use in Machine Learning models.

---
# Speech Up Close — Voiced vs. Unvoiced, Male vs. Female

We just used RMS energy and the zero-crossing rate. Here is where they earn their keep: telling apart the two basic classes of speech sound.

**Intuition.** Speech is a *buzz* or a *hiss* (the source) shaped by the tube of your mouth and throat (the filter).

**The math — the source-filter model.** Over a short frame, speech is the source $e[n]$ convolved with the vocal-tract response $v[n]$: $\ s[n]=(e*v)[n]\Leftrightarrow S=E\cdot V$. Only the **source** changes between the two classes:
- **Voiced** (vowels, "m", "z"): the folds buzz periodically → source is an impulse train → spectrum is a **comb of harmonics** at multiples of $F_0$, with $|V|$ shaping the envelope.
- **Unvoiced** (hisses "s", "f", "sh"): the source is **white noise** (flat spectrum) → output is just $|V|^2$ — broadband, no harmonic lines.

**Formants** are the resonances of $V$, built as 2-pole resonators — exactly what `vocal_tract()` implements: $\ H(z)=\frac{1-r}{1-2r\cos\theta\,z^{-1}+r^2 z^{-2}}$ with $\theta=2\pi f_{\text{formant}}/f_s$.

### Voiced vs. unvoiced — see it and hear it

**Intuition.** Voiced = neat horizontal stripes (it has pitch); unvoiced = a fuzzy wash (no pitch). Now confirm with *numbers*.
**The math — zero-crossing rate.** $\ \text{ZCR}=\frac{1}{2N}\sum_{n=1}^{N-1}|\operatorname{sgn}(x[n])-\operatorname{sgn}(x[n-1])|$. For energy near a frequency $f$, $\ \text{ZCR}\approx 2f/f_s$. Unvoiced energy sits high → many crossings → high ZCR. **RMS** $=\sqrt{\tfrac1N\sum x[n]^2}$ measures loudness; voiced usually carries more.

The higher ZCR (and lower energy) of the hiss is enough to build a basic **voiced/unvoiced detector** — the kind used inside speech recognisers.

### Male vs. female voice
**Intuition.** Same vowel, different **pitch**: ~110–150 Hz (male) vs ~190–250 Hz (female). The harmonic stripes spread apart as pitch rises.
**The math.** Harmonic spacing equals $F_0$, so higher pitch widens the gaps. There is also a physical effect: a vocal tract of length $L$ (closed–open tube) resonates at $f_k=(2k-1)c/4L$, so a shorter (female-average) tract pushes the **formants** up ~15–20% too — both pitch *and* timbre shift.

We can *measure* the pitch with `librosa.pyin` (a probabilistic version of the YIN autocorrelation method) and confirm the two differ.

### Try it yourself — record your own voice (Colab)

Run the next cell, then call `record_audio()`. Your browser will ask for **microphone permission** — allow it and speak for a few seconds. Try a long **"aaah"** (voiced) and a long **"sssss"** (unvoiced), and compare the spectrograms and the ZCR/F0 numbers above.

# Frequency domain features

While time-domain features talks about the temporal characteristics of audio/speech signals, frequency-domain features provide information about the **spectral content** (energy, frequency) of the signal.
In this section, we’ll explore three important frequency-domain features:

1. Short-time Fourier Transform (STFT)
2. Spectral Centroid
3. Spectral Rolloff

## Short Time Fourier Transform (STFT)

The STFT uses the DFT alongside a windowing function $w_n$. Mathematically,

$STFT(X_{k}, w_{n}) =\sum _{n=0}^{N-1}x_{n} \cdot w_n \cdot e^{-i\cdot 2\pi \cdot k\cdot n/N}$

A further parallel with a spectrum is that the output of the STFT is complex-valued, though where the spectrum is a vector, the STFT output is a matrix. As a consequence, we cannot directly visualize the complex-valued output. Instead, STFTs are usually visualized using their log-spectra, $20 \cdot log(X)$. Such 2 dimensional log-spectra can then be visualized with a heat-map known as a spectrogram.

#### Band Energy Ratio

Compare energy in frequency bands. Measure how dominant lower frequencies are.

## Spectral Centroid

Measure of centre of mass of sounds in frequency terms. Think of it as the "brightness of sound". In other words, it shows us which frequency is dominating at which point of time.

Spectral Centroid $= \frac{\sum f \cdot m(f)}{\sum m(f)}$

where,

$f$ - Frequency

$m(f)$ - Magnitude of $f$

## Spectral Rolloff

Frequency below which a certain percentage of total spectral energy lies. Another measure of the spectral shape of the sound.

### Spectral Centroid + Rolloff

### Mel-frequency Cepstral Coefficients (MFCCs)

Relates how humans perceive pitch and frequency content. Think of audio fingerprint and MFCCs capture that.

Delta MFCCs
* What does the sound look like right now?
* Then, Delta says How is the sound changing right now?

# Chroma Features

Chroma Features describe how much energy the audio has in each of the 12 musical pitch classes, ignoring octave.
Big idea (plain English)

Western music can be reduced to 12 notes:

C, C♯/D♭, D, D♯/E♭, E, F, F♯/G♭, G, G♯/A♭, A, A♯/B♭, B

Chroma features answer:

“At this moment, how strong is each of these 12 notes?”

So instead of tracking where a note sits in frequency (octave), chroma tracks which note it is.
