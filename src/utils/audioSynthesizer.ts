/**
 * Cinematic Procedural Audio Synthesizer & Mixer
 * Generates dynamic cinematic soundscapes, transition sound effects,
 * and mixes Gemini TTS voiceovers into the export stream using Web Audio API.
 */

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private voiceGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isPlaying = false;
  private activeNodes: (AudioNode | number)[] = [];
  private currentTrack = 'epic-orchestral';
  private streamDestination: MediaStreamAudioDestinationNode | null = null;
  private currentVoiceAudio: HTMLAudioElement | null = null;

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.voiceGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.musicGain.connect(this.masterGain);
      this.voiceGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);

      this.masterGain.connect(this.ctx.destination);
      this.streamDestination = this.ctx.createMediaStreamDestination();
      this.masterGain.connect(this.streamDestination);

      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.musicGain.gain.setValueAtTime(0.6, this.ctx.currentTime);
      this.voiceGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getAudioStream(): MediaStream | null {
    this.init();
    return this.streamDestination ? this.streamDestination.stream : null;
  }

  public setVolumes(music: number, voice: number, sfx: number) {
    if (!this.ctx || !this.musicGain || !this.voiceGain || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.musicGain.gain.setTargetAtTime(Math.max(0, Math.min(1, music)), now, 0.05);
    this.voiceGain.gain.setTargetAtTime(Math.max(0, Math.min(1, voice)), now, 0.05);
    this.sfxGain.gain.setTargetAtTime(Math.max(0, Math.min(1, sfx)), now, 0.05);
  }

  public startSoundtrack(trackId: string) {
    this.init();
    this.stopSoundtrack();
    if (!this.ctx || !this.musicGain || trackId === 'none') return;

    this.isPlaying = true;
    this.currentTrack = trackId;

    if (trackId === 'epic-orchestral') {
      this.playEpicOrchestral();
    } else if (trackId === 'cyberpunk-synth') {
      this.playCyberpunkSynth();
    } else if (trackId === 'ambient-space') {
      this.playAmbientSpace();
    } else if (trackId === 'cinema-piano') {
      this.playCinematicPiano();
    } else if (trackId === 'tension-pulse') {
      this.playTensionPulse();
    }
  }

  public stopSoundtrack() {
    this.isPlaying = false;
    this.activeNodes.forEach(item => {
      if (typeof item === 'number') {
        window.clearInterval(item);
      } else {
        try {
          if ('stop' in item && typeof (item as AudioScheduledSourceNode).stop === 'function') {
            (item as AudioScheduledSourceNode).stop();
          }
          item.disconnect();
        } catch {
          // ignore already stopped nodes
        }
      }
    });
    this.activeNodes = [];
  }

  public playTransitionSFX(type: string) {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    if (type === 'crossfade' || type === 'wipe-left') {
      // Cinematic Whoosh
      const bufferSize = ctx.sampleRate * 0.8;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(200, now);
      filter.frequency.exponentialRampToValueAtTime(3200, now + 0.4);
      filter.frequency.exponentialRampToValueAtTime(150, now + 0.8);
      filter.Q.setValueAtTime(3, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.45, now + 0.35);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.8);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      noise.start(now);
      noise.stop(now + 0.85);
    } else if (type === 'dip-to-black' || type === 'dip-to-white') {
      // Deep Sub-Bass Drop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 1.1);

      gain.gain.setValueAtTime(0.65, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 1.25);
    } else if (type === 'zoom-glitch') {
      // Digital glitch click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(150, now + 0.05);
      osc.frequency.setValueAtTime(1200, now + 0.1);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'film-burn') {
      // Warm optical shutter snap
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.3);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.36);
    }
  }

  public playVoiceover(audioBase64OrUrl: string) {
    this.init();
    if (!audioBase64OrUrl) return;

    if (this.currentVoiceAudio) {
      this.currentVoiceAudio.pause();
      this.currentVoiceAudio = null;
    }

    try {
      const audio = new Audio();
      audio.src = audioBase64OrUrl.startsWith('data:') || audioBase64OrUrl.startsWith('http') || audioBase64OrUrl.startsWith('blob:')
        ? audioBase64OrUrl
        : `data:audio/wav;base64,${audioBase64OrUrl}`;

      audio.crossOrigin = 'anonymous';

      if (this.ctx && this.voiceGain && this.streamDestination) {
        const source = this.ctx.createMediaElementSource(audio);
        source.connect(this.voiceGain);
      }

      this.currentVoiceAudio = audio;
      audio.play().catch(() => {});
    } catch {
      // audio play fallback
    }
  }

  public stopVoiceover() {
    if (this.currentVoiceAudio) {
      this.currentVoiceAudio.pause();
      this.currentVoiceAudio = null;
    }
  }

  // --- Internal Procedural Generators ---

  private playEpicOrchestral() {
    if (!this.ctx || !this.musicGain) return;
    const ctx = this.ctx;

    // Chord roots in D minor: D2 (73.4Hz), F2 (87.3Hz), A2 (110Hz), C3 (130.8Hz)
    const chords = [
      [73.42, 110.0, 146.83, 220.0], // D minor
      [65.41, 98.0, 130.81, 196.0],  // C major
      [58.27, 87.31, 116.54, 174.61], // Bb major
      [65.41, 98.0, 130.81, 196.0],  // C major
    ];

    let chordIndex = 0;

    const playChordStep = () => {
      if (!this.isPlaying || !this.ctx || !this.musicGain) return;
      const now = ctx.currentTime;
      const freqs = chords[chordIndex % chords.length];
      chordIndex++;

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = idx === 0 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(idx === 0 ? 350 : 800 + Math.sin(now) * 200, now);
        filter.Q.setValueAtTime(2, now);

        const duration = 6.0;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(idx === 0 ? 0.22 : 0.12, now + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain!);

        osc.start(now);
        osc.stop(now + duration + 0.1);
      });
    };

    playChordStep();
    const interval = window.setInterval(playChordStep, 5000);
    this.activeNodes.push(interval);
  }

  private playCyberpunkSynth() {
    if (!this.ctx || !this.musicGain) return;
    const ctx = this.ctx;

    // Bass notes: F1 (43.65Hz), Ab1 (51.91Hz), Eb1 (38.89Hz), Bb1 (58.27Hz)
    const bassNotes = [43.65, 51.91, 38.89, 58.27];
    const arpeggios = [174.61, 207.65, 261.63, 349.23, 415.3, 523.25];
    let step = 0;

    const tick = () => {
      if (!this.isPlaying || !this.ctx || !this.musicGain) return;
      const now = ctx.currentTime;

      // 16th note arp synth
      const arpFreq = arpeggios[step % arpeggios.length];
      const arpOsc = ctx.createOscillator();
      const arpGain = ctx.createGain();
      const arpFilter = ctx.createBiquadFilter();

      arpOsc.type = 'sawtooth';
      arpOsc.frequency.setValueAtTime(arpFreq, now);

      arpFilter.type = 'lowpass';
      arpFilter.frequency.setValueAtTime(1400 + Math.sin(step * 0.4) * 800, now);
      arpFilter.Q.setValueAtTime(5, now);

      arpGain.gain.setValueAtTime(0.08, now);
      arpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      arpOsc.connect(arpFilter);
      arpFilter.connect(arpGain);
      arpGain.connect(this.musicGain!);

      arpOsc.start(now);
      arpOsc.stop(now + 0.2);

      // Downbeat Heavy Sub Bass every 8 steps
      if (step % 8 === 0) {
        const bassFreq = bassNotes[Math.floor(step / 8) % bassNotes.length];
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();

        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(bassFreq, now);

        bassGain.gain.setValueAtTime(0.35, now);
        bassGain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

        bassOsc.connect(bassGain);
        bassGain.connect(this.musicGain!);

        bassOsc.start(now);
        bassOsc.stop(now + 1.3);
      }

      step++;
    };

    const interval = window.setInterval(tick, 180);
    this.activeNodes.push(interval);
  }

  private playAmbientSpace() {
    if (!this.ctx || !this.musicGain) return;
    const ctx = this.ctx;

    // Harmonic cosmic drone: 55Hz (A1), 110Hz (A2), 164.81Hz (E3), 277.18Hz (C#4)
    const tones = [55.0, 110.0, 164.81, 277.18, 329.63];

    tones.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Detune slightly for lush shimmering beating
      osc.detune.setValueAtTime((idx - 2) * 4.5, ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(500 + idx * 150, ctx.currentTime);

      gain.gain.setValueAtTime(0.05 + (1 / (idx + 2)) * 0.08, ctx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain!);

      osc.start();
      this.activeNodes.push(osc);
    });
  }

  private playCinematicPiano() {
    if (!this.ctx || !this.musicGain) return;
    const ctx = this.ctx;

    const chords = [
      [130.81, 164.81, 196.0, 246.94], // C maj 7
      [110.0, 130.81, 164.81, 196.0],  // A min 7
      [87.31, 130.81, 164.81, 174.61],  // F maj
      [98.0, 123.47, 146.83, 196.0],   // G maj
    ];

    let chordIdx = 0;

    const playStep = () => {
      if (!this.isPlaying || !this.ctx || !this.musicGain) return;
      const now = ctx.currentTime;
      const notes = chords[chordIdx % chords.length];
      chordIdx++;

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);

        gain.gain.setValueAtTime(0.001, now + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.18, now + i * 0.12 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 3.8);

        osc.connect(gain);
        gain.connect(this.musicGain!);

        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 4.0);
      });
    };

    playStep();
    const interval = window.setInterval(playStep, 4500);
    this.activeNodes.push(interval);
  }

  private playTensionPulse() {
    if (!this.ctx || !this.musicGain) return;
    const ctx = this.ctx;

    let beat = 0;
    const tick = () => {
      if (!this.isPlaying || !this.ctx || !this.musicGain) return;
      const now = ctx.currentTime;

      // Heartbeat sub pulse
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(52, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.12);

      gain.gain.setValueAtTime(0.38, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(now);
      osc.stop(now + 0.2);

      // Ticking transient
      const click = ctx.createOscillator();
      const clickGain = ctx.createGain();
      click.type = 'square';
      click.frequency.setValueAtTime(2400, now);

      clickGain.gain.setValueAtTime(0.04, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      click.connect(clickGain);
      clickGain.connect(this.musicGain!);
      click.start(now);
      click.stop(now + 0.04);

      beat++;
    };

    const interval = window.setInterval(tick, 600);
    this.activeNodes.push(interval);
  }
}

export const audioSynthesizer = new AudioSynthesizer();
