export interface CharacterData {
  id: string;
  name: string;
  displayName: string;
  spritePath: string;
  color: number;
  aiStrategy?: 'aggressive' | 'cautious' | 'balanced' | 'random';
  aimSkill?: number; // 0-1, used for Chaos card
  description?: string;
}

export const CHARACTERS: CharacterData[] = [
  {
    id: 'miles',
    name: 'miles',
    displayName: 'Miles',
    spritePath: 'b-m-pixels-images/miles.png',
    color: 0x5b6ee1,
    aiStrategy: 'balanced',
    aimSkill: 0.6,
    description: 'Protagonist - Strategic and balanced',
  },
  {
    id: 'fara',
    name: 'fara',
    displayName: 'Fara',
    spritePath: 'b-m-pixels-images/Fara.png',
    color: 0xd95763,
    aiStrategy: 'cautious',
    aimSkill: 0.9, // Good aim per manuscript
    description: 'Builds alliances, excellent aim',
  },
  {
    id: 'innis',
    name: 'innis',
    displayName: 'Innis',
    spritePath: 'b-m-pixels-images/Innis.png',
    color: 0x4fa83d,
    aiStrategy: 'aggressive',
    aimSkill: 0.95, // "Eagle-eye" per manuscript
    description: 'Aggressive player, eagle-eye',
  },
  {
    id: 'kingston',
    name: 'kingston',
    displayName: 'Kingston',
    spritePath: 'b-m-pixels-images/Kingston.png',
    color: 0xfbf236,
    aiStrategy: 'cautious',
    aimSkill: 0.7,
    description: 'Cautious and methodical',
  },
  {
    id: 'gary-kent',
    name: 'gary-kent',
    displayName: 'Gary Kent',
    spritePath: 'b-m-pixels-images/GaryKent.png',
    color: 0xff9e64,
    aiStrategy: 'aggressive',
    aimSkill: 0.5,
    description: 'Aggressive and reactive',
  },
  {
    id: 'stacy',
    name: 'stacy',
    displayName: 'Stacy',
    spritePath: 'b-m-pixels-images/Stacy.png',
    color: 0xbb9af7,
    aiStrategy: 'balanced',
    aimSkill: 0.3, // Bad aim per manuscript
    description: 'Unpredictable, poor aim',
  },
  {
    id: 'paul',
    name: 'paul',
    displayName: 'Paul',
    spritePath: 'b-m-pixels-images/PaulBunyun.png',
    color: 0x99e550,
    aiStrategy: 'random',
    aimSkill: 0.4, // First eliminated in manuscript
    description: 'Chaotic and unpredictable',
  },
];

export const getCharacterById = (id: string): CharacterData | undefined => {
  return CHARACTERS.find((char) => char.id === id);
};
