// Chiptune music data — note sequences played by AudioEngine's sequencer.
// Format: [beat, note, durationInBeats]. note 'x' is used for noise channels.

export type MusicTrackName = 'menu' | 'select' | 'game' | 'chaos' | 'victory';

export type ChannelWave = 'square' | 'triangle' | 'sawtooth' | 'sine' | 'noise';

export interface MusicChannel {
  wave: ChannelWave;
  volume: number;
  notes: Array<[number, string | null, number]>;
}

export interface MusicTrack {
  tempo: number;
  loopBeats: number;
  channels: MusicChannel[];
}

const SEMITONES: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6,
  G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};

export function noteToFreq(note: string): number {
  const m = note.match(/^([A-G][#b]?)(-?\d)$/);
  if (!m) return 440;
  const midi = SEMITONES[m[1]] + (parseInt(m[2], 10) + 1) * 12;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function hats(loopBeats: number, step: number, offset: number = 0.5): Array<[number, string, number]> {
  const out: Array<[number, string, number]> = [];
  for (let b = offset; b < loopBeats; b += step) out.push([b, 'x', 0.1]);
  return out;
}

// Title screen — slow, dark A-minor dirge
const MENU: MusicTrack = {
  tempo: 84,
  loopBeats: 16,
  channels: [
    {
      wave: 'triangle',
      volume: 0.5,
      notes: [
        [0, 'A2', 0.5], [0.5, 'A2', 0.5], [1, 'A3', 0.5], [1.5, 'A2', 0.5],
        [2, 'A2', 0.5], [2.5, 'A2', 0.5], [3, 'G2', 0.5], [3.5, 'G2', 0.5],
        [4, 'F2', 0.5], [4.5, 'F2', 0.5], [5, 'F3', 0.5], [5.5, 'F2', 0.5],
        [6, 'E2', 0.5], [6.5, 'E2', 0.5], [7, 'E2', 0.5], [7.5, 'G#2', 0.5],
        [8, 'A2', 0.5], [8.5, 'A2', 0.5], [9, 'A3', 0.5], [9.5, 'A2', 0.5],
        [10, 'A2', 0.5], [10.5, 'A2', 0.5], [11, 'G2', 0.5], [11.5, 'G2', 0.5],
        [12, 'F2', 0.5], [12.5, 'F2', 0.5], [13, 'D2', 0.5], [13.5, 'D2', 0.5],
        [14, 'E2', 0.5], [14.5, 'E2', 0.5], [15, 'E2', 0.5], [15.5, 'G#2', 0.5],
      ],
    },
    {
      wave: 'square',
      volume: 0.14,
      notes: [
        [0, 'A4', 1.5], [2, 'C5', 1], [3, 'B4', 1],
        [4, 'A4', 1.5], [6, 'G#4', 2],
        [8, 'A4', 1], [9, 'E5', 1.5], [11, 'D5', 1],
        [12, 'C5', 2], [14, 'B4', 1], [15, 'G#4', 1],
      ],
    },
  ],
};

// Character select — moodier D-minor groove with a bit of motion
const SELECT: MusicTrack = {
  tempo: 100,
  loopBeats: 16,
  channels: [
    {
      wave: 'square',
      volume: 0.3,
      notes: [
        [0, 'D2', 0.5], [0.5, 'D2', 0.5], [1, 'A2', 0.5], [1.5, 'D2', 0.5],
        [2, 'D2', 0.5], [2.5, 'D2', 0.5], [3, 'A2', 0.5], [3.5, 'C3', 0.5],
        [4, 'F2', 0.5], [4.5, 'F2', 0.5], [5, 'C3', 0.5], [5.5, 'F2', 0.5],
        [6, 'F2', 0.5], [6.5, 'F2', 0.5], [7, 'C3', 0.5], [7.5, 'Eb3', 0.5],
        [8, 'G2', 0.5], [8.5, 'G2', 0.5], [9, 'D3', 0.5], [9.5, 'G2', 0.5],
        [10, 'Bb2', 0.5], [10.5, 'Bb2', 0.5], [11, 'F3', 0.5], [11.5, 'Bb2', 0.5],
        [12, 'A2', 0.5], [12.5, 'A2', 0.5], [13, 'E3', 0.5], [13.5, 'A2', 0.5],
        [14, 'A2', 0.5], [14.5, 'C#3', 0.5], [15, 'E3', 0.5], [15.5, 'G3', 0.5],
      ],
    },
    {
      wave: 'triangle',
      volume: 0.4,
      notes: [
        [0, 'D4', 1], [1, 'F4', 1], [2, 'E4', 0.5], [2.5, 'F4', 0.5], [3, 'A4', 1],
        [4, 'A4', 1.5], [5.5, 'G4', 0.5], [6, 'F4', 1], [7, 'E4', 1],
        [8, 'G4', 1], [9, 'Bb4', 1], [10, 'A4', 0.5], [10.5, 'G4', 0.5], [11, 'F4', 1],
        [12, 'E4', 1], [13, 'C#4', 1], [14, 'D4', 2],
      ],
    },
    { wave: 'noise', volume: 0.07, notes: hats(16, 1) },
  ],
};

// In-game — sparse, low E-minor pulse that stays out of the way
const GAME: MusicTrack = {
  tempo: 72,
  loopBeats: 16,
  channels: [
    {
      wave: 'triangle',
      volume: 0.42,
      notes: [
        [0, 'E2', 1], [2, 'E2', 1], [4, 'C2', 1], [6, 'D2', 1],
        [8, 'E2', 1], [10, 'E2', 1], [12, 'B1', 1], [14, 'D2', 1],
      ],
    },
    {
      wave: 'square',
      volume: 0.09,
      notes: [
        [1, 'B3', 0.5], [5, 'G3', 0.5], [9, 'B3', 0.5], [10.5, 'E4', 0.5], [13, 'F#3', 0.5],
      ],
    },
  ],
};

// Chaos minigame — fast, tense E-minor ostinato with tritone stabs
const CHAOS: MusicTrack = {
  tempo: 150,
  loopBeats: 8,
  channels: [
    {
      wave: 'square',
      volume: 0.32,
      notes: [
        [0, 'E2', 0.5], [0.5, 'E2', 0.5], [1, 'E2', 0.5], [1.5, 'E2', 0.5],
        [2, 'Bb2', 0.5], [2.5, 'E2', 0.5], [3, 'E2', 0.5], [3.5, 'D2', 0.5],
        [4, 'E2', 0.5], [4.5, 'E2', 0.5], [5, 'E2', 0.5], [5.5, 'E2', 0.5],
        [6, 'G2', 0.5], [6.5, 'F2', 0.5], [7, 'E2', 0.5], [7.5, 'B1', 0.5],
      ],
    },
    {
      wave: 'square',
      volume: 0.12,
      notes: [
        [0, 'E5', 0.25], [1, 'E5', 0.25], [2, 'Bb4', 0.5],
        [4, 'E5', 0.25], [5, 'E5', 0.25], [6, 'G5', 0.25], [6.5, 'F#5', 0.25], [7, 'F5', 0.5],
      ],
    },
    { wave: 'noise', volume: 0.09, notes: hats(8, 0.5) },
  ],
};

// Win screen — bright C-major fanfare
const VICTORY: MusicTrack = {
  tempo: 140,
  loopBeats: 16,
  channels: [
    {
      wave: 'square',
      volume: 0.26,
      notes: [
        [0, 'C4', 0.25], [0.25, 'E4', 0.25], [0.5, 'G4', 0.25], [0.75, 'C5', 0.75],
        [1.5, 'G4', 0.5], [2, 'C5', 1.5],
        [4, 'F4', 0.5], [4.5, 'A4', 0.5], [5, 'C5', 1], [6, 'B4', 0.5], [6.5, 'D5', 1.5],
        [8, 'E5', 0.5], [8.5, 'D5', 0.5], [9, 'C5', 0.5], [9.5, 'G4', 0.5],
        [10, 'A4', 0.5], [10.5, 'B4', 0.5], [11, 'C5', 2],
        [13, 'D5', 0.5], [13.5, 'E5', 0.5], [14, 'G5', 2],
      ],
    },
    {
      wave: 'triangle',
      volume: 0.45,
      notes: [
        [0, 'C2', 1], [1, 'C2', 1], [2, 'C2', 1], [3, 'E2', 1],
        [4, 'F2', 1], [5, 'F2', 1], [6, 'G2', 1], [7, 'G2', 1],
        [8, 'C2', 1], [9, 'A1', 1], [10, 'F2', 1], [11, 'G2', 1],
        [12, 'C2', 1], [13, 'G2', 1], [14, 'C2', 2],
      ],
    },
    { wave: 'noise', volume: 0.1, notes: hats(16, 1, 0) },
  ],
};

export const MUSIC_TRACKS: Record<MusicTrackName, MusicTrack> = {
  menu: MENU,
  select: SELECT,
  game: GAME,
  chaos: CHAOS,
  victory: VICTORY,
};
