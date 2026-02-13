import { Player } from '../types/game.types';
import { PlayerManager } from './PlayerManager';

export class TurnManager {
  private playerManager: PlayerManager;
  private currentPlayerIndex: number = 0;
  private turnNumber: number = 0;

  constructor(playerManager: PlayerManager) {
    this.playerManager = playerManager;
  }

  getCurrentPlayer(): Player | undefined {
    const alivePlayers = this.playerManager.getAlivePlayers();
    if (alivePlayers.length === 0) return undefined;

    // Ensure index is within bounds
    if (this.currentPlayerIndex >= alivePlayers.length) {
      this.currentPlayerIndex = 0;
    }

    return alivePlayers[this.currentPlayerIndex];
  }

  nextTurn(): Player | undefined {
    const alivePlayers = this.playerManager.getAlivePlayers();
    if (alivePlayers.length === 0) return undefined;

    // Move to next player
    this.currentPlayerIndex++;
    if (this.currentPlayerIndex >= alivePlayers.length) {
      this.currentPlayerIndex = 0;
      this.turnNumber++;
    }

    return this.getCurrentPlayer();
  }

  getTurnNumber(): number {
    return this.turnNumber;
  }

  isGameOver(): boolean {
    const alivePlayers = this.playerManager.getAlivePlayers();

    // Game over if only one player left
    if (alivePlayers.length <= 1) {
      return true;
    }

    // Game over if someone reached the Door
    return alivePlayers.some((p) => p.position >= 20);
  }

  getWinner(): Player | undefined {
    const alivePlayers = this.playerManager.getAlivePlayers();

    // Check if someone reached the Door
    const doorWinner = alivePlayers.find((p) => p.position >= 20);
    if (doorWinner) return doorWinner;

    // Otherwise, last player standing
    if (alivePlayers.length === 1) {
      return alivePlayers[0];
    }

    return undefined;
  }
}
