import { CharacterData } from '../config/characters.config';

export interface Player {
  id: string;
  name: string;
  character: CharacterData;
  isAI: boolean;
  lives: number;
  position: number; // 0-20
  isEliminated: boolean;
  inJail: boolean;
  skippingTurn: boolean;
  color: number;
  hudRow: 'top' | 'bottom'; // Which row of portraits this player is in
  hudSlot: number;           // 1-indexed slot within that row
}

export interface BoardSquare {
  index: number;
  type: 'normal' | 'card' | 'jail' | 'door';
  x: number;
  y: number;
}

export type CardType = 'judge-jury' | 'summon-exile' | 'resurrect-reap' | 'chaos';
export type CardChoice = 'judge' | 'jury' | 'summon' | 'exile' | 'resurrect' | 'reap' | 'can' | 'ball';

export interface Card {
  type: CardType;
  optionA: CardChoice;
  optionB: CardChoice;
  descriptionA: string;
  descriptionB: string;
}
