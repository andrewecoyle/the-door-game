// Chiptune audio engine — all sounds synthesized with Web Audio oscillators
// (square/triangle waves + noise), no asset files. Dark NES-style palette.

import { MUSIC_TRACKS, MusicTrackName, noteToFreq } from './tracks';

class Engine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private muted: boolean = false;
  private unlocked: boolean = false;
  private pendingTrack: MusicTrackName | null = null;
  private currentTrack: MusicTrackName | null = null;
  private loopTimer: number | null = null;
  private activeMusicNodes: Array<AudioScheduledSourceNode> = [];
  private trackGain: GainNode | null = null;

  constructor() {
    this.muted = typeof localStorage !== 'undefined' && localStorage.getItem('door-muted') === '1';
  }

  /** Call from a user-gesture handler. Safe to call repeatedly. */
  unlock(): void {
    // iOS mutes Web Audio when the hardware silent switch is on unless the
    // audio session is flagged as 'playback' (supported iOS 16.4+).
    try {
      const session = (navigator as any).audioSession;
      if (session && session.type !== 'playback') {
        session.type = 'playback';
      }
    } catch {
      /* unsupported */
    }
    if (!this.ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 0.5;
      this.masterGain.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.4;
      this.musicGain.connect(this.masterGain);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.9;
      this.sfxGain.connect(this.masterGain);

      // 1s of white noise, reused for percussion / whoosh sounds
      const len = this.ctx.sampleRate;
      this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    if (!this.unlocked) {
      this.unlocked = true;
      if (this.pendingTrack) {
        const t = this.pendingTrack;
        this.pendingTrack = null;
        this.playMusic(t);
      }
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    try {
      localStorage.setItem('door-muted', this.muted ? '1' : '0');
    } catch {
      /* private mode */
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.5, this.ctx.currentTime, 0.02);
    }
    return this.muted;
  }

  // ─── SFX ─────────────────────────────────────────────────────────────

  /** Single oscillator blip with optional pitch slide. */
  private tone(
    freq: number,
    duration: number,
    opts: {
      type?: OscillatorType;
      volume?: number;
      slideTo?: number;
      delay?: number;
      out?: GainNode;
    } = {}
  ): void {
    if (!this.ctx || !this.sfxGain) return;
    const { type = 'square', volume = 0.3, slideTo, delay = 0, out = this.sfxGain } = opts;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + duration);
    }
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.connect(gain);
    gain.connect(out);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }

  /** Filtered noise burst. */
  private noise(
    duration: number,
    opts: { volume?: number; filterFreq?: number; filterSlideTo?: number; delay?: number } = {}
  ): void {
    if (!this.ctx || !this.sfxGain || !this.noiseBuffer) return;
    const { volume = 0.3, filterFreq = 4000, filterSlideTo, delay = 0 } = opts;
    const t0 = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1;
    filter.frequency.setValueAtTime(filterFreq, t0);
    if (filterSlideTo !== undefined) {
      filter.frequency.exponentialRampToValueAtTime(filterSlideTo, t0 + duration);
    }
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(t0);
    src.stop(t0 + duration + 0.05);
  }

  sfx(name: SfxName): void {
    if (!this.ctx) return;
    switch (name) {
      case 'click': // generic button press
        this.tone(700, 0.07, { slideTo: 350, volume: 0.25 });
        break;
      case 'hover':
        this.tone(900, 0.03, { volume: 0.08 });
        break;
      case 'select': // character selected — rising two-note
        this.tone(523, 0.08, { volume: 0.25 });
        this.tone(784, 0.12, { volume: 0.25, delay: 0.08 });
        break;
      case 'confirm': // start game — rising three-note
        this.tone(523, 0.08, { volume: 0.28 });
        this.tone(659, 0.08, { volume: 0.28, delay: 0.08 });
        this.tone(1047, 0.18, { volume: 0.28, delay: 0.16 });
        break;
      case 'diceTick':
        this.tone(1100 + Math.random() * 300, 0.025, { volume: 0.1 });
        break;
      case 'diceLand':
        this.tone(220, 0.12, { type: 'triangle', slideTo: 110, volume: 0.4 });
        this.noise(0.06, { volume: 0.15, filterFreq: 900 });
        break;
      case 'move': // piece hop
        this.tone(440, 0.06, { slideTo: 660, volume: 0.12 });
        break;
      case 'cardDraw': // card swooshes in
        this.noise(0.2, { volume: 0.2, filterFreq: 600, filterSlideTo: 3000 });
        this.tone(330, 0.2, { slideTo: 880, volume: 0.18, delay: 0.05 });
        break;
      case 'cardReveal':
        this.tone(587, 0.1, { volume: 0.22 });
        this.tone(880, 0.16, { volume: 0.22, delay: 0.09 });
        break;
      case 'arrowTick':
        this.tone(1400, 0.018, { volume: 0.07 });
        break;
      case 'throw':
        this.noise(0.35, { volume: 0.3, filterFreq: 2500, filterSlideTo: 400 });
        break;
      case 'clang': // can hit — metallic
        this.tone(1480, 0.25, { type: 'square', volume: 0.3, slideTo: 1400 });
        this.tone(1870, 0.2, { type: 'square', volume: 0.2, slideTo: 1700 });
        this.noise(0.12, { volume: 0.3, filterFreq: 5000, filterSlideTo: 2000 });
        break;
      case 'bodyHit':
        this.tone(150, 0.18, { type: 'triangle', slideTo: 60, volume: 0.45 });
        this.noise(0.1, { volume: 0.2, filterFreq: 500 });
        break;
      case 'miss':
        this.tone(800, 0.5, { type: 'sine', slideTo: 250, volume: 0.2 });
        break;
      case 'death': // descending minor arpeggio
        this.tone(440, 0.12, { volume: 0.25 });
        this.tone(349, 0.12, { volume: 0.25, delay: 0.12 });
        this.tone(262, 0.12, { volume: 0.25, delay: 0.24 });
        this.tone(175, 0.3, { volume: 0.25, delay: 0.36 });
        break;
      case 'resurrect': // ascending bright arpeggio
        this.tone(262, 0.1, { type: 'triangle', volume: 0.3 });
        this.tone(330, 0.1, { type: 'triangle', volume: 0.3, delay: 0.1 });
        this.tone(392, 0.1, { type: 'triangle', volume: 0.3, delay: 0.2 });
        this.tone(523, 0.25, { type: 'triangle', volume: 0.3, delay: 0.3 });
        break;
      case 'lightning':
        this.noise(0.4, { volume: 0.35, filterFreq: 6000, filterSlideTo: 200 });
        this.tone(1200, 0.4, { type: 'sawtooth', slideTo: 100, volume: 0.2 });
        break;
      case 'jail':
        this.tone(196, 0.15, { type: 'square', volume: 0.3 });
        this.tone(185, 0.3, { type: 'square', volume: 0.3, delay: 0.16 });
        break;
    }
  }

  // ─── MUSIC ───────────────────────────────────────────────────────────

  playMusic(name: MusicTrackName): void {
    if (!this.unlocked || !this.ctx || !this.musicGain) {
      this.pendingTrack = name;
      return;
    }
    if (this.currentTrack === name) return;
    this.stopMusic();
    this.currentTrack = name;

    this.trackGain = this.ctx.createGain();
    this.trackGain.gain.value = 1;
    this.trackGain.connect(this.musicGain);

    const startAt = this.ctx.currentTime + 0.05;
    this.scheduleLoop(name, startAt);
  }

  private scheduleLoop(name: MusicTrackName, startAt: number): void {
    if (!this.ctx || !this.trackGain || this.currentTrack !== name) return;
    const track = MUSIC_TRACKS[name];
    const beatDur = 60 / track.tempo;
    const loopDur = track.loopBeats * beatDur;

    for (const ch of track.channels) {
      for (const [beat, note, durBeats] of ch.notes) {
        if (note === null) continue;
        const t0 = startAt + beat * beatDur;
        const dur = durBeats * beatDur * 0.92; // tiny gap between notes
        if (ch.wave === 'noise') {
          this.scheduleNoiseHit(t0, dur, ch.volume);
        } else {
          this.scheduleNote(noteToFreq(note), t0, dur, ch.wave, ch.volume);
        }
      }
    }

    // Re-schedule next loop iteration slightly before this one ends
    const msUntilNext = (startAt + loopDur - this.ctx.currentTime) * 1000 - 200;
    this.loopTimer = window.setTimeout(() => {
      this.scheduleLoop(name, startAt + loopDur);
      // Prune nodes that have already finished
      this.activeMusicNodes = this.activeMusicNodes.slice(-64);
    }, Math.max(50, msUntilNext));
  }

  private scheduleNote(
    freq: number,
    t0: number,
    dur: number,
    wave: OscillatorType,
    volume: number
  ): void {
    if (!this.ctx || !this.trackGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = wave;
    osc.frequency.value = freq;
    const gain = this.ctx.createGain();
    const attack = Math.min(0.01, dur * 0.2);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + attack);
    gain.gain.setValueAtTime(volume, t0 + dur * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.trackGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
    this.activeMusicNodes.push(osc);
  }

  private scheduleNoiseHit(t0: number, dur: number, volume: number): void {
    if (!this.ctx || !this.trackGain || !this.noiseBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 6000;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + Math.min(dur, 0.08));
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.trackGain);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
    this.activeMusicNodes.push(src);
  }

  stopMusic(): void {
    this.currentTrack = null;
    this.pendingTrack = null;
    if (this.loopTimer !== null) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
    if (this.trackGain && this.ctx) {
      // Quick fade to avoid clicks, then disconnect
      const g = this.trackGain;
      g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      window.setTimeout(() => g.disconnect(), 300);
      this.trackGain = null;
    }
    for (const node of this.activeMusicNodes) {
      try {
        node.stop();
      } catch {
        /* already stopped */
      }
    }
    this.activeMusicNodes = [];
  }
}

export type SfxName =
  | 'click'
  | 'hover'
  | 'select'
  | 'confirm'
  | 'diceTick'
  | 'diceLand'
  | 'move'
  | 'cardDraw'
  | 'cardReveal'
  | 'arrowTick'
  | 'throw'
  | 'clang'
  | 'bodyHit'
  | 'miss'
  | 'death'
  | 'resurrect'
  | 'lightning'
  | 'jail';

const AudioEngine = new Engine();
export default AudioEngine;
