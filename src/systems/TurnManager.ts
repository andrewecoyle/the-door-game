import { Player } from '../types/game.types';
import { PlayerManager } from './PlayerManager';

export class TurnManager {
  private playerManager: PlayerManager;
  // Track the current player by id (not index into the alive list) so that
  // eliminations mid-turn never skip or double-up anyone's turn.
  private currentPlayerId: string;
  private turnNumber: number = 0;
  private turnsTaken: Map<string, number> = new Map();
  private lightningRoundActive: boolean = false;

  constructor(playerManager: PlayerManager) {
    this.playerManager = playerManager;
    for (const player of playerManager.getPlayers()) {
      this.turnsTaken.set(player.id, 0);
    }
    this.currentPlayerId = playerManager.getPlayers()[0].id;
  }

  getCurrentPlayer(): Player | undefined {
    const player = this.playerManager.getPlayer(this.currentPlayerId);
    // If the current player died before starting their turn, advance to the
    // next living player.
    if (player && player.isEliminated) {
      return this.nextTurn();
    }
    return player;
  }

  recordTurnTaken(playerId: string): void {
    const current = this.turnsTaken.get(playerId) || 0;
    this.turnsTaken.set(playerId, current + 1);
    this.checkLightningRound();
  }

  private checkLightningRound(): void {
    if (this.lightningRoundActive) return;

    const alivePlayers = this.playerManager.getAlivePlayers();
    if (alivePlayers.length === 0) return;

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
    const allPlayers = this.playerManager.getPlayers();
    if (this.playerManager.getAlivePlayers().length === 0) return undefined;

    const currentIndex = allPlayers.findIndex((p) => p.id === this.currentPlayerId);

    // Walk forward through the fixed player order until we find someone alive
    for (let step = 1; step <= allPlayers.length; step++) {
      const index = (currentIndex + step) % allPlayers.length;
      const candidate = allPlayers[index];
      if (!candidate.isEliminated) {
        if (index <= currentIndex) {
          this.turnNumber++;
        }
        this.currentPlayerId = candidate.id;
        return candidate;
      }
    }

    return undefined;
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
