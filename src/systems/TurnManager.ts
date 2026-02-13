import { Player } from '../types/game.types';
import { PlayerManager } from './PlayerManager';

export class TurnManager {
  private playerManager: PlayerManager;
  private currentPlayerIndex: number = 0;
  private turnNumber: number = 0;
  private turnsTaken: Map<string, number> = new Map();
  private lightningRoundActive: boolean = false;

  constructor(playerManager: PlayerManager) {
    this.playerManager = playerManager;
    for (const player of playerManager.getPlayers()) {
      this.turnsTaken.set(player.id, 0);
    }
  }

  getCurrentPlayer(): Player | undefined {
    const alivePlayers = this.playerManager.getAlivePlayers();
    if (alivePlayers.length === 0) return undefined;

    if (this.currentPlayerIndex >= alivePlayers.length) {
      this.currentPlayerIndex = 0;
    }

    return alivePlayers[this.currentPlayerIndex];
  }

  recordTurnTaken(playerId: string): void {
    const current = this.turnsTaken.get(playerId) || 0;
    this.turnsTaken.set(playerId, current + 1);
    this.checkLightningRound();
  }

  private checkLightningRound(): void {
    if (this.lightningRoundActive) return;

    const alivePlayers = this.playerManager.getAlivePlayers();
    const minTurns = Math.min(
      ...alivePlayers.map(p => this.turnsTaken.get(p.id) || 0)
    );

    if (minTurns >= 4) {
      this.lightningRoundActive = true;
    }
  }

  isLightningRound(): boolean {
    return this.lightningRoundActive;
  }

  nextTurn(): Player | undefined {
    const alivePlayers = this.playerManager.getAlivePlayers();
    if (alivePlayers.length === 0) return undefined;

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
