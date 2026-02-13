import { Card, CardType } from '../types/game.types';

export const CARDS: Card[] = [
  {
    type: 'judge-jury',
    optionA: 'judge',
    optionB: 'jury',
    descriptionA: 'Select a target. They lose 1 life.',
    descriptionB: 'Choose a selector. They pick a victim who loses 2 lives.',
  },
  {
    type: 'summon-exile',
    optionA: 'summon',
    optionB: 'exile',
    descriptionA: 'Move a target to your position.',
    descriptionB: 'Send a target to Jail. They lose 1 life and skip next turn.',
  },
  {
    type: 'resurrect-reap',
    optionA: 'resurrect',
    optionB: 'reap',
    descriptionA: 'Revive a dead player at start with 1 life.',
    descriptionB: 'Instantly kill a target.',
  },
  {
    type: 'chaos',
    optionA: 'can',
    optionB: 'ball',
    descriptionA: 'Target stands with can. You throw.',
    descriptionB: 'You stand with can. Target throws.',
  },
];

// Card distribution for deck building
export const CARD_DISTRIBUTION: Record<CardType, number> = {
  'judge-jury': 6,
  'summon-exile': 6,
  'resurrect-reap': 6,
  'chaos': 4,
};

export const TOTAL_CARDS = Object.values(CARD_DISTRIBUTION).reduce((sum, count) => sum + count, 0);
