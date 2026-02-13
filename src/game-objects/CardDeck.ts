import { Card, CardType } from '../types/game.types';
import { CARD_DISTRIBUTION } from '../config/cards.config';

export class CardDeck {
  private deck: Card[] = [];
  private discardPile: Card[] = [];

  constructor() {
    this.initializeDeck();
    this.shuffle();
  }

  private initializeDeck(): void {
    this.deck = [];

    // Build deck based on distribution
    Object.entries(CARD_DISTRIBUTION).forEach(([type, count]) => {
      for (let i = 0; i < count; i++) {
        this.deck.push(this.createCard(type as CardType));
      }
    });
  }

  private createCard(type: CardType): Card {
    const cardDefinitions: Record<CardType, Card> = {
      'judge-jury': {
        type: 'judge-jury',
        optionA: 'judge',
        optionB: 'jury',
        descriptionA: 'Select a target. They lose 1 life.',
        descriptionB: 'Choose a selector. They pick a victim who loses 2 lives.',
      },
      'summon-exile': {
        type: 'summon-exile',
        optionA: 'summon',
        optionB: 'exile',
        descriptionA: 'Move a target to your position.',
        descriptionB: 'Send a target to Jail. They lose 1 life and skip next turn.',
      },
      'resurrect-reap': {
        type: 'resurrect-reap',
        optionA: 'resurrect',
        optionB: 'reap',
        descriptionA: 'Revive a dead player at start with 1 life.',
        descriptionB: 'Instantly kill a target.',
      },
      'chaos': {
        type: 'chaos',
        optionA: 'can',
        optionB: 'ball',
        descriptionA: 'Target stands with can. You throw.',
        descriptionB: 'You stand with can. Target throws.',
      },
    };

    return cardDefinitions[type];
  }

  private shuffle(): void {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  drawCard(): Card | null {
    if (this.deck.length === 0) {
      this.reshuffleDiscardPile();
    }

    if (this.deck.length === 0) {
      return null; // No cards available
    }

    return this.deck.pop()!;
  }

  private reshuffleDiscardPile(): void {
    if (this.discardPile.length === 0) {
      return;
    }

    console.log('Reshuffling discard pile into deck');
    this.deck = [...this.discardPile];
    this.discardPile = [];
    this.shuffle();
  }

  discardCard(card: Card): void {
    this.discardPile.push(card);
  }

  getRemainingCards(): number {
    return this.deck.length;
  }

  getTotalCards(): number {
    return this.deck.length + this.discardPile.length;
  }

  reset(): void {
    this.initializeDeck();
    this.shuffle();
    this.discardPile = [];
  }
}
