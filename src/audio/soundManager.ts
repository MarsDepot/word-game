/**
 * Sound and Music Synthesizer for Word Ragnarok RPG
 * Generates realistic soft piano notes, soothing town BGM, and intense boss battle BGM using Web Audio API,
 * as well as authentic RPG sound effects and text-to-speech pronunciation.
 */

export type BgmTrack = 'town' | 'boss' | 'forest' | 'track1' | 'track2' | 'track3' | 'none';

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  
  private currentTrack: 'town' | 'boss' | 'forest' | 'none' = 'none';
  private isBgmPlaying: boolean = false;
  private bgmTimer: number | null = null;
  private bgmStep: number = 0;
  private isMuted: boolean = false;
  private bgmVolume: number = 0.5;
  private sfxVolume: number = 0.7;

  constructor() {
    // Lazy initialize on first user gesture
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 1;
      this.masterGain.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = this.bgmVolume;
      this.bgmGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public enableAudio() {
    this.initContext();
    if (this.currentTrack !== 'none' && !this.isBgmPlaying) {
      this.startBgmLoop();
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 1, this.ctx.currentTime);
    }
  }

  public isAudioMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(bgm: number, sfx: number) {
    this.bgmVolume = Math.max(0, Math.min(1, bgm));
    this.sfxVolume = Math.max(0, Math.min(1, sfx));
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(this.bgmVolume, this.ctx.currentTime);
    }
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
  }

  /**
   * Synthesizes an acoustic piano note using additive synthesis with realistic overtones
   * @param freq Note frequency in Hz
   * @param duration Note duration in seconds
   * @param velocity Key strike strength (0.1 to 1.0)
   * @param isBgm Whether this is part of the BGM track
   */
  public playPianoNote(freq: number, duration: number = 1.2, velocity: number = 0.5, isBgm: boolean = false, delay: number = 0) {
    this.initContext();
    if (!this.ctx) return;

    const startTime = this.ctx.currentTime + delay;
    const dest = isBgm ? this.bgmGain! : this.sfxGain!;

    // Harmonics for piano timbre
    const harmonics = [
      { ratio: 1.0, gain: 1.0 * velocity, decay: duration },
      { ratio: 2.0, gain: 0.5 * velocity, decay: duration * 0.7 },
      { ratio: 3.0, gain: 0.25 * velocity, decay: duration * 0.5 },
      { ratio: 4.0, gain: 0.12 * velocity, decay: duration * 0.35 },
      { ratio: 5.0, gain: 0.06 * velocity, decay: duration * 0.25 },
      { ratio: 6.0, gain: 0.03 * velocity, decay: duration * 0.18 },
    ];

    harmonics.forEach(({ ratio, gain: hGain, decay }) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      osc.type = 'triangle'; // triangle has softer, warmer overtones closer to felt piano hammers
      osc.frequency.setValueAtTime(freq * ratio, startTime);

      // Attack: fast hammer strike 3-5ms
      noteGain.gain.setValueAtTime(0, startTime);
      noteGain.gain.linearRampToValueAtTime(hGain * 0.22, startTime + 0.005);
      
      // Decay & Release: exponential decay
      noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + decay);

      osc.connect(noteGain);
      noteGain.connect(dest);

      osc.start(startTime);
      osc.stop(startTime + decay + 0.05);
    });

    // Add subtle hammer click transient for tactile authenticity
    const noiseBuffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.02), this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < output.length; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (output.length * 0.2));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(Math.min(freq * 2, 4000), startTime);
    filter.Q.value = 3;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(velocity * 0.08, startTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.02);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(dest);

    noise.start(startTime);
    noise.stop(startTime + 0.03);
  }

  // MIDI Note to Frequency converter
  private m2f(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  /**
   * Switch and manage BGM state
   */
  public playBGM(mode: BgmTrack) {
    if (mode === 'none') {
      this.stopBGM();
      return;
    }
    const resolvedMode: 'town' | 'boss' | 'forest' = 
      mode === 'track1' ? 'town' :
      mode === 'track2' ? 'boss' :
      mode === 'track3' ? 'forest' : mode;

    if (this.currentTrack === resolvedMode && this.isBgmPlaying) return;
    this.stopBGM();
    this.currentTrack = resolvedMode;
    this.bgmStep = 0;
    this.isBgmPlaying = true;
    this.initContext();
    this.startBgmLoop();
  }

  public stopBGM() {
    this.isBgmPlaying = false;
    if (this.bgmTimer) {
      window.clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
    this.currentTrack = 'none';
  }

  public getCurrentTrack(): 'town' | 'boss' | 'forest' | 'none' {
    return this.currentTrack;
  }

  public isBgmRunning(): boolean {
    return this.isBgmPlaying;
  }

  private startBgmLoop() {
    if (!this.isBgmPlaying) return;

    if (this.currentTrack === 'town') {
      this.tickTownPiano();
    } else if (this.currentTrack === 'boss') {
      this.tickBossPiano();
    } else if (this.currentTrack === 'forest') {
      this.tickForestPiano();
    }
  }

  /**
   * ROMANTIC SOOTHING PIANO (Town / Exploration Mode)
   * Inspired by Ragnarok Online's classic soothing melodies (Prontera, Theme of Payon, Wanna Be Free).
   * Warm, lyrical 7th & 9th arpeggios with gentle romantic motifs.
   */
  private tickTownPiano() {
    if (!this.isBgmPlaying || this.currentTrack !== 'town') return;

    // 16-bar romantic chord progression:
    // [Cmaj9, Am9, Fmaj7, G7sus4], [Em7, Am7, Dm9, G13],
    // [Fmaj7, G/F, Em7, A7b9], [Dm9, G7sus4, Cmaj9, Cmaj9]
    const townChords = [
      // Bar 0: Cmaj9
      { bass: [48, 55, 60, 64], melody: [72, 74, 76, 74] },
      // Bar 1: Am9
      { bass: [45, 52, 57, 60], melody: [71, 72, 74, 72] },
      // Bar 2: Fmaj7
      { bass: [41, 48, 53, 57], melody: [69, 71, 72, 76] },
      // Bar 3: G7sus4 -> G7
      { bass: [43, 50, 55, 58], melody: [74, 72, 71, 69] },
      // Bar 4: Em7
      { bass: [40, 47, 52, 55], melody: [71, 72, 74, 76] },
      // Bar 5: A7(b13)
      { bass: [45, 52, 57, 61], melody: [77, 76, 74, 73] },
      // Bar 6: Dm9
      { bass: [50, 57, 62, 65], melody: [76, 74, 72, 71] },
      // Bar 7: G13
      { bass: [43, 50, 55, 59], melody: [71, 74, 77, 79] },
      // Bar 8: Fmaj9
      { bass: [41, 48, 55, 57], melody: [76, 77, 79, 77] },
      // Bar 9: Em7
      { bass: [40, 47, 52, 55], melody: [76, 74, 72, 71] },
      // Bar 10: Dm9
      { bass: [50, 57, 62, 65], melody: [69, 72, 74, 76] },
      // Bar 11: G7sus4
      { bass: [43, 50, 55, 60], melody: [74, 72, 71, 67] },
      // Bar 12: Cmaj7
      { bass: [48, 55, 60, 64], melody: [72, 74, 76, 79] },
      // Bar 13: Asus4 -> A7
      { bass: [45, 52, 57, 61], melody: [81, 79, 76, 74] },
      // Bar 14: Dm7 -> G7
      { bass: [50, 55, 59, 62], melody: [72, 74, 76, 74] },
      // Bar 15: Cmaj9 resolve
      { bass: [48, 55, 60, 64], melody: [72, 71, 72, 72] },
    ];

    const currentBar = townChords[this.bgmStep % townChords.length];
    const beatDuration = 0.58; // gentle, flowing andante tempo (~103 BPM)

    // Arpeggiate the left-hand bass/chords
    currentBar.bass.forEach((note, idx) => {
      const delay = idx * (beatDuration * 0.95);
      this.playPianoNote(this.m2f(note), 2.2, 0.38 + (idx === 0 ? 0.15 : 0), true, delay);
    });

    // Play melody with delicate expressive dynamics
    currentBar.melody.forEach((note, idx) => {
      const delay = idx * beatDuration + (Math.random() * 0.02 - 0.01);
      const vel = 0.42 + (idx % 2 === 0 ? 0.08 : 0);
      this.playPianoNote(this.m2f(note), 1.8, vel, true, delay);
    });

    this.bgmStep++;
    const nextWait = beatDuration * 4 * 1000;
    this.bgmTimer = window.setTimeout(() => {
      this.tickTownPiano();
    }, nextWait);
  }

  /**
   * INTENSE DRAMATIC PIANO (Boss Battle Mode)
   * High tempo, driving syncopated staccato bass, thrilling minor key arpeggios,
   * creating intense suspense, heartbeat urgency, and heroic struggle!
   */
  private tickBossPiano() {
    if (!this.isBgmPlaying || this.currentTrack !== 'boss') return;

    // 8-bar dramatic boss theme in D minor:
    // Dm -> Bb -> Gm -> A7 / C#dim -> Dm -> F -> Gm7 -> Asus4/A
    const bossPatterns = [
      // Bar 0: Dm drive
      { bass: [38, 38, 50, 38, 50, 38, 45, 50], treble: [62, 65, 69, 74, 77, 74, 69, 65] },
      // Bar 1: Bb tension
      { bass: [34, 34, 46, 34, 46, 34, 46, 50], treble: [65, 70, 74, 77, 82, 77, 74, 70] },
      // Bar 2: Gm pulse
      { bass: [43, 43, 55, 43, 55, 43, 50, 55], treble: [67, 70, 74, 79, 82, 79, 74, 70] },
      // Bar 3: A7 suspense climax
      { bass: [33, 33, 45, 33, 45, 45, 49, 52], treble: [69, 73, 76, 81, 85, 81, 76, 73] },
      // Bar 4: Dm rapid assault
      { bass: [38, 50, 38, 50, 38, 45, 50, 53], treble: [74, 77, 81, 86, 81, 77, 74, 69] },
      // Bar 5: F major heroic counter
      { bass: [41, 41, 53, 41, 53, 41, 48, 53], treble: [72, 77, 81, 84, 89, 84, 81, 77] },
      // Bar 6: Gm - E dim tension
      { bass: [40, 40, 52, 40, 43, 43, 55, 43], treble: [76, 79, 82, 85, 88, 85, 82, 79] },
      // Bar 7: A7 dominant push
      { bass: [33, 45, 33, 45, 57, 52, 49, 45], treble: [81, 85, 88, 93, 85, 81, 76, 73] },
    ];

    const currentBar = bossPatterns[this.bgmStep % bossPatterns.length];
    const sixteenth = 0.13; // fast allegro tempo (~154 BPM)

    // Staccato driving bass line
    currentBar.bass.forEach((note, idx) => {
      const delay = idx * sixteenth;
      this.playPianoNote(this.m2f(note), 0.35, 0.65, true, delay);
    });

    // Rapid treble runs / arpeggios
    currentBar.treble.forEach((note, idx) => {
      const delay = idx * sixteenth;
      this.playPianoNote(this.m2f(note), 0.45, 0.58 + (idx % 4 === 0 ? 0.15 : 0), true, delay);
    });

    this.bgmStep++;
    const nextWait = sixteenth * 8 * 1000;
    this.bgmTimer = window.setTimeout(() => {
      this.tickBossPiano();
    }, nextWait);
  }

  /**
   * CHEERFUL EXPLORATION PIANO (Track 3 / 音乐3)
   * Lighthearted, buoyant arpeggios in G major / C major.
   * Gentle, refreshing and inspiring for extended vocabulary exploration.
   */
  private tickForestPiano() {
    if (!this.isBgmPlaying || this.currentTrack !== 'forest') return;

    // 8-bar cheerful lyrical progression: G -> Em -> C -> D7 -> Bm7 -> Em7 -> Am7 -> D11
    const forestChords = [
      { bass: [43, 50, 55, 59], melody: [71, 74, 76, 79] }, // G
      { bass: [40, 47, 52, 55], melody: [74, 71, 67, 71] }, // Em
      { bass: [48, 52, 55, 60], melody: [72, 76, 79, 81] }, // C
      { bass: [45, 50, 54, 57], melody: [78, 76, 74, 71] }, // D7
      { bass: [47, 50, 54, 57], melody: [74, 78, 81, 78] }, // Bm7
      { bass: [40, 47, 52, 55], melody: [76, 74, 71, 67] }, // Em7
      { bass: [45, 48, 52, 57], melody: [69, 72, 76, 74] }, // Am7
      { bass: [50, 54, 57, 62], melody: [74, 78, 81, 83] }, // D11
    ];

    const currentBar = forestChords[this.bgmStep % forestChords.length];
    const beatDuration = 0.44; // moderate and buoyant (~136 BPM)

    // Gentle arpeggiated bass accompaniment
    currentBar.bass.forEach((note, idx) => {
      const delay = idx * beatDuration;
      this.playPianoNote(this.m2f(note), 1.6, 0.46, true, delay);
    });

    // Melodic right hand
    currentBar.melody.forEach((note, idx) => {
      const delay = idx * beatDuration + 0.04;
      this.playPianoNote(this.m2f(note), 1.4, 0.52, true, delay);
    });

    this.bgmStep++;
    const nextWait = beatDuration * 4 * 1000;
    this.bgmTimer = window.setTimeout(() => {
      this.tickForestPiano();
    }, nextWait);
  }

  // ================= SFX EFFECTS =================

  /**
   * Sound for regular correct answer (Crisp crystal chime + hit)
   */
  public playCorrect() {
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Chime notes C6 -> E6 -> G6 -> C7
    [1046.5, 1318.5, 1567.98, 2093.0].forEach((freq, i) => {
      this.playPianoNote(freq, 0.8, 0.6, false, i * 0.05);
    });

    // Soft sparkle whoosh
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(2400, now + 0.18);
    gain.gain.setValueAtTime(0.18 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  /**
   * Sound for CRITICAL HIT (RO iconic punchy chime & thunder)
   */
  public playCritical() {
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Heavy crash impact
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.35);
    gain.gain.setValueAtTime(0.35 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.36);

    // High critical ring
    [1760, 2637, 3520].forEach((freq, i) => {
      this.playPianoNote(freq, 1.2, 0.85, false, i * 0.03);
    });
  }

  /**
   * Sound for wrong answer / taking damage
   */
  public playWrong() {
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Low dull impact
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.25);
    gain.gain.setValueAtTime(0.28 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.3);

    // Discordant piano dissonance
    this.playPianoNote(220, 0.4, 0.4, false, 0);
    this.playPianoNote(233, 0.4, 0.35, false, 0.02);
  }

  /**
   * Level Up / Victory fanfare!
   */
  public playLevelUp() {
    this.initContext();
    if (!this.ctx) return;

    // Ascending victory chord
    const chord = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093.0];
    chord.forEach((freq, i) => {
      this.playPianoNote(freq, 1.5, 0.65, false, i * 0.07);
    });
  }

  /**
   * Coin / Zeny pickup
   */
  public playCoin() {
    this.initContext();
    if (!this.ctx) return;
    this.playPianoNote(987.77, 0.3, 0.5, false, 0); // B5
    this.playPianoNote(1318.51, 0.5, 0.65, false, 0.07); // E6
  }

  /**
   * Rare card / equipment drop sparkle
   */
  public playRareDrop() {
    this.initContext();
    if (!this.ctx) return;
    [1396.91, 1760.0, 2093.0, 2793.83].forEach((f, idx) => {
      this.playPianoNote(f, 0.9, 0.7, false, idx * 0.08);
    });
  }

  /**
   * Special skill / Bash / Double Strafe
   */
  public playSkillBash() {
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.18);
    gain.gain.setValueAtTime(0.3 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  /**
   * UI Click
   */
  public playClick() {
    this.initContext();
    if (!this.ctx) return;
    this.playPianoNote(880, 0.12, 0.25, false, 0);
  }

  /**
   * Pronounce English word using Web Speech API
   */
  public speakWord(text: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel(); // Stop prior speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.92; // slightly clearer pacing for language learners
      utterance.pitch = 1.05; // clear and friendly
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore speech synthesis sandbox restrictions if any
    }
  }
}

export const soundManager = new SoundManager();
